import json
import logging
from fastapi import APIRouter, Request, Header, HTTPException, BackgroundTasks
from typing import Optional, Dict, Any

from app.channels.zalocrm.adapter import zalocrm_adapter
from app.channels.base import NormalizedMessage
from app.agent.orchestrator import AgentOrchestrator

logger = logging.getLogger("zalocrm.webhook")
router = APIRouter()


@router.post("/webhooks/zalocrm")
async def handle_zalocrm_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_webhook_signature: Optional[str] = Header(None, alias="X-Webhook-Signature"),
    x_webhook_event: Optional[str] = Header(None, alias="X-Webhook-Event"),
):
    """
    Webhook receiver for ZaloCRM events (e.g. message.received, zalo.connected).
    Routes incoming Zalo messages directly to official Hermes Agent.
    """
    raw_body = await request.body()

    # 1. Verify HMAC Signature if secret is configured
    if not zalocrm_adapter.verify_webhook_signature(raw_body, x_webhook_signature):
        logger.warning("[ZaloCRM Webhook] Invalid HMAC signature!")
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except Exception as e:
        logger.error(f"[ZaloCRM Webhook] Malformed JSON payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    event_type = payload.get("event") or x_webhook_event
    logger.info(f"[ZaloCRM Webhook] Received event: {event_type}")

    # Ignore non-message events
    if event_type != "message.received":
        return {"status": "ignored", "event": event_type}

    # 2. Normalize message
    normalized: NormalizedMessage = zalocrm_adapter.normalize_message(payload)
    if not normalized.text:
        return {"status": "ignored", "reason": "empty_content"}

    # 3. Execute via Hermes Agent
    result: Dict[str, Any] = await AgentOrchestrator.process_incoming_message(
        channel=normalized.channel,
        sender_id=normalized.sender_id,
        sender_name=normalized.sender_name,
        text=normalized.text,
        external_message_id=normalized.message_id,
        phone=normalized.phone,
        raw_metadata=normalized.raw_event,
    )

    if result.get("duplicate"):
        return {"status": "duplicate", "message_id": normalized.message_id}

    # 4. Dispatch Hermes response back to Zalo user via ZaloCRM REST API
    final_response = result.get("response", "")
    if final_response:
        background_tasks.add_task(
            zalocrm_adapter.send_message,
            recipient_id=normalized.sender_id,
            text=final_response,
            metadata={"account_id": payload.get("data", {}).get("account_id")},
        )

    return {
        "status": "processed",
        "agent": "Hermes Agent (Nous Research)",
        "message_id": normalized.message_id,
        "response": final_response,
        "duration_ms": result.get("duration_ms"),
        "iterations": result.get("total_iterations"),
    }
