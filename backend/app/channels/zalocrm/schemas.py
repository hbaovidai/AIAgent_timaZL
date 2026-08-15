from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class ZaloCRMMessageData(BaseModel):
    messageId: str = Field(..., description="Unique message ID from ZaloCRM / Zalo")
    conversationId: Optional[str] = Field(None, description="ZaloCRM conversation UUID")
    senderUid: str = Field(..., description="Zalo User ID / Contact UID")
    senderName: Optional[str] = Field("Zalo User", description="Display name of sender")
    content: str = Field(..., description="Text content of message")
    contentType: str = Field("text", description="Message type: text, image, file...")
    sentAt: Optional[str] = None
    account_id: Optional[str] = None


class ZaloCRMWebhookPayload(BaseModel):
    event: str = Field(..., description="Event name: message.received, zalo.connected, etc.")
    timestamp: str = Field(..., description="Event ISO timestamp")
    data: ZaloCRMMessageData


class ZaloCRMSendMessageRequest(BaseModel):
    zaloAccountId: str
    threadId: str
    content: str
    threadType: str = "user"  # "user" | "group"
