from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BASE_DIR / ".env"
load_dotenv(ENV_FILE, override=False)

class Settings(BaseSettings):
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.8-flash"
    ollama_base_url: str = "http://127.0.0.1:11434"
    ollama_vlm_model: str = "gemma4:latest"
    groq_api_key: str = ""
    cerebras_api_key: str = ""
    hf_api_token: str = ""
    firebase_project_id: str = ""
    firebase_service_account_path: str = "./firebase-service-account.json"
    environment: str = "development"
    allowed_origins: str = "http://localhost:5173"
    hf_disease_model: str = "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification"
    hf_confidence_threshold: float = 0.55
    groq_vlm_model: str = "qwen/qwen3.6-27b"
    weather_api_key: str = ""
    weather_api_url: str = "https://api.openweathermap.org/data/2.5"

    data_gov_api_key: str = ""
    admin_email: str = ""

    # Email OTP configuration
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "AgriSaathi"
    otp_expire_minutes: int = 10
    otp_resend_seconds: int = 60
    otp_max_attempts: int = 5
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

settings = Settings()
print("✅ Settings loaded")
print(f"   Groq configured: {bool(settings.groq_api_key)}")
