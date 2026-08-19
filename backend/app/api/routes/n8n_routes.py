import json
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from app.channels.zalocrm.adapter import zalocrm_adapter
from app.config.settings import settings

logger = logging.getLogger("n8n.routes")
router = APIRouter(prefix="/api/n8n", tags=["n8n Automation"])


class N8nIncomingEventRequest(BaseModel):
    source: str = "n8n_workflow"
    event_title: str = "Sự kiện tự động từ n8n"
    data: Dict[str, Any] = {}
    priority: Optional[str] = "NORMAL"
    notify_owner_zalo: Optional[bool] = True


@router.post("/incoming-event")
async def handle_n8n_incoming_event(
    payload: N8nIncomingEventRequest,
    background_tasks: BackgroundTasks,
):
    """
    Receives automated trigger events from n8n workflows (e.g. Google Sheets, Gmail, Facebook Lead)
    and autonomously dispatches real-time alerts to the Owner's Zalo.
    """
    logger.info(f"[n8n Inbound] Received event '{payload.event_title}' from source '{payload.source}'")

    details_str = "\n".join([f"  • **{k}**: {v}" for k, v in payload.data.items()]) if payload.data else "  • Không có chi tiết bổ sung."

    alert_message = (
        f"⚡ [N8N AUTOMATION NOTIFICATION]\n"
        f"Nguồn: **{payload.source.upper()}**\n"
        f"Sự kiện: **{payload.event_title}**\n\n"
        f"📋 **Chi tiết dữ liệu**:\n"
        f"{details_str}\n\n"
        f"🤖 *Tima AI Agent đã tự động ghi nhận luồng này từ n8n Gateway.*"
    )

    if payload.notify_owner_zalo and settings.OWNER_ZALO_ID:
        background_tasks.add_task(
            zalocrm_adapter.send_message,
            recipient_id=settings.OWNER_ZALO_ID,
            text=alert_message,
            metadata={"source": "n8n_inbound_alert"},
        )

    return {
        "success": True,
        "status": "EVENT_PROCESSED_AND_DISPATCHED",
        "source": payload.source,
        "event_title": payload.event_title,
        "notified_zalo": bool(payload.notify_owner_zalo),
    }


@router.get("/status")
async def get_n8n_status():
    """Returns status and connection details of local n8n gateway."""
    return {
        "status": "ONLINE",
        "n8n_ui_url": "http://localhost:5678",
        "webhook_base_url": "http://localhost:5678/webhook/",
        "features": [
            "Bi-directional Webhook Gateway",
            "400+ Enterprise Connectors (Google Sheets, Notion, Gmail, Telegram)",
            "Automated Inbound Alert Dispatching to Zalo",
        ],
    }
