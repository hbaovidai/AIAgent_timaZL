import uuid
import logging
from typing import Any, Dict, Optional
from sqlalchemy import select
from app.db.database import AsyncSessionLocal
from app.models.message import Message
from app.models.user import User
from app.models.conversation import Conversation
from app.users.service import UserService
from app.sessions.manager import SessionManager
from app.agent.hermes_service import hermes_service, HermesExecutionResult

logger = logging.getLogger(__name__)


class AgentOrchestrator:
    """
    Main pipeline entrypoint:
    Normalized Message (Zalo / Mock) -> User & Role Resolver -> Session -> Official Hermes Agent -> Response -> Zalo Outbound
    """

    @staticmethod
    async def process_incoming_message(
        channel: str,
        sender_id: str,
        sender_name: str,
        text: str,
        external_message_id: Optional[str] = None,
        phone: Optional[str] = None,
        raw_metadata: Optional[Dict[str, Any]] = None,
        correlation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        correlation_id = correlation_id or f"corr_{uuid.uuid4().hex[:12]}"
        logger.info(f"[{correlation_id}] Incoming message from {sender_name} ({sender_id}) via {channel}: '{text}'")

        # 1. User & Role Identification (OWNER vs USER)
        user: User = await UserService.get_or_create_user(
            channel=channel,
            external_user_id=sender_id,
            display_name=sender_name,
            phone=phone,
        )

        # 2. Session & Conversation Management
        conversation: Conversation = await SessionManager.get_or_create_active_conversation(
            user_id=user.id,
            channel=channel,
            title=f"Chat ({sender_name})",
        )

        # 3. Store incoming user message & Idempotency Check
        async with AsyncSessionLocal() as session:
            if external_message_id:
                stmt = select(Message).where(Message.message_id == external_message_id)
                res = await session.execute(stmt)
                existing = res.scalar_one_or_none()
                if existing:
                    logger.warning(f"[{correlation_id}] Duplicate message detected: {external_message_id}. Skipping.")
                    return {
                        "duplicate": True,
                        "message_id": existing.id,
                        "response": "Tin nhắn trùng lặp đã được bỏ qua.",
                    }

            user_msg = Message(
                conversation_id=conversation.id,
                user_id=user.id,
                role="user",
                content=text,
                message_id=external_message_id,
                correlation_id=correlation_id,
                raw_metadata=raw_metadata,
            )
            session.add(user_msg)
            await session.commit()

        # 4. Route directly to Official Hermes Agent runtime
        result: HermesExecutionResult = await hermes_service.execute_message(
            user=user,
            conversation_id=conversation.id,
            correlation_id=correlation_id,
            incoming_text=text,
        )

        # 5. Store Hermes Assistant Response in DB
        async with AsyncSessionLocal() as session:
            assistant_msg = Message(
                conversation_id=conversation.id,
                user_id=user.id,
                role="assistant",
                content=result.final_response,
                correlation_id=correlation_id,
                raw_metadata={
                    "agent_run_id": result.agent_run_id,
                    "hermes_session_id": result.session_id,
                    "total_iterations": result.total_iterations,
                    "duration_ms": result.duration_ms,
                    "tools_count": len(result.tool_executions),
                },
            )
            session.add(assistant_msg)
            await session.commit()

        # Update conversation timestamp
        await SessionManager.touch_conversation(conversation.id)

        logger.info(
            f"[{correlation_id}] Finished Hermes Agent Run {result.agent_run_id} in {result.duration_ms}ms with {len(result.tool_executions)} tool executions."
        )

        return {
            "conversation_id": conversation.id,
            "user_id": user.id,
            "user_role": user.role,
            "agent_run_id": result.agent_run_id,
            "hermes_session_id": result.session_id,
            "response": result.final_response,
            "duration_ms": result.duration_ms,
            "total_iterations": result.total_iterations,
            "tool_executions": result.tool_executions,
            "correlation_id": correlation_id,
        }
