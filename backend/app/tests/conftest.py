import os
import pytest
import pytest_asyncio
from app.db.database import init_db, engine, Base


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_db():
    # Initialize SQLite DB
    await init_db()
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
