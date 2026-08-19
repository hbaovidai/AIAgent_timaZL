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

    event_type = str(payload.get("event") or x_webhook_event or "").lower()
    logger.info(f"[ZaloCRM Webhook] Received event: {event_type}")

    # 1. Feature: Auto Welcome New Group Members
    if "group.member_joined" in event_type or "group.join" in event_type or "group.member_added" in event_type:
        data = payload.get("data", {})
        group_id = data.get("conversationId") or data.get("groupId")
        member_name = data.get("memberName") or data.get("userName") or "bạn mới"
        group_title = data.get("groupName") or data.get("groupTitle") or "nhóm"

        welcome_text = (
            f"🎉 [CHÀO MỪNG THÀNH VIÊN MỚI]\n"
            f"Chào mừng {member_name} đã tham gia {group_title}! 👋\n\n"
            f"Mình là Tima AI Agent - Trợ lý số 24/7 của anh Huỳnh Bảo. Chúc bạn một ngày làm việc hiệu quả!\n"
            f"💡 Nếu bạn cần tra cứu tài liệu đồ án, cập nhật tiến độ hay giao task, cứ tag @Tima nhé! 🚀"
        )
        if group_id:
            background_tasks.add_task(
                zalocrm_adapter.send_message,
                recipient_id=group_id,
                text=welcome_text,
                metadata={"account_id": data.get("account_id"), "thread_type": "group"},
            )
        return {"status": "welcomed_group_member", "member": member_name, "group_id": group_id}

    # 2. Feature: Auto Accept Friend Requests & Welcome New Connections
    if "friend_request" in event_type or "friend.request" in event_type:
        data = payload.get("data", {})
        sender_uid = str(data.get("senderUid") or data.get("userUid") or data.get("friendUid") or "")
        sender_name = data.get("senderName") or data.get("userName") or "bạn"

        if sender_uid:
            from app.channels.zalocrm.client import zalocrm_client
            # Auto accept friend request
            background_tasks.add_task(zalocrm_client.accept_friend_request, sender_uid=sender_uid)

            # Send welcome greeting
            friend_welcome_text = (
                f"👋 Chào {sender_name}! Mình là Tima AI Agent - Trợ lý số 24/7 của anh Huỳnh Bảo.\n\n"
                f"Rất vui được kết nối với bạn trên Zalo! Mình có thể hỗ trợ bạn ghi nhận công việc, lưu lịch hẹn và tra cứu thông tin nhanh chóng. Bạn cần hỗ trợ gì cứ nhắn cho mình nhé! ✨"
            )
            background_tasks.add_task(
                zalocrm_adapter.send_message,
                recipient_id=sender_uid,
                text=friend_welcome_text,
                metadata={"account_id": data.get("account_id"), "thread_type": "user"},
            )
        return {"status": "auto_accepted_friend", "sender_uid": sender_uid, "sender_name": sender_name}

    # Ignore other non-message events
    if event_type != "message.received":
        return {"status": "ignored", "event": event_type}

    # 2. Normalize message
    normalized: NormalizedMessage = zalocrm_adapter.normalize_message(payload)
    data_payload = payload.get("data", {})
    content_type = str(data_payload.get("contentType") or data_payload.get("type") or "").lower()

    # Voice Note / Audio Message Support
    if "voice" in content_type or "audio" in content_type or data_payload.get("audioUrl") or data_payload.get("mediaUrl"):
        from app.agent.transcription_service import transcription_service
        audio_target = data_payload.get("audioUrl") or data_payload.get("mediaUrl") or normalized.text
        transcribed_text = await transcription_service.transcribe_audio(audio_url_or_path=audio_target)
        normalized.text = f"[🎙️ Tin nhắn thoại]: {transcribed_text}"
        logger.info(f"[ZaloCRM Webhook] Voice note transcribed: '{normalized.text}'")

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

    # 4. Dispatch Hermes response back to Zalo user/group via ZaloCRM REST API
    final_response = result.get("response", "")
    if final_response:
        data_payload = payload.get("data", {})
        thread_type = data_payload.get("threadType", "user")
        target_id = data_payload.get("conversationId") if thread_type == "group" else normalized.sender_id

        background_tasks.add_task(
            zalocrm_adapter.send_message,
            recipient_id=target_id or normalized.sender_id,
            text=final_response,
            metadata={
                "account_id": data_payload.get("account_id"),
                "thread_type": thread_type,
            },
        )

    return {
        "status": "processed",
        "agent": "Hermes Agent (Nous Research)",
        "message_id": normalized.message_id,
        "response": final_response,
        "duration_ms": result.get("duration_ms"),
        "iterations": result.get("total_iterations"),
    }
