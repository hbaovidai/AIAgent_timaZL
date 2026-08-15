from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.database import AsyncSessionLocal
from app.models.agent_run import AgentRun

router = APIRouter()


@router.get("/agent-runs")
async def list_agent_runs(limit: int = 50):
    async with AsyncSessionLocal() as session:
        stmt = (
            select(AgentRun)
            .options(selectinload(AgentRun.tool_executions))
            .order_by(AgentRun.started_at.desc())
            .limit(limit)
        )
        result = await session.execute(stmt)
        runs = result.scalars().all()

        data = []
        for r in runs:
            tools_summary = [
                {
                    "tool_name": te.tool_name,
                    "status": te.status,
                    "duration_ms": te.duration_ms,
                }
                for te in r.tool_executions
            ]

            data.append({
                "id": r.id,
                "conversation_id": r.conversation_id,
                "user_id": r.user_id,
                "correlation_id": r.correlation_id,
                "incoming_message": r.incoming_message,
                "status": r.status,
                "model": r.model,
                "started_at": r.started_at.strftime("%Y-%m-%d %H:%M:%S") if r.started_at else None,
                "finished_at": r.finished_at.strftime("%Y-%m-%d %H:%M:%S") if r.finished_at else None,
                "duration_ms": r.duration_ms,
                "total_iterations": r.total_iterations,
                "tool_executions_count": len(r.tool_executions),
                "tool_executions": tools_summary,
                "final_response": r.final_response,
                "error_message": r.error_message,
            })
        return data


@router.get("/agent-runs/{run_id}")
async def get_agent_run_detail(run_id: str):
    async with AsyncSessionLocal() as session:
        stmt = (
            select(AgentRun)
            .options(selectinload(AgentRun.tool_executions))
            .where(AgentRun.id == run_id)
        )
        result = await session.execute(stmt)
        run = result.scalar_one_or_none()
        if not run:
            raise HTTPException(status_code=404, detail="Agent Run not found")

        tools_data = [
            {
                "id": te.id,
                "iteration": te.iteration,
                "tool_name": te.tool_name,
                "arguments": te.arguments_json,
                "result": te.result_json,
                "status": te.status,
                "duration_ms": te.duration_ms,
                "created_at": te.created_at.strftime("%Y-%m-%d %H:%M:%S") if te.created_at else None,
            }
            for te in run.tool_executions
        ]

        return {
            "id": run.id,
            "conversation_id": run.conversation_id,
            "user_id": run.user_id,
            "correlation_id": run.correlation_id,
            "incoming_message": run.incoming_message,
            "status": run.status,
            "model": run.model,
            "started_at": run.started_at.strftime("%Y-%m-%d %H:%M:%S") if run.started_at else None,
            "finished_at": run.finished_at.strftime("%Y-%m-%d %H:%M:%S") if run.finished_at else None,
            "duration_ms": run.duration_ms,
            "input_tokens": run.input_tokens,
            "output_tokens": run.output_tokens,
            "total_iterations": run.total_iterations,
            "final_response": run.final_response,
            "error_message": run.error_message,
            "tool_executions": tools_data,
        }
