import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import select

from app.config.settings import settings
from app.db.database import AsyncSessionLocal
from app.models.task import Task, TaskStatus
from app.models.user import User, UserRole
from app.channels.zalocrm.adapter import zalocrm_adapter

logger = logging.getLogger("scheduler")


class SchedulerService:
    """
    Proactive Background Scheduler for Tima AI Agent.
    Handles automated morning briefings, task deadline reminders, and proactive push to Zalo.
    """

    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self._is_started = False

    def start(self):
        """Start the background scheduler."""
        if not self._is_started:
            # 1. Schedule daily morning briefing at 07:00 AM (Vietnam Time)
            self.scheduler.add_job(
                self.send_morning_briefing,
                CronTrigger(hour=7, minute=0),
                id="daily_morning_briefing",
                name="Daily Morning Briefing to Zalo",
                replace_existing=True,
            )

            # 2. Schedule periodic task status check every 30 minutes
            self.scheduler.add_job(
                self.check_pending_task_reminders,
                IntervalTrigger(minutes=30),
                id="periodic_task_checker",
                name="Periodic Pending Task Reminder",
                replace_existing=True,
            )

            self.scheduler.start()
            self._is_started = True
            logger.info("[Scheduler] Proactive Background Scheduler started successfully.")

    def shutdown(self):
        """Gracefully shut down the scheduler."""
        if self._is_started:
            self.scheduler.shutdown(wait=False)
            self._is_started = False
            logger.info("[Scheduler] Proactive Background Scheduler stopped.")

    def get_jobs(self) -> List[Dict[str, Any]]:
        """List all active scheduled jobs."""
        jobs = []
        for job in self.scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run_time": job.next_run_time.strftime("%Y-%m-%d %H:%M:%S") if job.next_run_time else None,
                "trigger": str(job.trigger),
            })
        return jobs

    async def send_morning_briefing(self, recipient_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Generates and proactively sends the daily morning briefing to the owner via Zalo.
        Can be triggered automatically by cron or manually via API for live demo.
        """
        target_recipient = recipient_id or settings.OWNER_ZALO_ID
        owner_name = settings.OWNER_NAME or "Huỳnh Bảo"

        logger.info(f"[Scheduler] Generating proactive Morning Briefing for {owner_name} ({target_recipient})...")

        # Fetch pending tasks for the owner
        async with AsyncSessionLocal() as session:
            stmt = select(Task).where(Task.status == TaskStatus.PENDING.value).order_by(Task.created_at.asc())
            res = await session.execute(stmt)
            pending_tasks = res.scalars().all()

        now_str = datetime.now().strftime("%d/%m/%Y")
        greeting_lines = [
            f"🌅 [CHÀO BUỔI SÁNG TỪ TIMA AI]",
            f"Xin chào anh {owner_name}! Chúc anh một ngày mới ({now_str}) tràn đầy năng lượng và làm việc hiệu quả!",
            "",
        ]

        if pending_tasks:
            greeting_lines.append(f"📋 Hôm nay anh có {len(pending_tasks)} công việc cần hoàn thành:")
            for idx, task in enumerate(pending_tasks, 1):
                greeting_lines.append(f"  {idx}. {task.title}")
        else:
            greeting_lines.append("🎉 Hiện tại danh sách công việc của anh đang trống. Hãy nghỉ ngơi hoặc tạo task mới khi cần nhé!")

        greeting_lines.append("")
        greeting_lines.append("💡 Tima AI luôn sẵn sàng hỗ trợ anh 24/7. Anh có thể nhắn tin trực tiếp để giao thêm nhiệm vụ bất kỳ lúc nào!")

        message_text = "\n".join(greeting_lines)

        # Proactively push message to Zalo
        res = await zalocrm_adapter.send_message(recipient_id=target_recipient, text=message_text)

        logger.info(f"[Scheduler] Morning Briefing dispatched to {target_recipient}. Success: {res.success}")
        return {
            "success": res.success,
            "recipient_id": target_recipient,
            "pending_tasks_count": len(pending_tasks),
            "message": message_text,
            "error": res.error,
        }

    async def check_pending_task_reminders(self) -> None:
        """Periodic check to notify owner of pending items if needed."""
        logger.info("[Scheduler] Running periodic pending task check...")
        async with AsyncSessionLocal() as session:
            stmt = select(Task).where(Task.status == TaskStatus.PENDING.value)
            res = await session.execute(stmt)
            count = len(res.scalars().all())
            logger.info(f"[Scheduler] Found {count} pending tasks currently in database.")


scheduler_service = SchedulerService()
