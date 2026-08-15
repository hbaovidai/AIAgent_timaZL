import hmac
import hashlib
import uuid
import logging
from datetime import datetime
from typing import Any, Dict, Optional
from app.config.settings import settings
from app.channels.base import MessagingChannelAdapter, NormalizedMessage, OutboundMessageResult
from app.channels.zalo.client import ZaloClient

logger = logging.getLogger(__name__)


class ZaloAdapter(MessagingChannelAdapter):
    """
    Adapter for official Zalo OA platform.
    """

    def __init__(self, client: Optional[ZaloClient] = None):
        self.client = client or ZaloClient()

    def verify_signature(self, raw_body: bytes, signature_header: Optional[str], timestamp: Optional[str]) -> bool:
        """
        Verifies Zalo webhook signature (MAC / SHA256) if ZALO_WEBHOOK_SECRET is set.
        """
        secret = settings.ZALO_WEBHOOK_SECRET
        if not secret or not signature_header:
            # If no secret configured, allow in development/demo
            return True

        try:
            # Standard signature verification logic
            app_id = settings.ZALO_APP_ID or ""
            data_to_sign = f"{app_id}{raw_body.decode('utf-8')}{timestamp}{secret}"
            expected_mac = hashlib.sha256(data_to_sign.encode("utf-8")).hexdigest()
            return hmac.compare_digest(expected_mac, signature_header)
        except Exception as e:
            logger.error(f"Error validating Zalo signature: {str(e)}")
            return False

    def normalize_message(self, raw_event: Dict[str, Any]) -> NormalizedMessage:
        sender_obj = raw_event.get("sender") or {}
        sender_id = sender_obj.get("id") or raw_event.get("user_id_by_app") or "unknown_zalo_user"

        message_obj = raw_event.get("message") or {}
        text = message_obj.get("text") or raw_event.get("text") or ""
        msg_id = message_obj.get("msg_id") or raw_event.get("msg_id") or f"zalo_{uuid.uuid4().hex[:10]}"

        # Sender display name if provided by webhook info
        info_obj = raw_event.get("info") or {}
        sender_name = info_obj.get("name") or raw_event.get("sender_name") or f"Zalo User ({sender_id[:6]})"

        phone = info_obj.get("phone") or raw_event.get("phone")

        return NormalizedMessage(
            channel="zalo",
            sender_id=str(sender_id),
            sender_name=sender_name,
            message_id=str(msg_id),
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
        res = await self.client.send_text_message(user_id=recipient_id, text=text)
        if res.get("error") == 0:
            msg_id = res.get("data", {}).get("msg_id", f"out_{uuid.uuid4().hex[:8]}")
            return OutboundMessageResult(success=True, message_id=msg_id)
        else:
            return OutboundMessageResult(success=False, error=res.get("message", "Unknown error"))

    async def health_check(self) -> Dict[str, Any]:
        has_creds = bool(settings.ZALO_APP_ID and settings.ZALO_ACCESS_TOKEN)
        status = "CONNECTED" if has_creds else "DEMO"
        return {
            "channel": "zalo",
            "status": status,
            "oa_id": settings.ZALO_OA_ID or "Chưa cấu hình",
            "app_id": settings.ZALO_APP_ID or "Chưa cấu hình",
            "has_access_token": bool(settings.ZALO_ACCESS_TOKEN),
            "message": "Zalo Adapter kết nối thành công." if has_creds else "Chưa có đủ Zalo credentials. Hệ thống tự động chuyển sang chế độ DEMO MODE (hoạt động đầy đủ qua MockChat).",
        }


zalo_adapter = ZaloAdapter()
