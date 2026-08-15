import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base


class ChannelConnection(Base):
    __tablename__ = "channel_connections"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    channel: Mapped[str] = mapped_column(String(32), unique=True, index=True)  # "zalo" | "mock"
    status: Mapped[str] = mapped_column(String(32), default="DEMO")  # "CONNECTED" | "DISCONNECTED" | "DEMO" | "ERROR"
    external_account_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    external_account_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    connected_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
