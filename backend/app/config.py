"""Application configuration.

Secrets are loaded from environment variables / .env — never hard-coded,
never sent to the frontend.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Complaint Management API"
    database_url: str = "postgresql://postgres:postgres@localhost:5432/complaints_db"
    groq_api_key: str = ""                 # empty => AI endpoints report a clear error
    groq_model: str = "gemma2-9b-it"
    frontend_origin: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()

# ── Upload validation constants (single place to tune) ──────────────
MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024   # 10 MB
ALLOWED_UPLOAD_EXTENSIONS = {".pdf", ".docx", ".txt", ".eml"}
MAX_TEXT_CHARS_FOR_LLM = 50_000           # truncate huge documents before LLM calls