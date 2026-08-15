import uuid
from typing import Any, Dict, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.agent.orchestrator import AgentOrchestrator
from app.channels.mock.adapter import mock_adapter

router = APIRouter()


class DemoMessageRequest(BaseModel):
    sender_role: str = "OWNER"  # "OWNER" | "USER"
    sender_id: Optional[str] = None
    sender_name: Optional[str] = None
    text: str
    message_id: Optional[str] = None


@router.post("/demo/messages")
async def send_demo_message(req: DemoMessageRequest) -> Dict[str, Any]:
    """
    Demo Chat Endpoint for Web UI.
    Passes through the exact same Agent pipeline as the live Zalo channel.
    """
    # Assign deterministic mock ID based on chosen role if not provided
    if req.sender_role.upper() == "OWNER":
        sender_id = req.sender_id or "owner"
        sender_name = req.sender_name or "Chủ nhân (Owner)"
    else:
        sender_id = req.sender_id or "user_guest"
        sender_name = req.sender_name or "Khách (User)"

    raw_payload = {
        "sender_id": sender_id,
        "sender_name": sender_name,
        "text": req.text,
        "message_id": req.message_id or f"demo_msg_{uuid.uuid4().hex[:8]}",
        "sender_role": req.sender_role,
    }

    normalized = mock_adapter.normalize_message(raw_payload)

    result = await AgentOrchestrator.process_incoming_message(
        channel=normalized.channel,
        sender_id=normalized.sender_id,
        sender_name=normalized.sender_name,
        text=normalized.text,
        external_message_id=normalized.message_id,
        raw_metadata=normalized.raw_event,
    )

    return result
