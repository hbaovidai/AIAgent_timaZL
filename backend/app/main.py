import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.db.database import init_db
from app.api.routes import (
    health,
    webhook,
    zalocrm_webhook,
    demo,
    conversations,
    agent_runs,
    memories,
    tasks,
    tools,
    users,
    channels,
    settings as settings_route,
    stats,
    scheduler,
    documents,
    n8n_routes,
)
from app.scheduler.service import scheduler_service

# Setup logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("agent")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database schemas...")
    await init_db()
    logger.info("Database schemas initialized.")
    logger.info(f"AI Agent backend started. Active LLM Provider: {settings.LLM_PROVIDER}")
    scheduler_service.start()
    yield
    scheduler_service.shutdown()
    logger.info("AI Agent backend shutting down.")


app = FastAPI(
    title="AI Personal Assistant Agent API (Hermes Agent + ZaloCRM)",
    description="Backend Integration for 24/7 AI Personal Assistant using Official Hermes Agent (Nous Research) and ZaloCRM Gateway.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Files (for reports and downloads)
import os
from fastapi.staticfiles import StaticFiles
static_dir = os.path.join(os.path.dirname(__file__), "../static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Include Routers
app.include_router(health.router, tags=["Health"])
app.include_router(zalocrm_webhook.router, tags=["ZaloCRM Webhook"])
app.include_router(webhook.router, tags=["Webhook"])
app.include_router(demo.router, prefix="/api", tags=["Demo"])
app.include_router(conversations.router, prefix="/api", tags=["Conversations"])
app.include_router(agent_runs.router, prefix="/api", tags=["Agent Runs"])
app.include_router(memories.router, prefix="/api", tags=["Memories"])
app.include_router(tasks.router, prefix="/api", tags=["Tasks"])
app.include_router(tools.router, prefix="/api", tags=["Tools"])
app.include_router(users.router, prefix="/api", tags=["Users"])
app.include_router(channels.router, prefix="/api", tags=["Channels"])
app.include_router(settings_route.router, prefix="/api", tags=["Settings"])
app.include_router(stats.router, prefix="/api", tags=["Stats"])
app.include_router(scheduler.router, prefix="/api", tags=["Scheduler"])
app.include_router(documents.router, prefix="/api", tags=["Documents"])
app.include_router(n8n_routes.router, tags=["n8n Automation"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=True,
    )
