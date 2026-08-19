import logging
import httpx
from typing import Any, Dict, Optional
from app.config.settings import settings

logger = logging.getLogger("zalocrm.client")


class ZaloCRMClient:
    """
    Client for interacting with ZaloCRM Public REST API.
    Handles message dispatching, connection health checks, and conversation lookup.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
    ):
        self.base_url = (base_url or settings.ZALOCRM_BASE_URL).rstrip("/")
        self.api_key = api_key or settings.ZALOCRM_API_KEY
        self.timeout = httpx.Timeout(10.0, connect=5.0)

    def _get_headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["X-API-Key"] = self.api_key
        return headers

    async def send_message(
        self,
        recipient_id: str,
        text: str,
        account_id: Optional[str] = None,
        thread_type: str = "user",
    ) -> Dict[str, Any]:
        """
        Sends a message to a Zalo user/group via ZaloCRM Public API:
        POST /api/public/messages/send
        """
        zalo_acc_id = account_id or settings.ZALOCRM_DEFAULT_ACCOUNT_ID
        payload = {
            "zaloAccountId": zalo_acc_id,
            "threadId": recipient_id,
            "content": text,
            "threadType": thread_type,
        }

        # If running in mock/demo mode without active ZaloCRM server
        if not self.api_key or self.base_url.startswith("mock"):
            logger.info(f"[ZaloCRM Mock] Dispatch message to {recipient_id} on acc {zalo_acc_id}: '{text}'")
            return {"success": True, "mock": True, "recipient_id": recipient_id, "content": text}

        url = f"{self.base_url}/api/public/messages/send"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(url, json=payload, headers=self._get_headers())
                if res.status_code == 200:
                    data = res.json()
                    logger.info(f"[ZaloCRM] Message sent successfully to {recipient_id}")
                    return data
                else:
                    logger.error(f"[ZaloCRM] Failed to send message (HTTP {res.status_code}): {res.text}")
                    return {"success": False, "status_code": res.status_code, "error": res.text}
        except Exception as e:
            logger.error(f"[ZaloCRM] Exception sending message to {recipient_id}: {str(e)}")
            return {"success": False, "error": str(e)}

    async def accept_friend_request(
        self,
        sender_uid: str,
        account_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Accepts an incoming friend request via ZaloCRM API:
        POST /api/public/friends/accept
        """
        zalo_acc_id = account_id or settings.ZALOCRM_DEFAULT_ACCOUNT_ID
        payload = {
            "zaloAccountId": zalo_acc_id,
            "friendUid": sender_uid,
        }
        url = f"{self.base_url}/api/public/friends/accept"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(url, json=payload, headers=self._get_headers())
                if res.status_code == 200:
                    logger.info(f"[ZaloCRM] Auto-accepted friend request from {sender_uid}")
                    return res.json()
                return {"success": False, "status_code": res.status_code, "error": res.text}
        except Exception as e:
            logger.warning(f"[ZaloCRM] Exception accepting friend request: {e}")
            return {"success": False, "error": str(e)}

    async def get_connection_status(self) -> Dict[str, Any]:
        """
        Checks ZaloCRM Gateway health & connection status.
        GET /health or GET /api/public/conversations
        """
        if not self.api_key or self.base_url.startswith("mock"):
            return {
                "status": "ONLINE (DEMO MODE)",
                "gateway": "ZaloCRM Gateway v3.4",
                "connected_accounts": 1,
                "default_account_id": settings.ZALOCRM_DEFAULT_ACCOUNT_ID,
                "live": False,
            }

        url = f"{self.base_url}/health"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    health_data = res.json()
                    return {
                        "status": "CONNECTED",
                        "gateway": "ZaloCRM Gateway v3.4",
                        "health": health_data,
                        "base_url": self.base_url,
                        "live": True,
                    }
                else:
                    return {
                        "status": "DEGRADED",
                        "status_code": res.status_code,
                        "error": res.text,
                        "live": False,
                    }
        except Exception as e:
            return {
                "status": "DISCONNECTED",
                "error": str(e),
                "base_url": self.base_url,
                "live": False,
            }


zalocrm_client = ZaloCRMClient()
