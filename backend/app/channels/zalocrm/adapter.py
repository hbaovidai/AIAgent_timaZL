import hmac
import hashlib
import logging
from typing import Any, Dict, Optional
from datetime import datetime
from app.channels.base import MessagingChannelAdapter, NormalizedMessage, OutboundMessageResult
from app.channels.zalocrm.client import zalocrm_client
from app.config.settings import settings

logger = logging.getLogger("zalocrm.adapter")


class ZaloCRMAdapter(MessagingChannelAdapter):
    """
    Channel Adapter for ZaloCRM (Personal Zalo Account Gateway).
    Normalizes ZaloCRM Webhook payloads into standard NormalizedMessage,
    verifies HMAC signatures, and sends replies via ZaloCRM REST API.
    """

    channel_name = "zalocrm"

    def __init__(self, client=None):
        self.client = client or zalocrm_client

    def verify_webhook_signature(self, raw_body: bytes, signature_header: Optional[str]) -> bool:
        """
        Verifies HMAC-SHA256 signature from ZaloCRM if ZALOCRM_WEBHOOK_SECRET is set.
        """
        secret = settings.ZALOCRM_WEBHOOK_SECRET
        if not secret or not signature_header:
            return True  # Allow open in dev / demo if secret is not set

        expected_sig = hmac.new(
            secret.encode("utf-8"),
            raw_body,
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(expected_sig, signature_header)

    def normalize_message(self, raw_event: Dict[str, Any]) -> NormalizedMessage:
        """
        Converts ZaloCRM webhook payload into standard NormalizedMessage:
        {
          "event": "message.received",
          "data": {
            "messageId": "...",
            "conversationId": "...",
            "senderUid": "...",
            "content": "..."
          }
        }
        """
        event = raw_event.get("event")
        data = raw_event.get("data", {})
        message_id = data.get("messageId") or f"zmsg_{hash(str(raw_event))}"
        sender_id = str(data.get("senderUid") or data.get("sender_id") or "unknown_zalo_user")
        sender_name = data.get("senderName") or f"Zalo User ({sender_id[-4:]})"
        content = (data.get("content") or "").strip()

        return NormalizedMessage(
            channel="zalocrm",
            sender_id=sender_id,
            sender_name=sender_name,
            message_id=message_id,
            message_type=data.get("contentType", "text"),
            text=content,
            phone=data.get("phone"),
            timestamp=datetime.utcnow(),
            raw_event=raw_event,
        )

    async def send_message(
        self,
        recipient_id: str,
        text: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> OutboundMessageResult:
        """
        Dispatches response back to Zalo user via ZaloCRM Public REST API:
        POST /api/public/messages/send
        """
        meta = metadata or {}
        account_id = meta.get("account_id") or settings.ZALOCRM_DEFAULT_ACCOUNT_ID
        thread_type = meta.get("thread_type", "user")

        res = await self.client.send_message(
            recipient_id=recipient_id,
            text=text,
            account_id=account_id,
            thread_type=thread_type,
        )

        if res.get("success"):
            return OutboundMessageResult(success=True, message_id=res.get("recipient_id"))
        else:
            return OutboundMessageResult(success=False, error=res.get("error", "Unknown send failure"))

    async def health_check(self) -> Dict[str, Any]:
        """Checks ZaloCRM Gateway connectivity."""
        return await self.client.get_connection_status()

    async def get_connection_status(self) -> Dict[str, Any]:
        return await self.health_check()


zalocrm_adapter = ZaloCRMAdapter()
