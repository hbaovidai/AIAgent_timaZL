import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, Integer, Float, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


class ToolExecution(Base):
    __tablename__ = "tool_executions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_run_id: Mapped[str] = mapped_column(String(36), ForeignKey("agent_runs.id", ondelete="CASCADE"), index=True)
    iteration: Mapped[int] = mapped_column(Integer, default=1)
    tool_name: Mapped[str] = mapped_column(String(128), index=True)
    arguments_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    result_json: Mapped[dict | list | str | int | float | bool | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="SUCCESS")  # "SUCCESS" | "FAILED" | "PERMISSION_DENIED"
    duration_ms: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    agent_run: Mapped["AgentRun"] = relationship("AgentRun", back_populates="tool_executions")
