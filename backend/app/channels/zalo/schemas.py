from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class ZaloSender(BaseModel):
    id: str


class ZaloRecipient(BaseModel):
    id: str


class ZaloMessagePayload(BaseModel):
    text: Optional[str] = None
    msg_id: Optional[str] = None


class ZaloWebhookEvent(BaseModel):
    app_id: Optional[str] = None
    user_id_by_app: Optional[str] = None
    event_name: Optional[str] = "user_send_text"
    timestamp: Optional[str] = None
    sender: Optional[ZaloSender] = None
    recipient: Optional[ZaloRecipient] = None
    message: Optional[ZaloMessagePayload] = None
    info: Optional[Dict[str, Any]] = None
