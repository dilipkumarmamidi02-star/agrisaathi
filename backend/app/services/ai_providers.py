import base64
import json
import httpx
from app.core.config import settings

class ProviderError(Exception):
    pass

def _b64(image_bytes: bytes) -> str:
    return base64.b64encode(image_bytes).decode("utf-8")

async def call_groq(prompt: str, images: list[bytes]) -> dict:
    if not settings.groq_api_key:
        raise ProviderError("groq not configured")

    content = [{"type": "text", "text": prompt}]

    for img in images:
        content.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:image/jpeg;base64,{_b64(img)}"
            }
        })

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.groq_api_key}"
            },
            json={
                "model": settings.groq_vision_model,
                "messages": [
                    {
                        "role": "user",
                        "content": content
                    }
                ],
                "response_format": {
                    "type": "json_object"
                }
            }
        )

        resp.raise_for_status()

        return json.loads(
            resp.json()["choices"][0]["message"]["content"]
        )

async def call_gemini(prompt: str, images: list[bytes]) -> dict:
    if not settings.gemini_api_key:
        raise ProviderError("gemini not configured")

    parts = [{"text": prompt}]

    for img in images:
        parts.append({
            "inline_data": {
                "mime_type": "image/jpeg",
                "data": _b64(img)
            }
        })

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_model}:generateContent"
        f"?key={settings.gemini_api_key}"
    )

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            url,
            json={
                "contents": [
                    {
                        "parts": parts
                    }
                ]
            }
        )

        resp.raise_for_status()

        text = (
            resp.json()["candidates"][0]
            ["content"]["parts"][0]["text"]
        )

        return json.loads(text)

async def call_ollama(prompt: str, images: list[bytes]) -> dict:
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            f"{settings.ollama_base_url}/api/generate",
            json={
                "model": settings.ollama_model,
                "prompt": prompt,
                "images": [
                    _b64(i)
                    for i in images
                ],
                "format": "json",
                "stream": False
            }
        )

        resp.raise_for_status()

        return json.loads(
            resp.json()["response"]
        )

PROVIDER_FUNCS = {
    "groq": call_groq,
    "gemini": call_gemini,
    "ollama": call_ollama
}

async def run_with_fallback(
    order_csv: str,
    prompt: str,
    images: list[bytes]
) -> dict:
    errors = []

    for name in [
        p.strip()
        for p in order_csv.split(",")
        if p.strip()
    ]:
        fn = PROVIDER_FUNCS.get(name)

        if not fn:
            continue

        try:
            result = await fn(prompt, images)
            result["_provider_used"] = name
            return result

        except Exception as e:
            errors.append(
                f"{name}: {e}"
            )

    raise ProviderError(
        "All providers failed — " +
        " | ".join(errors)
    )
