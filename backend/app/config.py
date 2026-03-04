import os
from pydantic_settings import BaseSettings, SettingsConfigDict

# Get the directory where this file resides (backend/app)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_FILE = os.path.join(BASE_DIR, ".env")

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    DATABASE_URL: str

    model_config = SettingsConfigDict(env_file=ENV_FILE, extra="ignore")

settings = Settings()
