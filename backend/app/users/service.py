import logging
from sqlalchemy import select
from app.db.database import AsyncSessionLocal
from app.models.user import User, UserRole
from app.models.system_setting import SystemSetting
from app.config.settings import settings

logger = logging.getLogger(__name__)


class UserService:
    @staticmethod
    async def get_or_create_user(
        channel: str,
        external_user_id: str,
        display_name: str = "Unknown",
        phone: str | None = None,
    ) -> User:
        async with AsyncSessionLocal() as session:
            stmt = select(User).where(
                User.channel == channel,
                User.external_user_id == external_user_id,
            )
            result = await session.execute(stmt)
            user = result.scalar_one_or_none()

            # Determine Owner role:
            # 1. Check if external_user_id matches configured OWNER_ZALO_ID or "owner"
            # 2. Check if phone matches OWNER_PHONE
            # 3. Check DB system setting for owner
            is_owner = (
                external_user_id == settings.OWNER_ZALO_ID
                or external_user_id == "mock_owner_id"
                or external_user_id == "owner"
                or (phone and settings.OWNER_PHONE and phone == settings.OWNER_PHONE)
            )

            # Check DB dynamic owner setting
            owner_setting_stmt = select(SystemSetting).where(SystemSetting.key == "owner_id")
            owner_setting_res = await session.execute(owner_setting_stmt)
            owner_setting = owner_setting_res.scalar_one_or_none()
            if owner_setting and owner_setting.value_json:
                if external_user_id == str(owner_setting.value_json):
                    is_owner = True

            role = UserRole.OWNER.value if is_owner else UserRole.USER.value

            if not user:
                user = User(
                    channel=channel,
                    external_user_id=external_user_id,
                    display_name=display_name,
                    phone=phone,
                    role=role,
                )
                session.add(user)
                await session.commit()
                await session.refresh(user)
                logger.info(f"Created new user: {user.display_name} (ID: {user.id}, Role: {user.role}, Channel: {channel})")
            else:
                # Update display name / role if changed
                changed = False
                if display_name and user.display_name != display_name and display_name != "Unknown":
                    user.display_name = display_name
                    changed = True
                if is_owner and user.role != UserRole.OWNER.value:
                    user.role = UserRole.OWNER.value
                    changed = True
                if changed:
                    await session.commit()
                    await session.refresh(user)

            return user
