from pydantic import BaseModel
from typing import Optional

class WeatherResponse(BaseModel):
    location: Optional[str] = None
    temperature: float
    feels_like: Optional[float] = None
    humidity: Optional[int] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    wind_speed: Optional[float] = None
    wind_deg: Optional[float] = None
    rain_1h: Optional[float] = None
    sunrise: Optional[int] = None
    sunset: Optional[int] = None
    lat: float
    lon: float


class HourlySlot(BaseModel):
    time: str          # ISO timestamp
    temp: float
    description: str
    icon: str
    pop: float          # 0-100 chance of precipitation


class ForecastDay(BaseModel):
    date: str
    rain_probability: float  # 0-100, max chance of precipitation that day
    temp_min: float
    temp_max: float
    description: str
    icon: str


class ForecastResponse(BaseModel):
    location: str | None = None
    lat: float
    lon: float
    hourly: list[HourlySlot] = []
    days: list[ForecastDay]


class AirQualityResponse(BaseModel):
    aqi: int              # 1-5 OpenWeatherMap index
    aqi_label: str
    co: Optional[float] = None
    no2: Optional[float] = None
    o3: Optional[float] = None
    pm2_5: Optional[float] = None
    pm10: Optional[float] = None
