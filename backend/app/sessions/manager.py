from datetime import datetime
from sqlalchemy import select
from app.db.database import AsyncSessionLocal
from app.models.conversation import Conversation


class SessionManager:
    @staticmethod
    async def get_or_create_active_conversation(
        user_id: str,
        channel: str = "mock",
        title: str = "Cuộc trò chuyện",
    ) -> Conversation:
        async with AsyncSessionLocal() as session:
            # Look for recent active conversation for this user and channel
            stmt = (
                select(Conversation)
                .where(Conversation.user_id == user_id, Conversation.channel == channel)
                .order_by(Conversation.updated_at.desc())
            )
            result = await session.execute(stmt)
            conv = result.scalars().first()

            if not conv:
                conv = Conversation(
                    user_id=user_id,
                    channel=channel,
                    title=title,
                )
                session.add(conv)
                await session.commit()
                await session.refresh(conv)

            return conv

    @staticmethod
    async def touch_conversation(conversation_id: str) -> None:
        async with AsyncSessionLocal() as session:
            stmt = select(Conversation).where(Conversation.id == conversation_id)
            result = await session.execute(stmt)
            conv = result.scalar_one_or_none()
            if conv:
                conv.updated_at = datetime.utcnow()
                await session.commit()
