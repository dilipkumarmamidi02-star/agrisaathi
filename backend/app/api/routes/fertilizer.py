from fastapi import APIRouter
from pydantic import BaseModel
from app.data.fertilizer_reference import CROP_NPK_PER_HECTARE, AREA_TO_HECTARE

router = APIRouter(prefix="/api", tags=["fertilizer"])


@router.get("/crops")
def list_crops():
    return [{"name_en": name} for name in sorted(CROP_NPK_PER_HECTARE.keys())]


# NOTE: a duplicate GET /soil-profiles route used to live here, shadowing
# the real, CSV-backed implementation in app/api/routes/soil_profiles.py
# (registered later in main.py, so this one always won). Removed — the
# real implementation is the only one now. See STATE_SOIL_PROFILES in
# fertilizer_reference.py if that hardcoded data is still needed
# elsewhere; it is no longer served at this path.


class FertilizerRequest(BaseModel):
    crop: str
    area: float
    unit: str
    soil_n: float | None = None
    soil_p: float | None = None
    soil_k: float | None = None
    soil_ph: float | None = None


@router.post("/fertilizer/calculate")
def calculate_fertilizer(req: FertilizerRequest):
    recommended = CROP_NPK_PER_HECTARE.get(req.crop)
    if not recommended:
        return {
            "summary": f"No standard reference available for {req.crop} yet.",
            "dosage": None,
            "method": None,
            "timing": None,
            "organic_option": None,
            "precautions": "Consult your nearest KVK for crop-specific dosage.",
            "assumptions": "This crop is not yet in our reference table.",
        }

    hectare_factor = AREA_TO_HECTARE.get(req.unit, 1.0)
    area_in_hectares = req.area * hectare_factor

    n_needed = recommended["n"] * area_in_hectares
    p_needed = recommended["p"] * area_in_hectares
    k_needed = recommended["k"] * area_in_hectares

    if req.soil_n is not None:
        n_needed = max(0, n_needed - req.soil_n * area_in_hectares * 0.1)
    if req.soil_p is not None:
        p_needed = max(0, p_needed - req.soil_p * area_in_hectares * 0.1)
    if req.soil_k is not None:
        k_needed = max(0, k_needed - req.soil_k * area_in_hectares * 0.1)

    ph_note = ""
    if req.soil_ph is not None:
        if req.soil_ph < 6.0:
            ph_note = "Soil is acidic — consider adding agricultural lime before fertilizing."
        elif req.soil_ph > 8.0:
            ph_note = "Soil is alkaline — consider gypsum application and organic matter."

    return {
        "summary": f"Recommended dosage for {req.crop} on {req.area} {req.unit}",
        "dosage": f"Nitrogen (N): {n_needed:.1f} kg, Phosphorus (P): {p_needed:.1f} kg, Potassium (K): {k_needed:.1f} kg",
        "method": "Apply phosphorus and potassium as basal dose at sowing/transplanting. Split nitrogen into 2-3 doses across the growing season.",
        "timing": "Basal dose at planting, first top-dressing at 25-30 days, second at flowering/tillering stage.",
        "organic_option": "Replace up to 25-50% of nitrogen with farmyard manure (FYM) or vermicompost, applied 2-3 weeks before sowing.",
        "precautions": ph_note or "Confirm with a soil test where possible. Avoid fertilizer application right before heavy rain.",
        "assumptions": "Based on general ICAR-recommended NPK levels for this crop; not adjusted for hybrid variety or micronutrient status.",
    }
