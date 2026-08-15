from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App Settings
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    FRONTEND_PORT: int = 5173
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:3080",
        "http://localhost:8000",
    ]

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./agent.db"

    # LLM Settings
    LLM_PROVIDER: str = "mock"  # "openai" | "gemini" | "openrouter" | "mock"
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"

    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-1.5-flash"

    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_MODEL: str = "anthropic/claude-3.5-sonnet"

    # Owner / Boss Configuration
    OWNER_NAME: str = "Chủ nhân"
    OWNER_ZALO_ID: str = "owner_zalo_id_example"
    OWNER_PHONE: Optional[str] = "0901234567"

    # ZaloCRM Gateway Settings (Personal Zalo Account Manager)
    ZALOCRM_BASE_URL: str = "http://localhost:3000"
    ZALOCRM_API_KEY: Optional[str] = None
    ZALOCRM_WEBHOOK_SECRET: Optional[str] = None
    ZALOCRM_DEFAULT_ACCOUNT_ID: str = "zalo_account_default"

    # Legacy Zalo OA Settings (Optional)
    ZALO_APP_ID: Optional[str] = None
    ZALO_APP_SECRET: Optional[str] = None
    ZALO_ACCESS_TOKEN: Optional[str] = None
    ZALO_REFRESH_TOKEN: Optional[str] = None
    ZALO_OA_ID: Optional[str] = None
    ZALO_WEBHOOK_SECRET: Optional[str] = None

    # Agent Limits
    MAX_AGENT_ITERATIONS: int = 8
    SHORT_TERM_MEMORY_LIMIT: int = 20
    EMBEDDING_DIMENSION: int = 1536

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
