from typing import Any, Dict
from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import select
from app.db.database import AsyncSessionLocal
from app.models.system_setting import SystemSetting
from app.config.settings import settings

router = APIRouter()


class UpdateSettingsRequest(BaseModel):
    owner_name: str | None = None
    owner_zalo_id: str | None = None
    owner_phone: str | None = None
    llm_provider: str | None = None
    openai_model: str | None = None
    gemini_model: str | None = None
    openrouter_model: str | None = None


@router.get("/settings")
async def get_settings():
    async with AsyncSessionLocal() as session:
        stmt = select(SystemSetting)
        res = await session.execute(stmt)
        db_settings = {s.key: s.value_json for s in res.scalars().all()}

        return {
            "owner_name": db_settings.get("owner_name", settings.OWNER_NAME),
            "owner_zalo_id": db_settings.get("owner_zalo_id", settings.OWNER_ZALO_ID),
            "owner_phone": db_settings.get("owner_phone", settings.OWNER_PHONE),
            "llm_provider": db_settings.get("llm_provider", settings.LLM_PROVIDER),
            "openai_model": db_settings.get("openai_model", settings.OPENAI_MODEL),
            "gemini_model": db_settings.get("gemini_model", settings.GEMINI_MODEL),
            "openrouter_model": db_settings.get("openrouter_model", settings.OPENROUTER_MODEL),
            "max_agent_iterations": settings.MAX_AGENT_ITERATIONS,
            "short_term_memory_limit": settings.SHORT_TERM_MEMORY_LIMIT,
            "zalo_app_id": settings.ZALO_APP_ID or "Chưa cấu hình",
            "zalo_oa_id": settings.ZALO_OA_ID or "Chưa cấu hình",
        }


@router.put("/settings")
async def update_settings(req: UpdateSettingsRequest):
    async with AsyncSessionLocal() as session:
        updates = req.model_dump(exclude_unset=True)
        for k, v in updates.items():
            if v is not None:
                stmt = select(SystemSetting).where(SystemSetting.key == k)
                res = await session.execute(stmt)
                obj = res.scalar_one_or_none()
                if obj:
                    obj.value_json = v
                else:
                    obj = SystemSetting(key=k, value_json=v)
                    session.add(obj)
        await session.commit()
        return {"message": "Settings updated successfully", "updated": list(updates.keys())}
