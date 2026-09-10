import base64
import json
import logging
from io import BytesIO
from typing import Any, Optional

import httpx
from google import genai
from PIL import Image, UnidentifiedImageError

from app.core.config import settings

logger = logging.getLogger(__name__)

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
OLLAMA_CHAT_URL = settings.ollama_base_url.rstrip("/") + "/api/chat"

GEMINI_MODEL = (
    settings.gemini_model.strip()
    if settings.gemini_model
    else "gemini-3.8-flash"
)

GROQ_MODEL = (
    settings.groq_vlm_model.strip()
    if settings.groq_vlm_model
    else "qwen/qwen3.6-27b"
)

OLLAMA_MODEL = (
    settings.ollama_vlm_model.strip()
    if settings.ollama_vlm_model
    else "gemma4:latest"
)

MAX_IMAGE_BYTES = 12 * 1024 * 1024
MAX_IMAGE_SIZE = 1024
GROQ_BATCH_SIZE = 3

QUALITY_SYSTEM_PROMPT = """
You are a careful agricultural produce quality assessment
vision expert.

Analyze ONLY visible evidence in the supplied images.

Never invent laboratory measurements.

Never claim hidden chemical, nutritional, moisture,
pesticide, microbiological, internal, or genetic properties.

Never make unsupported disease claims.

Assess visible:
- physical appearance
- colour
- visible size and shape
- uniformity
- visible damage
- bruising
- rot
- spots
- discoloration
- cleanliness
- visible defect indicators
- visible market quality

Return ONLY valid JSON.

Required structure:

{
  "samples": [
    {
      "sample_number": 1,
      "score": 0,
      "confidence": 0.0,
      "grade": "C",
      "observations": ["string"],
      "defects": ["string"],
      "quality_parameters": {
        "appearance": 0,
        "damage": 0,
        "cleanliness": 0,
        "uniformity": 0
      },
      "summary": "string"
    }
  ]
}

Score:
0-100.

Confidence:
0.0-1.0.

Grade:
A = 85-100
B = 70-84
C = 0-69.

The sample_number MUST correspond to the supplied image order.

Return exactly one result for every supplied image.
"""


def _resize_image(image_bytes: bytes) -> bytes:
    try:
        image = Image.open(BytesIO(image_bytes))
        image.load()

        if image.mode != "RGB":
            image = image.convert("RGB")

        image.thumbnail(
            (MAX_IMAGE_SIZE, MAX_IMAGE_SIZE),
            Image.Resampling.LANCZOS,
        )

        output = BytesIO()

        image.save(
            output,
            format="JPEG",
            quality=88,
            optimize=True,
        )

        normalized = output.getvalue()

        logger.info(
            "Quality image normalized: original=%d normalized=%d size=%sx%s",
            len(image_bytes),
            len(normalized),
            image.width,
            image.height,
        )

        return normalized

    except UnidentifiedImageError as exc:
        raise ValueError(
            "Uploaded file is not a valid image."
        ) from exc

    except Exception as exc:
        logger.exception("Image normalization failed.")

        raise ValueError(
            "Unable to read the uploaded image."
        ) from exc


def _prepare_images(
    image_bytes_list: list[bytes],
) -> list[str]:

    encoded_images = []

    for index, image_bytes in enumerate(
        image_bytes_list,
        start=1,
    ):
        if not image_bytes:
            raise ValueError(
                f"Sample {index} is empty."
            )

        if len(image_bytes) > MAX_IMAGE_BYTES:
            raise ValueError(
                f"Sample {index} exceeds the 10MB limit."
            )

        normalized = _resize_image(image_bytes)

        encoded_images.append(
            base64.b64encode(
                normalized
            ).decode("utf-8")
        )

    return encoded_images


def _extract_json(
    content: Any,
) -> Optional[dict[str, Any]]:

    if content is None:
        return None

    if isinstance(content, list):
        parts = []

        for item in content:
            if isinstance(item, dict):
                value = item.get("text")

                if value:
                    parts.append(str(value))

            elif isinstance(item, str):
                parts.append(item)

        content = "\n".join(parts)

    text = str(content).strip()

    if not text:
        return None

    while "<think>" in text and "</think>" in text:
        start = text.find("<think>")
        end = text.find("</think>", start)

        if end == -1:
            break

        text = (
            text[:start]
            + text[end + len("</think>"):]
        )

    text = text.replace("```json", "")
    text = text.replace("```JSON", "")
    text = text.replace("```", "")
    text = text.strip()

    try:
        parsed = json.loads(text)

        if isinstance(parsed, dict):
            return parsed

    except json.JSONDecodeError:
        pass

    start = text.find("{")
    end = text.rfind("}")

    if start >= 0 and end > start:
        try:
            parsed = json.loads(
                text[start:end + 1]
            )

            if isinstance(parsed, dict):
                return parsed

        except json.JSONDecodeError as exc:
            logger.error(
                "Quality JSON extraction failed: %s",
                exc,
            )

    return None


def _normalize_sample(
    result: dict[str, Any],
    source: str,
    model: str,
    sample_number: int,
) -> dict[str, Any]:

    try:
        score = float(
            result.get("score", 0)
        )
    except (TypeError, ValueError):
        score = 0.0

    score = max(
        0.0,
        min(100.0, score),
    )

    try:
        confidence = float(
            result.get("confidence", 0)
        )
    except (TypeError, ValueError):
        confidence = 0.0

    confidence = max(
        0.0,
        min(1.0, confidence),
    )

    if score >= 85:
        grade = "A"
    elif score >= 70:
        grade = "B"
    else:
        grade = "C"

    observations = result.get(
        "observations",
        [],
    )

    if not isinstance(
        observations,
        list,
    ):
        observations = [
            str(observations)
        ]

    observations = [
        str(item).strip()
        for item in observations
        if str(item).strip()
    ]

    defects = result.get(
        "defects",
        [],
    )

    if not isinstance(
        defects,
        list,
    ):
        defects = [
            str(defects)
        ]

    defects = [
        str(item).strip()
        for item in defects
        if str(item).strip()
    ]

    parameters = result.get(
        "quality_parameters",
        {},
    )

    if not isinstance(
        parameters,
        dict,
    ):
        parameters = {}

    normalized_parameters = {}

    for key in (
        "appearance",
        "damage",
        "cleanliness",
        "uniformity",
    ):
        try:
            value = float(
                parameters.get(
                    key,
                    0,
                )
            )
        except (
            TypeError,
            ValueError,
        ):
            value = 0.0

        normalized_parameters[key] = round(
            max(
                0.0,
                min(100.0, value),
            ),
            2,
        )

    summary = str(
        result.get(
            "summary",
            "",
        )
    ).strip()

    if not summary:
        summary = (
            "Visual quality assessment completed "
            "from the supplied sample image."
        )

    return {
        "source": source,
        "model": model,
        "sample_number": sample_number,
        "score": round(
            score,
            2,
        ),
        "confidence": round(
            confidence,
            4,
        ),
        "grade": grade,
        "observations": observations,
        "defects": defects,
        "quality_parameters": normalized_parameters,
        "summary": summary,
    }


def _normalize_batch(
    result: dict[str, Any],
    source: str,
    model: str,
    expected_count: int,
) -> list[dict[str, Any]]:

    samples = result.get("samples")

    if not isinstance(
        samples,
        list,
    ):
        raise ValueError(
            "AI provider did not return a samples array."
        )

    if len(samples) != expected_count:
        raise ValueError(
            f"AI provider returned {len(samples)} samples; "
            f"expected {expected_count}."
        )

    indexed = {}

    for position, sample in enumerate(
        samples,
        start=1,
    ):
        if not isinstance(
            sample,
            dict,
        ):
            raise ValueError(
                f"Invalid sample result at position {position}."
            )

        raw_number = sample.get(
            "sample_number",
            position,
        )

        try:
            sample_number = int(
                raw_number
            )
        except (
            TypeError,
            ValueError,
        ):
            sample_number = position

        if sample_number < 1:
            sample_number = position

        indexed[sample_number] = sample

    normalized = []

    for sample_number in range(
        1,
        expected_count + 1,
    ):
        sample = indexed.get(
            sample_number
        )

        if sample is None:
            raise ValueError(
                f"AI provider omitted sample {sample_number}."
            )

        normalized.append(
            _normalize_sample(
                result=sample,
                source=source,
                model=model,
                sample_number=sample_number,
            )
        )

    return normalized


def _build_prompt(
    commodity: str,
    variety: str | None,
    image_count: int,
) -> str:

    return f"""
{QUALITY_SYSTEM_PROMPT}

Commodity:
{commodity}

Variety:
{variety.strip() if variety else "Not specified"}

There are exactly {image_count} supplied sample images.

Analyze the images independently.

The first image is sample 1.
The second image is sample 2.
Continue in order.

Return exactly {image_count} objects
inside the samples array.
"""


def _analyze_with_gemini(
    encoded_images: list[str],
    commodity: str,
    variety: str | None,
) -> list[dict[str, Any]]:

    api_key = settings.gemini_api_key.strip()

    if not api_key:
        raise RuntimeError(
            "Gemini API key is not configured."
        )

    prompt = _build_prompt(
        commodity=commodity,
        variety=variety,
        image_count=len(encoded_images),
    )

    logger.info(
        "Starting Gemini quality analysis via SDK: model=%s images=%d",
        GEMINI_MODEL,
        len(encoded_images),
    )

    try:
        client = genai.Client(api_key=api_key)

        parts = [prompt]

        for encoded in encoded_images:
            parts.append(
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": encoded,
                    }
                }
            )

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=parts,
            config={
                "temperature": 0.1,
                "response_mime_type": "application/json",
            },
        )

    except Exception as exc:
        raise RuntimeError(
            f"Gemini SDK request failed: {exc}"
        ) from exc

    text = getattr(response, "text", None)

    if not text:
        raise RuntimeError(
            "Gemini returned an empty response."
        )

    try:
        result = json.loads(text)
    except json.JSONDecodeError:
        result = _extract_json(
            [
                {
                    "text": text,
                }
            ]
        )

    if not result:
        raise RuntimeError(
            "Gemini returned unreadable quality JSON."
        )

    return _normalize_batch(
        result=result,
        source="gemini_vlm",
        model=GEMINI_MODEL,
        expected_count=len(encoded_images),
    )

def _analyze_with_groq(
    encoded_images: list[str],
    commodity: str,
    variety: str | None,
) -> list[dict[str, Any]]:

    api_key = settings.groq_api_key.strip()

    if not api_key:
        raise RuntimeError(
            "Groq API key is not configured."
        )

    prompt = _build_prompt(
        commodity=commodity,
        variety=variety,
        image_count=len(encoded_images),
    )

    content = [
        {
            "type": "text",
            "text": prompt,
        }
    ]

    for encoded in encoded_images:
        content.append(
            {
                "type": "image_url",
                "image_url": {
                    "url": (
                        "data:image/jpeg;base64,"
                        + encoded
                    ),
                },
            }
        )

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a careful agricultural "
                    "produce quality vision analyst. "
                    "Return only valid JSON."
                ),
            },
            {
                "role": "user",
                "content": content,
            },
        ],
        "temperature": 0.1,
        "max_completion_tokens": 800,
        "response_format": {
            "type": "json_object",
        },
        "reasoning_effort": "none",
        "reasoning_format": "hidden",
        "stream": False,
    }

    timeout = httpx.Timeout(
        connect=15.0,
        read=120.0,
        write=60.0,
        pool=15.0,
    )

    logger.info(
        "Starting Groq quality analysis: model=%s images=%d",
        GROQ_MODEL,
        len(encoded_images),
    )

    try:
        with httpx.Client(
            timeout=timeout
        ) as client:
            response = client.post(
                GROQ_URL,
                headers={
                    "Authorization": (
                        f"Bearer {api_key}"
                    ),
                    "Content-Type": (
                        "application/json"
                    ),
                },
                json=payload,
            )

    except httpx.TimeoutException as exc:
        raise RuntimeError(
            f"Groq request timed out: {exc}"
        ) from exc

    except httpx.RequestError as exc:
        raise RuntimeError(
            f"Groq network request failed: {exc}"
        ) from exc

    if response.status_code != 200:
        raise RuntimeError(
            f"Groq HTTP {response.status_code}: "
            f"{response.text[:5000]}"
        )

    try:
        body = response.json()
    except Exception as exc:
        raise RuntimeError(
            "Groq returned invalid response JSON."
        ) from exc

    choices = body.get(
        "choices",
        [],
    )

    if not choices:
        raise RuntimeError(
            "Groq returned no choices."
        )

    message = choices[0].get(
        "message",
        {},
    )

    result = _extract_json(
        message.get(
            "content"
        )
    )

    if not result:
        raise RuntimeError(
            "Groq returned unreadable quality JSON."
        )

    return _normalize_batch(
        result=result,
        source="groq_vlm",
        model=GROQ_MODEL,
        expected_count=len(encoded_images),
    )


def _analyze_with_ollama(
    encoded_images: list[str],
    commodity: str,
    variety: str | None,
) -> list[dict[str, Any]]:

    if not settings.ollama_base_url.strip():
        raise RuntimeError(
            "Ollama base URL is not configured."
        )

    image_count = len(encoded_images)

    # Keep Ollama fallback deliberately small because local VLM
    # inference is much slower than the hosted providers.
    batch_size = 1

    all_results: list[dict[str, Any]] = []

    timeout = httpx.Timeout(
        connect=15.0,
        read=300.0,
        write=120.0,
        pool=15.0,
    )

    logger.info(
        "Starting Ollama quality fallback: model=%s images=%d batch_size=%d",
        OLLAMA_MODEL,
        image_count,
        batch_size,
    )

    for start in range(0, image_count, batch_size):
        batch_images = encoded_images[
            start:start + batch_size
        ]

        batch_start_number = start + 1
        batch_count = len(batch_images)

        prompt = _build_prompt(
            commodity=commodity,
            variety=variety,
            image_count=batch_count,
        )

        # _build_prompt already contains QUALITY_SYSTEM_PROMPT,
        # so do not send the same system prompt a second time.
        payload = {
            "model": OLLAMA_MODEL,
            "messages": [
                {
                    "role": "user",
                    "content": prompt,
                    "images": batch_images,
                },
            ],
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.1,
            },
        }

        logger.info(
            "Ollama quality batch: images=%d-%d of %d",
            batch_start_number,
            batch_start_number + batch_count - 1,
            image_count,
        )

        try:
            with httpx.Client(
                timeout=timeout
            ) as client:
                response = client.post(
                    OLLAMA_CHAT_URL,
                    headers={
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )

        except httpx.TimeoutException as exc:
            raise RuntimeError(
                f"Ollama request timed out for images "
                f"{batch_start_number}-{batch_start_number + batch_count - 1}: "
                f"{exc}"
            ) from exc

        except httpx.RequestError as exc:
            raise RuntimeError(
                f"Ollama network request failed for images "
                f"{batch_start_number}-{batch_start_number + batch_count - 1}: "
                f"{exc}"
            ) from exc

        if response.status_code != 200:
            raise RuntimeError(
                f"Ollama HTTP {response.status_code} for images "
                f"{batch_start_number}-{batch_start_number + batch_count - 1}: "
                f"{response.text[:5000]}"
            )

        try:
            body = response.json()
        except Exception as exc:
            raise RuntimeError(
                f"Ollama returned invalid response JSON for images "
                f"{batch_start_number}-{batch_start_number + batch_count - 1}."
            ) from exc

        message = body.get(
            "message",
            {},
        )

        result = _extract_json(
            message.get(
                "content"
            )
        )

        if not result:
            raise RuntimeError(
                f"Ollama returned unreadable quality JSON for images "
                f"{batch_start_number}-{batch_start_number + batch_count - 1}."
            )

        batch_results = _normalize_batch(
            result=result,
            source="ollama_vlm",
            model=OLLAMA_MODEL,
            expected_count=batch_count,
        )

        # Convert each local batch sample number back to the
        # original global image/sample number.
        for offset, sample in enumerate(
            batch_results
        ):
            sample["sample_number"] = (
                batch_start_number + offset
            )
            all_results.append(sample)

    if len(all_results) != image_count:
        raise RuntimeError(
            f"Ollama returned {len(all_results)} normalized samples; "
            f"expected {image_count}."
        )

    return all_results


def analyze_quality_images(
    image_bytes_list: list[bytes],
    commodity: str,
    variety: str | None = None,
) -> dict[str, Any]:

    if not image_bytes_list:
        raise ValueError(
            "At least one image is required."
        )

    commodity = commodity.strip()

    if not commodity:
        raise ValueError(
            "Commodity is required."
        )

    if len(image_bytes_list) > 10:
        raise ValueError(
            "Maximum 10 samples allowed."
        )

    encoded_images = _prepare_images(
        image_bytes_list
    )

    provider_errors = []

    try:
        results = _analyze_with_gemini(
            encoded_images=encoded_images,
            commodity=commodity,
            variety=variety,
        )

        return {
            "source": "gemini_vlm",
            "model": GEMINI_MODEL,
            "results": results,
            "providers_attempted": [
                "gemini_vlm"
            ],
            "provider_errors": [],
        }

    except Exception as exc:

        logger.warning(
            "Gemini quality analysis failed: %s",
            exc,
        )

        provider_errors.append(
            {
                "provider": "gemini_vlm",
                "model": GEMINI_MODEL,
                "error": str(exc),
            }
        )

    groq_results = []
    groq_failed = False

    for start in range(
        0,
        len(encoded_images),
        GROQ_BATCH_SIZE,
    ):

        chunk = encoded_images[
            start:start + GROQ_BATCH_SIZE
        ]

        try:

            chunk_results = _analyze_with_groq(
                encoded_images=chunk,
                commodity=commodity,
                variety=variety,
            )

            for offset, result in enumerate(
                chunk_results
            ):
                result["sample_number"] = (
                    start
                    + offset
                    + 1
                )

            groq_results.extend(
                chunk_results
            )

        except Exception as exc:

            groq_failed = True

            logger.warning(
                "Groq quality chunk failed "
                "for samples %d-%d: %s",
                start + 1,
                start + len(chunk),
                exc,
            )

            provider_errors.append(
                {
                    "provider": "groq_vlm",
                    "model": GROQ_MODEL,
                    "samples": (
                        f"{start + 1}-"
                        f"{start + len(chunk)}"
                    ),
                    "error": str(exc),
                }
            )

            break

    if (
        not groq_failed
        and len(groq_results)
        == len(image_bytes_list)
    ):

        groq_results.sort(
            key=lambda item: item[
                "sample_number"
            ]
        )

        return {
            "source": "groq_vlm",
            "model": GROQ_MODEL,
            "results": groq_results,
            "providers_attempted": [
                "gemini_vlm",
                "groq_vlm",
            ],
            "provider_errors": provider_errors,
        }

    try:

        results = _analyze_with_ollama(
            encoded_images=encoded_images,
            commodity=commodity,
            variety=variety,
        )

        return {
            "source": "ollama_vlm",
            "model": OLLAMA_MODEL,
            "results": results,
            "providers_attempted": [
                "gemini_vlm",
                "groq_vlm",
                "ollama_vlm",
            ],
            "provider_errors": provider_errors,
        }

    except Exception as exc:

        logger.exception(
            "All quality AI providers failed."
        )

        provider_errors.append(
            {
                "provider": "ollama_vlm",
                "model": OLLAMA_MODEL,
                "error": str(exc),
            }
        )

        raise RuntimeError(
            json.dumps(
                {
                    "message": (
                        "All quality analysis "
                        "providers failed."
                    ),
                    "providers": provider_errors,
                },
                default=str,
            )
        ) from exc


def analyze_quality_image(
    image_bytes: bytes,
    commodity: str,
    variety: str | None = None,
) -> dict[str, Any]:

    try:

        result = analyze_quality_images(
            image_bytes_list=[
                image_bytes
            ],
            commodity=commodity,
            variety=variety,
        )

        results = result.get(
            "results",
            [],
        )

        if not results:
            return {
                "source": "unavailable",
                "error": (
                    "No quality result was returned."
                ),
            }

        return results[0]

    except Exception as exc:

        logger.exception(
            "Single-image quality analysis failed."
        )

        return {
            "source": "unavailable",
            "error": str(exc),
            "model": "",
        }
