import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from app.channels.base import MessagingChannelAdapter, NormalizedMessage, OutboundMessageResult


class MockChatAdapter(MessagingChannelAdapter):
    def normalize_message(self, raw_event: Dict[str, Any]) -> NormalizedMessage:
        sender_id = raw_event.get("sender_id", "mock_user_1")
        sender_name = raw_event.get("sender_name", "User Demo")
        text = raw_event.get("text", "")
        message_id = raw_event.get("message_id") or f"mock_msg_{uuid.uuid4().hex[:10]}"
        phone = raw_event.get("phone")

        return NormalizedMessage(
            channel="mock",
            sender_id=sender_id,
            sender_name=sender_name,
            message_id=message_id,
            text=text,
            phone=phone,
            timestamp=datetime.utcnow(),
            raw_event=raw_event,
        )

    async def send_message(
        self,
        recipient_id: str,
        text: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> OutboundMessageResult:
        # For mock chat, messages are immediately returned in the response payload
        return OutboundMessageResult(
            success=True,
            message_id=f"outbound_mock_{uuid.uuid4().hex[:8]}",
        )

    async def health_check(self) -> Dict[str, Any]:
        return {
            "channel": "mock",
            "status": "DEMO",
            "message": "Mock Chat Adapter sẵn sàng hoạt động độc lập không cần Zalo credentials.",
        }


mock_adapter = MockChatAdapter()
