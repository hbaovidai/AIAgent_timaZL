import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id: Mapped[str] = mapped_column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(String(32))  # "user" | "assistant" | "system" | "tool"
    content: Mapped[str] = mapped_column(Text, default="")
    message_id: Mapped[str | None] = mapped_column(String(128), index=True, nullable=True)  # Idempotency check
    correlation_id: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    raw_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")
