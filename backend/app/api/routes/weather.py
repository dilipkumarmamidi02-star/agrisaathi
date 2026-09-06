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
