from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config.settings import settings


class Base(DeclarativeBase):
    pass


# Convert sqlite URL if needed
db_url = settings.DATABASE_URL
if db_url.startswith("sqlite:///"):
    db_url = db_url.replace("sqlite:///", "sqlite+aiosqlite:///")

connect_args = {"check_same_thread": False} if "sqlite" in db_url else {}

engine = create_async_engine(
    db_url,
    echo=False,
    connect_args=connect_args,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    # Explicitly import all models to ensure Base.metadata contains all tables
    from app.models.user import User  # noqa: F401
    from app.models.conversation import Conversation  # noqa: F401
    from app.models.message import Message  # noqa: F401
    from app.models.memory import Memory  # noqa: F401
    from app.models.task import Task  # noqa: F401
    from app.models.note import Note  # noqa: F401
    from app.models.agent_run import AgentRun  # noqa: F401
    from app.models.tool_execution import ToolExecution  # noqa: F401
    from app.models.channel_connection import ChannelConnection  # noqa: F401
    from app.models.system_setting import SystemSetting  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
