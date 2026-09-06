import httpx
from app.core.config import settings
from app.schemas.weather import WeatherResponse, ForecastResponse, ForecastDay, HourlySlot, AirQualityResponse
from collections import defaultdict
from datetime import datetime

AQI_LABELS = {1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Very Poor"}


async def get_current_weather(lat: float, lon: float) -> WeatherResponse:
    params = {
        "lat": lat,
        "lon": lon,
        "appid": settings.weather_api_key,
        "units": "metric",
    }
    last_error = None
    for attempt in range(2):
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(f"{settings.weather_api_url}/weather", params=params)
                resp.raise_for_status()
                data = resp.json()
            last_error = None
            break
        except Exception as e:
            last_error = e
    if last_error:
        raise last_error

    return WeatherResponse(
        location=data.get("name"),
        temperature=data["main"]["temp"],
        feels_like=data["main"].get("feels_like"),
        humidity=data["main"].get("humidity"),
        description=(data.get("weather") or [{}])[0].get("description"),
        icon=(data.get("weather") or [{}])[0].get("icon"),
        wind_speed=data.get("wind", {}).get("speed"),
        wind_deg=data.get("wind", {}).get("deg"),
        rain_1h=data.get("rain", {}).get("1h"),
        sunrise=data.get("sys", {}).get("sunrise"),
        sunset=data.get("sys", {}).get("sunset"),
        lat=lat,
        lon=lon,
    )


async def get_weather_forecast(lat: float, lon: float) -> ForecastResponse:
    """5-day / 3-hour forecast: hourly slots for the next 24h, plus daily summaries."""
    params = {
        "lat": lat,
        "lon": lon,
        "appid": settings.weather_api_key,
        "units": "metric",
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(f"{settings.weather_api_url}/forecast", params=params)
        resp.raise_for_status()
        data = resp.json()

    entries = data.get("list", [])

    hourly = []
    for entry in entries[:8]:  # next ~24h in 3h steps
        hourly.append(HourlySlot(
            time=datetime.utcfromtimestamp(entry["dt"]).isoformat(),
            temp=round(entry["main"]["temp"], 1),
            description=(entry.get("weather") or [{}])[0].get("description", ""),
            icon=(entry.get("weather") or [{}])[0].get("icon", ""),
            pop=round(entry.get("pop", 0) * 100, 1),
        ))

    by_date = defaultdict(list)
    for entry in entries:
        date_str = datetime.utcfromtimestamp(entry["dt"]).strftime("%Y-%m-%d")
        by_date[date_str].append(entry)

    days = []
    for date_str, day_entries in sorted(by_date.items())[:5]:
        max_pop = max((e.get("pop", 0) for e in day_entries), default=0) * 100
        temps = [e["main"]["temp"] for e in day_entries]
        mid_entry = day_entries[len(day_entries) // 2]
        days.append(ForecastDay(
            date=date_str,
            rain_probability=round(max_pop, 1),
            temp_min=round(min(temps), 1),
            temp_max=round(max(temps), 1),
            description=(mid_entry.get("weather") or [{}])[0].get("description", ""),
            icon=(mid_entry.get("weather") or [{}])[0].get("icon", ""),
        ))

    return ForecastResponse(
        location=data.get("city", {}).get("name"),
        lat=lat,
        lon=lon,
        hourly=hourly,
        days=days,
    )


async def get_air_quality(lat: float, lon: float) -> AirQualityResponse:
    params = {
        "lat": lat,
        "lon": lon,
        "appid": settings.weather_api_key,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(f"{settings.weather_api_url.replace('/data/2.5', '')}/data/2.5/air_pollution", params=params)
        resp.raise_for_status()
        data = resp.json()

    item = (data.get("list") or [{}])[0]
    aqi = item.get("main", {}).get("aqi", 0)
    components = item.get("components", {})

    return AirQualityResponse(
        aqi=aqi,
        aqi_label=AQI_LABELS.get(aqi, "Unknown"),
        co=components.get("co"),
        no2=components.get("no2"),
        o3=components.get("o3"),
        pm2_5=components.get("pm2_5"),
        pm10=components.get("pm10"),
    )
