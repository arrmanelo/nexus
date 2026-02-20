from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    GEMINI_API_KEY: str
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_KEY: str
    JWT_SECRET: str
    CORS_ORIGINS: List[str] = ["http://localhost:5173"]

    class Config:
        env_file = ".env"

settings = Settings()
