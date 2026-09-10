from fastapi import APIRouter, HTTPException, Query
from app.schemas.weather import WeatherResponse, ForecastResponse, AirQualityResponse
from app.services.weather_service import get_current_weather, get_weather_forecast, get_air_quality

router = APIRouter(prefix="/api/weather", tags=["weather"])


@router.get("/current", response_model=WeatherResponse)
async def current_weather(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    try:
        return await get_current_weather(lat, lon)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch weather: {e}")


@router.get("/forecast", response_model=ForecastResponse)
async def forecast(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    try:
        return await get_weather_forecast(lat, lon)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch forecast: {e}")

@router.get("/air-quality", response_model=AirQualityResponse)
async def air_quality(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    try:
        return await get_air_quality(lat, lon)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch air quality: {e}")

# ------------------------------------------------------------------
# AgriSaathi Weather Decision Intelligence
# ------------------------------------------------------------------

from fastapi import Query

@router.get("/intelligence")
def weather_intelligence(
    temperature_c: float = Query(...),
    humidity: float = Query(..., ge=0, le=100),
    precipitation_probability: float = Query(..., ge=0, le=100),
    precipitation_mm: float = Query(..., ge=0),
    wind_speed_kmh: float = Query(..., ge=0),
):
    """
    Deterministic agricultural weather decision layer.

    This endpoint does NOT pretend to be an ML model.
    It provides explainable safety rules that can be used
    alongside the weather forecast until a validated model
    is trained on sufficient historical agricultural data.
    """

    decisions = []
    alerts = []
    recommendations = []

    if precipitation_probability >= 70 or precipitation_mm >= 10:
        alerts.append("High rain risk")
        decisions.append("Delay pesticide and foliar spray operations.")
        decisions.append("Avoid unnecessary irrigation before rainfall.")

    elif precipitation_probability >= 40 or precipitation_mm >= 3:
        alerts.append("Moderate rain risk")
        decisions.append("Check field drainage and irrigation requirement.")

    else:
        decisions.append("Low immediate rainfall risk.")

    if humidity >= 85:
        alerts.append("Very high humidity")
        decisions.append("Increase disease scouting frequency.")
        recommendations.append(
            "Inspect leaves and crop canopy for fungal disease symptoms."
        )

    elif humidity >= 70:
        recommendations.append(
            "Monitor crop canopy because elevated humidity can increase disease pressure."
        )

    if temperature_c >= 35:
        alerts.append("Heat stress risk")
        decisions.append("Prefer irrigation during cooler periods.")
        recommendations.append(
            "Provide adequate soil moisture and monitor crops for heat stress."
        )

    elif temperature_c <= 10:
        alerts.append("Low temperature risk")
        recommendations.append(
            "Monitor temperature-sensitive crops for cold stress."
        )

    if wind_speed_kmh >= 25:
        alerts.append("Strong wind")
        decisions.append("Avoid spraying during strong wind.")
        recommendations.append(
            "Secure vulnerable structures and monitor lodging risk."
        )

    elif wind_speed_kmh >= 15:
        recommendations.append(
            "Check wind conditions before spraying or applying fine droplets."
        )

    if (
        precipitation_probability >= 60
        and humidity >= 80
    ):
        recommendations.append(
            "Increase disease monitoring after rainfall."
        )

    if not recommendations:
        recommendations.append(
            "Continue normal field monitoring and use current local forecast conditions."
        )

    risk_score = 0

    if precipitation_probability >= 70:
        risk_score += 30
    elif precipitation_probability >= 40:
        risk_score += 15

    if humidity >= 85:
        risk_score += 25
    elif humidity >= 70:
        risk_score += 10

    if temperature_c >= 35:
        risk_score += 20
    elif temperature_c <= 10:
        risk_score += 15

    if wind_speed_kmh >= 25:
        risk_score += 25
    elif wind_speed_kmh >= 15:
        risk_score += 10

    risk_score = min(risk_score, 100)

    if risk_score >= 70:
        risk_level = "HIGH"
    elif risk_score >= 40:
        risk_level = "MODERATE"
    else:
        risk_level = "LOW"

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "inputs": {
            "temperature_c": temperature_c,
            "humidity": humidity,
            "precipitation_probability": precipitation_probability,
            "precipitation_mm": precipitation_mm,
            "wind_speed_kmh": wind_speed_kmh,
        },
        "alerts": alerts,
        "decisions": decisions,
        "recommendations": recommendations,
        "model_status": "RULE_BASED_SAFETY_LAYER",
        "disclaimer": (
            "Agricultural decisions should also consider crop, growth stage, "
            "soil condition, local forecast and agronomic guidance."
        ),
    }
