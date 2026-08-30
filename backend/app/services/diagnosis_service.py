import base64
import json
import os
import httpx
import logging
import re
from io import BytesIO
from PIL import Image
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

DISCLAIMER = "AI-assisted estimate only. Confirm with a KVK expert before applying treatment."
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

# Vision-capable model. Reads GROQ_VLM_MODEL from .env if set, otherwise
# falls back to Groq's current vision model. the configured Groq vision model is
# TEXT-ONLY and must never be used here — it silently ignores images.
VISION_MODEL = os.environ.get("GROQ_VLM_MODEL", "qwen/qwen3.6-27b")


def _resize_image(image_bytes: bytes, max_size: int = 768) -> bytes:
    try:
        img = Image.open(BytesIO(image_bytes))
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')
        img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=85, optimize=True)
        return buffer.getvalue()
    except Exception as e:
        logger.warning(f"Image resize failed: {e}")
        return image_bytes


def _extract_json_from_text(text: str) -> Optional[Dict]:
    if not text:
        return None

    # Strip reasoning-model <think>...</think> blocks (qwen and similar
    # models emit these before the actual answer)
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    text = text.strip()

    # Try greedy match first (handles nested braces better than the old
    # non-nested [^{}]* pattern, which broke on nested arrays/objects)
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1 and end > start:
        candidate = text[start:end + 1]
        try:
            return json.loads(candidate)
        except Exception:
            pass

    try:
        return json.loads(text)
    except Exception:
        return None


def diagnose_image(image_bytes: bytes, crop_hint: str = None) -> Dict[str, Any]:
    if not settings.groq_api_key:
        return {
            "source": "unavailable",
            "model_name": None,
            "disease_name": "Unable to determine",
            "confidence": 0.0,
            "description": "Groq API key not configured",
            "symptoms": [],
            "treatment_advice": [],
            "prevention": [],
            "severity": "unknown",
            "expert_review_required": True,
            "disclaimer": DISCLAIMER,
        }

    try:
        resized_bytes = _resize_image(image_bytes, 768)
        image_b64 = base64.b64encode(resized_bytes).decode()

        prompt_text = f"""You are an expert agricultural pathologist. Carefully examine the attached photo of a {crop_hint or "crop/plant"} and identify any visible disease, pest damage, or nutrient deficiency based on what you actually see in the image — leaf color, spots, lesions, wilting, discoloration, insect damage, etc.

Crop type: {crop_hint or "unknown, infer from the image if possible"}

Respond with ONLY valid JSON, no markdown, in exactly this shape:
{{"disease_name": "string", "confidence": 0.0-1.0, "description": "string describing what you observed in the image", "symptoms": ["string", ...], "treatment_advice": ["string", ...], "prevention": ["string", ...], "severity": "low|moderate|high|critical"}}

If the plant in the image looks healthy with no visible issues, set disease_name to "Healthy - no disease detected" and confidence to how certain you are of that.

Keep any internal reasoning brief. Output ONLY the final JSON object as your last line — no text after it."""

        payload = {
            "model": VISION_MODEL,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt_text},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"},
                        },
                    ],
                }
            ],
            "temperature": 0.2,
            "max_completion_tokens": 4000,
            "reasoning_format": "hidden",
        }

        headers = {
            "Authorization": f"Bearer {settings.groq_api_key}",
            "Content-Type": "application/json",
        }

        with httpx.Client(timeout=60) as client:
            response = client.post(GROQ_URL, headers=headers, json=payload)

        if response.status_code == 200:
            data = response.json()
            choices = data.get("choices", [])
            if choices:
                content = choices[0].get("message", {}).get("content", "")
                result = _extract_json_from_text(content)
                if result:
                    return {
                        "source": "groq_vlm",
                        "model_name": VISION_MODEL,
                        **result,
                        "expert_review_required": True,
                        "disclaimer": DISCLAIMER,
                    }
                logger.error(f"Could not parse JSON from Groq response (len={len(content)}): {content}")
        else:
            logger.error(f"Groq API error {response.status_code}: {response.text[:500]}")

        return {
            "source": "unavailable",
            "model_name": VISION_MODEL,
            "disease_name": "Unable to determine",
            "confidence": 0.0,
            "description": "Failed to analyze image",
            "symptoms": [],
            "treatment_advice": [],
            "prevention": [],
            "severity": "unknown",
            "expert_review_required": True,
            "disclaimer": DISCLAIMER,
        }

    except Exception as e:
        logger.error(f"Diagnosis error: {e}")
        return {
            "source": "unavailable",
            "model_name": None,
            "disease_name": "Unable to determine",
            "confidence": 0.0,
            "description": str(e),
            "symptoms": [],
            "treatment_advice": [],
            "prevention": [],
            "severity": "unknown",
            "expert_review_required": True,
            "disclaimer": DISCLAIMER,
        }
