import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    correlation_id: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    incoming_message: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(32), default="SUCCESS")  # "RUNNING" | "SUCCESS" | "FAILED"
    model: Mapped[str] = mapped_column(String(128), default="mock")
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    duration_ms: Mapped[float] = mapped_column(Float, default=0.0)
    input_tokens: Mapped[int] = mapped_column(Integer, default=0)
    output_tokens: Mapped[int] = mapped_column(Integer, default=0)
    total_iterations: Mapped[int] = mapped_column(Integer, default=1)
    final_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="agent_runs")
    tool_executions: Mapped[list["ToolExecution"]] = relationship("ToolExecution", back_populates="agent_run", cascade="all, delete-orphan", order_by="ToolExecution.created_at")
