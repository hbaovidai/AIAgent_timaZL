from fastapi import APIRouter
from sqlalchemy import select, func
from app.db.database import AsyncSessionLocal
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.memory import Memory
from app.models.task import Task
from app.models.agent_run import AgentRun
from app.models.tool_execution import ToolExecution
from app.config.settings import settings
from app.channels.zalocrm.adapter import zalocrm_adapter

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats():
    async with AsyncSessionLocal() as session:
        user_count = (await session.execute(select(func.count(User.id)))).scalar_one()
        conv_count = (await session.execute(select(func.count(Conversation.id)))).scalar_one()
        msg_count = (await session.execute(select(func.count(Message.id)))).scalar_one()
        mem_count = (await session.execute(select(func.count(Memory.id)))).scalar_one()
        task_count = (await session.execute(select(func.count(Task.id)))).scalar_one()
        run_count = (await session.execute(select(func.count(AgentRun.id)))).scalar_one()
        tool_count = (await session.execute(select(func.count(ToolExecution.id)))).scalar_one()

        recent_runs_stmt = select(AgentRun).order_by(AgentRun.started_at.desc()).limit(5)
        recent_runs = (await session.execute(recent_runs_stmt)).scalars().all()

        zalocrm_status = await zalocrm_adapter.get_connection_status()

        return {
            "counters": {
                "users": user_count,
                "conversations": conv_count,
                "messages": msg_count,
                "memories": mem_count,
                "tasks": task_count,
                "agent_runs": run_count,
                "tool_executions": tool_count,
            },
            "agent_status": "HERMES ONLINE",
            "hermes_version": "v0.20.1",
            "llm_provider": settings.LLM_PROVIDER,
            "zalocrm_gateway": zalocrm_status.get("status", "ONLINE"),
            "zalocrm_url": settings.ZALOCRM_BASE_URL,
            "recent_runs": [
                {
                    "id": r.id,
                    "incoming_message": r.incoming_message,
                    "status": r.status,
                    "duration_ms": r.duration_ms,
                    "iterations": r.total_iterations,
                    "created_at": r.started_at.strftime("%Y-%m-%d %H:%M:%S") if r.started_at else None,
                }
                for r in recent_runs
            ],
        }
