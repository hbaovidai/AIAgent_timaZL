from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.database import AsyncSessionLocal
from app.models.memory import Memory, MemoryCategory

router = APIRouter()


class CreateMemoryRequest(BaseModel):
    user_id: str
    content: str
    category: str = "OTHER"
    importance: int = 3


class SearchMemoryRequest(BaseModel):
    user_id: Optional[str] = None
    query: str
    limit: int = 10


@router.get("/memories")
async def list_memories(user_id: Optional[str] = None, limit: int = 100):
    async with AsyncSessionLocal() as session:
        query = select(Memory).options(selectinload(Memory.user))
        if user_id:
            query = query.where(Memory.user_id == user_id)
        query = query.order_by(Memory.created_at.desc()).limit(limit)

        result = await session.execute(query)
        memories = result.scalars().all()

        return [
            {
                "id": m.id,
                "user_id": m.user_id,
                "user_name": m.user.display_name if m.user else "Unknown",
                "content": m.content,
                "category": m.category,
                "importance": m.importance,
                "created_at": m.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                "updated_at": m.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
            }
            for m in memories
        ]


@router.post("/memories")
async def create_memory(req: CreateMemoryRequest):
    cat = req.category.upper() if req.category.upper() in MemoryCategory.__members__ else "OTHER"

    async with AsyncSessionLocal() as session:
        mem = Memory(
            user_id=req.user_id,
            content=req.content,
            category=cat,
            importance=min(max(req.importance, 1), 5),
        )
        session.add(mem)
        await session.commit()
        await session.refresh(mem)

        return {
            "id": mem.id,
            "user_id": mem.user_id,
            "content": mem.content,
            "category": mem.category,
            "importance": mem.importance,
            "created_at": mem.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        }


@router.post("/memories/search")
async def search_memories(req: SearchMemoryRequest):
    async with AsyncSessionLocal() as session:
        stmt = select(Memory).options(selectinload(Memory.user))
        if req.user_id:
            stmt = stmt.where(Memory.user_id == req.user_id)
        result = await session.execute(stmt)
        memories = result.scalars().all()

        scored = []
        q_words = set(req.query.lower().split())

        for m in memories:
            c_lower = m.content.lower()
            matched = sum(1 for w in q_words if w in c_lower and len(w) > 2)
            score = 0.5 + (0.2 * matched) if matched > 0 else 0.1
            scored.append((score, m))

        scored.sort(key=lambda x: x[0], reverse=True)
        top = scored[:req.limit]

        return [
            {
                "id": m.id,
                "user_id": m.user_id,
                "user_name": m.user.display_name if m.user else "Unknown",
                "content": m.content,
                "category": m.category,
                "importance": m.importance,
                "relevance_score": round(score, 3),
                "created_at": m.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            }
            for score, m in top
        ]


@router.delete("/memories/{memory_id}")
async def delete_memory(memory_id: str):
    async with AsyncSessionLocal() as session:
        stmt = select(Memory).where(Memory.id == memory_id)
        result = await session.execute(stmt)
        mem = result.scalar_one_or_none()
        if not mem:
            raise HTTPException(status_code=404, detail="Memory not found")

        await session.delete(mem)
        await session.commit()
        return {"message": "Memory deleted successfully", "id": memory_id}
