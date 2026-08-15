from typing import List
from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.database import AsyncSessionLocal
from app.models.conversation import Conversation
from app.models.message import Message

router = APIRouter()


@router.get("/conversations")
async def list_conversations():
    async with AsyncSessionLocal() as session:
        stmt = (
            select(Conversation)
            .options(selectinload(Conversation.user))
            .order_by(Conversation.updated_at.desc())
        )
        result = await session.execute(stmt)
        conversations = result.scalars().all()

        data = []
        for c in conversations:
            # Count messages
            msg_count_stmt = select(Message).where(Message.conversation_id == c.id)
            msg_res = await session.execute(msg_count_stmt)
            msg_count = len(msg_res.scalars().all())

            data.append({
                "id": c.id,
                "title": c.title,
                "channel": c.channel,
                "user_id": c.user_id,
                "user_name": c.user.display_name if c.user else "Unknown",
                "user_role": c.user.role if c.user else "USER",
                "message_count": msg_count,
                "created_at": c.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                "updated_at": c.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
            })
        return data


@router.get("/conversations/{conversation_id}")
async def get_conversation_details(conversation_id: str):
    async with AsyncSessionLocal() as session:
        stmt = (
            select(Conversation)
            .options(selectinload(Conversation.user), selectinload(Conversation.messages))
            .where(Conversation.id == conversation_id)
        )
        result = await session.execute(stmt)
        conv = result.scalar_one_or_none()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")

        messages_data = [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                "metadata": m.raw_metadata,
            }
            for m in conv.messages
        ]

        return {
            "id": conv.id,
            "title": conv.title,
            "channel": conv.channel,
            "user": {
                "id": conv.user.id,
                "display_name": conv.user.display_name,
                "role": conv.user.role,
                "external_user_id": conv.user.external_user_id,
            } if conv.user else None,
            "messages": messages_data,
            "created_at": conv.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": conv.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
        }
