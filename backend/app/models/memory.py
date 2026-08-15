import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
import enum


class MemoryCategory(str, enum.Enum):
    PERSONAL = "PERSONAL"
    PREFERENCE = "PREFERENCE"
    PROJECT = "PROJECT"
    TASK = "TASK"
    FACT = "FACT"
    OTHER = "OTHER"


class Memory(Base):
    __tablename__ = "memories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    content: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(32), default=MemoryCategory.OTHER.value, index=True)
    importance: Mapped[int] = mapped_column(Integer, default=3)  # 1 (low) to 5 (critical)
    embedding_json: Mapped[list[float] | None] = mapped_column(JSON, nullable=True)  # Store vector embedding
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="memories")
