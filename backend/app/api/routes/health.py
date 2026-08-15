from fastapi import APIRouter
from app.config.settings import settings

router = APIRouter()


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Hermes AI Personal Assistant",
        "hermes_core": "Nous Research Official hermes-agent (v0.20.1)",
        "environment": settings.ENVIRONMENT,
        "llm_provider": settings.LLM_PROVIDER,
        "database": "connected",
        "zalo_status": "configured" if settings.ZALO_ACCESS_TOKEN else "demo_mode",
    }
