import logging
from typing import Any, Dict
from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, Request
from app.channels.zalo.adapter import zalo_adapter
from app.agent.orchestrator import AgentOrchestrator

logger = logging.getLogger(__name__)

router = APIRouter()


async def process_zalo_message_task(normalized_msg):
    try:
        result = await AgentOrchestrator.process_incoming_message(
            channel=normalized_msg.channel,
            sender_id=normalized_msg.sender_id,
            sender_name=normalized_msg.sender_name,
            text=normalized_msg.text,
            external_message_id=normalized_msg.message_id,
            phone=normalized_msg.phone,
            raw_metadata=normalized_msg.raw_event,
        )

        if not result.get("duplicate"):
            response_text = result.get("response", "")
            if response_text:
                await zalo_adapter.send_message(
                    recipient_id=normalized_msg.sender_id,
                    text=response_text,
                )
    except Exception as e:
        logger.error(f"Error processing background Zalo message: {str(e)}", exc_info=True)


@router.post("/webhooks/zalo")
async def zalo_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_zevent_signature: str | None = Header(None),
    x_zevent_timestamp: str | None = Header(None),
):
    """
    Official Zalo OA Webhook Endpoint.
    1. Validates signature
    2. Normalizes message event
    3. Dispatches processing in background
    4. Returns 200 OK immediately
    """
    raw_body = await request.body()

    # Validate signature if configured
    if not zalo_adapter.verify_signature(raw_body, x_zevent_signature, x_zevent_timestamp):
        raise HTTPException(status_code=403, detail="Invalid Zalo signature.")

    try:
        raw_event: Dict[str, Any] = await request.json()
    except Exception:
        return {"error": 0, "message": "Invalid JSON"}

    # Handle Zalo verification challenge if any
    if raw_event.get("event_name") == "challenge":
        return {"challenge": raw_event.get("challenge")}

    # Normalize message
    normalized = zalo_adapter.normalize_message(raw_event)
    if not normalized.text:
        # Ignore empty/unsupported event types without text
        return {"error": 0, "message": "Ignored non-text event."}

    # Dispatch to background task to guarantee quick HTTP 200 response
    background_tasks.add_task(process_zalo_message_task, normalized)

    return {"error": 0, "message": "Received and queued for processing."}


@router.get("/webhooks/zalo")
async def zalo_webhook_verify():
    """Zalo webhook URL verification endpoint."""
    return {"status": "ok", "message": "Zalo webhook endpoint is active."}
