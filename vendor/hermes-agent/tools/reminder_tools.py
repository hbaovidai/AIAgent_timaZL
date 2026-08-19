import os
import json
import logging
import datetime
import threading
import urllib.request
import re
from typing import Optional, Dict, Any

logger = logging.getLogger("hermes.tools.reminders")

ZALOCRM_BASE_URL = os.environ.get("ZALOCRM_BASE_URL", "http://localhost:3080")
ZALOCRM_API_KEY = os.environ.get("ZALOCRM_API_KEY", "zcrm_key_live_2026_demo")
ZALOCRM_DEFAULT_ACCOUNT_ID = os.environ.get("ZALOCRM_DEFAULT_ACCOUNT_ID", "c67b3049-e360-4d9e-bd28-2c74b403a478")
OWNER_ZALO_ID = "3914118581873674309"


def _send_zalo_reminder_trigger(recipient_id: str, content: str):
    """Fired asynchronously when the reminder timer expires."""
    try:
        reminder_msg = (
            f"⏰ **[THÔNG BÁO NHẮC VIỆC TỰ ĐỘNG - TIMA AI]**\n\n"
            f"🔔 **Nội dung:** {content}\n"
            f"⏱️ **Thời gian:** {datetime.datetime.now().strftime('%H:%M:%S - %d/%m/%Y')}\n\n"
            f"Em xin nhắc anh/chị theo đúng lịch đã hẹn để công việc không bị trễ hạn ạ! ✨"
        )
        payload = {
            "zaloAccountId": ZALOCRM_DEFAULT_ACCOUNT_ID,
            "threadId": recipient_id,
            "content": reminder_msg,
            "threadType": "user",
        }
        req = urllib.request.Request(
            f"{ZALOCRM_BASE_URL}/api/public/messages/send",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "X-API-Key": ZALOCRM_API_KEY},
            method="POST",
        )
        urllib.request.urlopen(req, timeout=8)
        logger.info(f"[ReminderTool] Reminder delivered successfully to {recipient_id}: '{content}'")
    except Exception as e:
        logger.warning(f"[ReminderTool] Failed to deliver reminder on Zalo: {e}")


def schedule_smart_reminder_sync(
    reminder_content: str,
    remind_at: str,
    recipient_name_or_id: Optional[str] = None,
) -> str:
    """
    Schedules an autonomous time-based reminder and fires a direct Zalo message when due.
    """
    clean_content = reminder_content.strip()
    target_recipient = recipient_name_or_id or OWNER_ZALO_ID

    # Parse delay in seconds
    delay_seconds = 60.0  # default 1 minute
    time_str = remind_at.lower().strip()

    if "giây" in time_str or "s" in time_str:
        num = re.findall(r"\d+", time_str)
        if num:
            delay_seconds = max(5.0, float(num[0]))
    elif "phút" in time_str or "m" in time_str or "min" in time_str:
        num = re.findall(r"\d+", time_str)
        if num:
            delay_seconds = float(num[0]) * 60.0
    elif "tiếng" in time_str or "giờ" in time_str or "h" in time_str:
        num = re.findall(r"\d+", time_str)
        if num:
            delay_seconds = float(num[0]) * 3600.0

    target_time_display = (datetime.datetime.now() + datetime.timedelta(seconds=delay_seconds)).strftime("%H:%M:%S (%d/%m/%Y)")

    # Launch background timer
    timer = threading.Timer(
        delay_seconds,
        _send_zalo_reminder_trigger,
        args=[target_recipient, clean_content],
    )
    timer.daemon = True
    timer.start()

    logger.info(f"[ReminderTool] Scheduled reminder in {delay_seconds}s for '{clean_content}' (fires at {target_time_display})")

    return json.dumps({
        "success": True,
        "reminder": clean_content,
        "target_recipient": target_recipient,
        "scheduled_time": target_time_display,
        "delay_seconds": delay_seconds,
        "status": "REMINDER_ARMED_AND_ACTIVE",
    }, ensure_ascii=False)


def check_reminder_tools_available() -> bool:
    return True


SCHEDULE_REMINDER_SCHEMA = {
    "type": "function",
    "function": {
        "name": "schedule_smart_reminder",
        "description": (
            "Schedules an accurate time-based reminder or deadline follow-up for the owner or a team member. "
            "When the target time arrives, the Agent automatically sends a direct Zalo reminder notification."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "reminder_content": {
                    "type": "string",
                    "description": "The exact content to remind about (e.g. 'Duyệt hợp đồng đối tác', 'Nhắc bạn Kiên nộp API').",
                },
                "remind_at": {
                    "type": "string",
                    "description": "Time specification (e.g. 'sau 10 giây', 'sau 15 phút', '15:30 chiều nay', '9h sáng mai').",
                },
                "recipient_name_or_id": {
                    "type": "string",
                    "description": "Optional recipient name or Zalo UID to deliver the reminder to.",
                },
            },
            "required": ["reminder_content", "remind_at"],
        },
    },
}

# --- Register in Hermes Tool Registry ---
from tools.registry import registry

registry.register(
    name="schedule_smart_reminder",
    toolset="reminders",
    schema=SCHEDULE_REMINDER_SCHEMA,
    handler=lambda args, **kw: schedule_smart_reminder_sync(
        reminder_content=args.get("reminder_content", "Nhắc việc"),
        remind_at=args.get("remind_at", "sau 1 phút"),
        recipient_name_or_id=args.get("recipient_name_or_id"),
    ),
    check_fn=check_reminder_tools_available,
    emoji="⏰",
)
