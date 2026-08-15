import logging
from typing import Any, Dict, Optional
import httpx
from app.config.settings import settings

logger = logging.getLogger(__name__)


class ZaloClient:
    """
    Official Zalo OpenAPI Client.
    Sends consultation and transactional messages via official OpenAPI endpoints.
    """

    BASE_URL = "https://openapi.zalo.me/v3.0/oa"

    def __init__(self, access_token: Optional[str] = None):
        self.access_token = access_token or settings.ZALO_ACCESS_TOKEN

    async def send_text_message(self, user_id: str, text: str) -> Dict[str, Any]:
        if not self.access_token:
            logger.warning("ZALO_ACCESS_TOKEN is not configured. Simulating outbound message in DEMO mode.")
            return {"error": 0, "message": "Success (DEMO Mode)", "data": {"msg_id": "demo_zalo_outbound"}}

        url = f"{self.BASE_URL}/message/cs"
        headers = {
            "access_token": self.access_token,
            "Content-Type": "application/json",
        }
        payload = {
            "recipient": {"user_id": user_id},
            "message": {"text": text},
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                data = response.json()
                if data.get("error") != 0:
                    logger.error(f"Zalo API error response: {data}")
                return data
        except Exception as e:
            logger.error(f"Exception calling Zalo API: {str(e)}", exc_info=True)
            return {"error": -1, "message": str(e)}
