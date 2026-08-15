from typing import Optional, Dict, Any, List
from fastapi import APIRouter
from pydantic import BaseModel
from app.config.settings import settings
from app.channels.zalocrm.adapter import zalocrm_adapter
from app.channels.mock.adapter import mock_adapter

router = APIRouter()


class TestChannelMessageRequest(BaseModel):
    channel: str = "zalocrm"
    recipient_id: Optional[str] = None
    text: str = "Tin nhắn kiểm tra từ Hermes Agent."


@router.get("/channels")
async def get_channels_status():
    zalocrm_status = await zalocrm_adapter.get_connection_status()
    mock_status = await mock_adapter.health_check()

    return [
        {
            "id": "zalocrm",
            "name": "Zalo Personal (ZaloCRM Gateway)",
            "status": zalocrm_status.get("status", "ONLINE (DEMO MODE)"),
            "base_url": settings.ZALOCRM_BASE_URL,
            "default_account_id": settings.ZALOCRM_DEFAULT_ACCOUNT_ID,
            "message": f"Connected to {settings.ZALOCRM_BASE_URL} (Account: {settings.ZALOCRM_DEFAULT_ACCOUNT_ID[:8]}...)",
            "description": "Zalo Gateway quản lý tài khoản Zalo cá nhân (QR Login, session persistence, send/receive message).",
            "details": zalocrm_status,
        },
        {
            "id": "mock",
            "name": "Mock Chat (Web Demo Console)",
            "status": "ONLINE",
            "message": "Web Demo Console sẵn sàng hoạt động",
            "description": "Kênh mô phỏng trực tiếp trên Web Dashboard phục vụ đánh giá đề tài khóa luận.",
            "details": {"status": "ONLINE", "ready": True},
        },
    ]


@router.post("/channels/test")
async def send_test_channel_message(req: TestChannelMessageRequest):
    # If recipient is empty or placeholder 'demo_recipient', fallback to OWNER_ZALO_ID
    recipient = (
        req.recipient_id
        if req.recipient_id and req.recipient_id not in ("demo_recipient", "string", "")
        else settings.OWNER_ZALO_ID
    )
    if req.channel in ("zalocrm", "zalo"):
        res = await zalocrm_adapter.send_message(recipient_id=recipient, text=req.text)
        return {"success": res.success, "recipient_id": recipient, "message_id": res.message_id, "error": res.error}
    else:
        res = await mock_adapter.send_message(recipient_id=recipient, text=req.text)
        return {"success": res.success, "recipient_id": recipient, "message_id": res.message_id, "error": res.error}
