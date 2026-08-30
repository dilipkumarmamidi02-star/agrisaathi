import json
from groq import Groq
from app.core.config import settings
from app.schemas.crop_planner import CropPlanRequest, CropPlanResponse

client = Groq(api_key=settings.groq_api_key)


async def estimate_crops(req: CropPlanRequest) -> CropPlanResponse:
    prompt = f"""For an Indian farmer in {req.state or 'India'}{', ' + req.district + ' district' if req.district else ''}
with {req.water} water availability, {req.season or 'current'} season.
Soil test: {req.soil_context or 'unknown'}. Water quality: {req.water_context or 'no data'}.

Give a rough profit estimate (in Rs per acre) for these crops: {', '.join(req.crop_names)}.

Respond ONLY with strict JSON, no markdown:
{{"crops": [{{"name": "...", "cost": "Rs X/acre", "revenue": "Rs Y/acre", "margin": "Rs Z/acre", "note": "short note"}}]}}
Clearly this is an estimate, not a guarantee."""

    completion = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=800,
        response_format={"type": "json_object"},
    )

    raw = completion.choices[0].message.content
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        parsed = {"crops": []}

    return CropPlanResponse(crops=parsed.get("crops", []))
