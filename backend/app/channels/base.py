from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class NormalizedMessage(BaseModel):
    channel: str  # "zalo" | "mock"
    sender_id: str
    sender_name: str
    message_id: str
    message_type: str = "text"
    text: str
    phone: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    raw_event: Dict[str, Any] = Field(default_factory=dict)


class OutboundMessageResult(BaseModel):
    success: bool
    message_id: Optional[str] = None
    error: Optional[str] = None


class MessagingChannelAdapter(ABC):
    @abstractmethod
    def normalize_message(self, raw_event: Dict[str, Any]) -> NormalizedMessage:
        """Convert platform-specific raw payload to standard NormalizedMessage."""
        pass

    @abstractmethod
    async def send_message(
        self,
        recipient_id: str,
        text: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> OutboundMessageResult:
        """Send an outbound response back to the platform."""
        pass

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Check connection status and configuration validity."""
        pass
