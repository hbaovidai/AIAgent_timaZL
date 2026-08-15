import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Enum as SAEnum, ForeignKey, Text, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
import enum


class UserRole(str, enum.Enum):
    OWNER = "OWNER"
    USER = "USER"


class ChannelType(str, enum.Enum):
    ZALO = "zalo"
    MOCK = "mock"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    channel: Mapped[str] = mapped_column(String(32), default=ChannelType.MOCK.value, index=True)
    external_user_id: Mapped[str] = mapped_column(String(128), index=True)
    display_name: Mapped[str] = mapped_column(String(255), default="Unknown")
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    role: Mapped[str] = mapped_column(String(32), default=UserRole.USER.value, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    conversations: Mapped[list["Conversation"]] = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    memories: Mapped[list["Memory"]] = relationship("Memory", back_populates="user", cascade="all, delete-orphan")
    tasks: Mapped[list["Task"]] = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    notes: Mapped[list["Note"]] = relationship("Note", back_populates="user", cascade="all, delete-orphan")
