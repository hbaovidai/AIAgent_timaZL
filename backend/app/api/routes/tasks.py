from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.database import AsyncSessionLocal
from app.models.task import Task, TaskStatus
from app.models.note import Note

router = APIRouter()


class CreateTaskRequest(BaseModel):
    user_id: str
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None


class UpdateTaskRequest(BaseModel):
    status: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None


@router.get("/tasks")
async def list_tasks(user_id: Optional[str] = None):
    async with AsyncSessionLocal() as session:
        query = select(Task).options(selectinload(Task.user)).order_by(Task.created_at.desc())
        if user_id:
            query = query.where(Task.user_id == user_id)
        result = await session.execute(query)
        tasks = result.scalars().all()

        return [
            {
                "id": t.id,
                "user_id": t.user_id,
                "user_name": t.user.display_name if t.user else "Unknown",
                "title": t.title,
                "description": t.description,
                "due_date": t.due_date,
                "status": t.status,
                "created_at": t.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            }
            for t in tasks
        ]


@router.post("/tasks")
async def create_task(req: CreateTaskRequest):
    async with AsyncSessionLocal() as session:
        task = Task(
            user_id=req.user_id,
            title=req.title,
            description=req.description,
            due_date=req.due_date,
            status=TaskStatus.PENDING.value,
        )
        session.add(task)
        await session.commit()
        await session.refresh(task)
        return {
            "id": task.id,
            "title": task.title,
            "status": task.status,
            "due_date": task.due_date,
            "created_at": task.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        }


@router.put("/tasks/{task_id}")
async def update_task(task_id: str, req: UpdateTaskRequest):
    async with AsyncSessionLocal() as session:
        stmt = select(Task).where(Task.id == task_id)
        res = await session.execute(stmt)
        task = res.scalar_one_or_none()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        if req.status:
            task.status = req.status
        if req.title:
            task.title = req.title
        if req.description is not None:
            task.description = req.description
        if req.due_date is not None:
            task.due_date = req.due_date

        await session.commit()
        return {"message": "Task updated successfully", "id": task.id, "status": task.status}


@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    async with AsyncSessionLocal() as session:
        stmt = select(Task).where(Task.id == task_id)
        res = await session.execute(stmt)
        task = res.scalar_one_or_none()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        await session.delete(task)
        await session.commit()
        return {"message": "Task deleted successfully", "id": task_id}


@router.get("/notes")
async def list_notes(user_id: Optional[str] = None):
    async with AsyncSessionLocal() as session:
        query = select(Note).options(selectinload(Note.user)).order_by(Note.created_at.desc())
        if user_id:
            query = query.where(Note.user_id == user_id)
        result = await session.execute(query)
        notes = result.scalars().all()
        return [
            {
                "id": n.id,
                "user_id": n.user_id,
                "user_name": n.user.display_name if n.user else "Unknown",
                "title": n.title,
                "content": n.content,
                "created_at": n.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            }
            for n in notes
        ]
