from typing import Optional, Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel
from app.scheduler.service import scheduler_service
from app.config.settings import settings
from app.channels.zalocrm.adapter import zalocrm_adapter

router = APIRouter()


class TriggerBriefingRequest(BaseModel):
    recipient_id: Optional[str] = None


class SendProactiveReminderRequest(BaseModel):
    recipient_id: Optional[str] = None
    title: str = "Nhắc nhở công việc"
    text: str


@router.get("/scheduler/jobs")
async def get_scheduled_jobs():
    """Returns list of active scheduled background cron jobs."""
    jobs = scheduler_service.get_jobs()
    return {
        "status": "running",
        "total_jobs": len(jobs),
        "jobs": jobs,
    }


@router.post("/scheduler/morning-briefing")
async def trigger_morning_briefing(req: TriggerBriefingRequest):
    """
    Manually triggers the Morning Briefing proactive push to Zalo.
    Ideal for testing and live thesis demonstrations without waiting until 7:00 AM.
    """
    target = req.recipient_id or settings.OWNER_ZALO_ID
    result = await scheduler_service.send_morning_briefing(recipient_id=target)
    return result


@router.post("/scheduler/reminders")
async def send_proactive_reminder(req: SendProactiveReminderRequest):
    """Sends an on-demand proactive reminder notification to Zalo."""
    target = req.recipient_id or settings.OWNER_ZALO_ID
    full_text = f"🔔 [NHẮC NHỞ TỪ TIMA AI]\nTiêu đề: {req.title}\nNội dung: {req.text}"
    res = await zalocrm_adapter.send_message(recipient_id=target, text=full_text)
    return {
        "success": res.success,
        "recipient_id": target,
        "message_id": res.message_id,
        "error": res.error,
    }
