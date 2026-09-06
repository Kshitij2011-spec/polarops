"""Application configuration loaded from environment variables."""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """PolarOps backend configuration.

    All values can be overridden via environment variables or a .env file.
    """

    # --- Application ---
    APP_NAME: str = "polarops-api"
    DEBUG: bool = False
    PORT: int = 8000

    # --- CORS ---
    # Default origins for local development.
    # In production, set FRONTEND_ORIGIN to the deployed frontend URL
    # (e.g. https://polarops.vercel.app).
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    FRONTEND_ORIGIN: str = ""

    # --- Database ---
    DATABASE_URL: str = "sqlite:///./polarops_dev.db"

    # --- Supabase (optional, for future use) ---
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @property
    def effective_cors_origins(self) -> list[str]:
        """Return CORS origins including FRONTEND_ORIGIN when configured."""
        origins = list(self.CORS_ORIGINS)
        if self.FRONTEND_ORIGIN and self.FRONTEND_ORIGIN not in origins:
            origins.append(self.FRONTEND_ORIGIN)
        return origins


settings = Settings()
