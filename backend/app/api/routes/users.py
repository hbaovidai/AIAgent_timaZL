from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from app.db.database import AsyncSessionLocal
from app.models.user import User, UserRole

router = APIRouter()


class UpdateRoleRequest(BaseModel):
    role: str  # "OWNER" | "USER"


@router.get("/users")
async def list_users():
    async with AsyncSessionLocal() as session:
        stmt = select(User).order_by(User.created_at.desc())
        result = await session.execute(stmt)
        users = result.scalars().all()
        return [
            {
                "id": u.id,
                "channel": u.channel,
                "external_user_id": u.external_user_id,
                "display_name": u.display_name,
                "phone": u.phone,
                "role": u.role,
                "created_at": u.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            }
            for u in users
        ]


@router.put("/users/{user_id}/role")
async def update_user_role(user_id: str, req: UpdateRoleRequest):
    new_role = req.role.upper()
    if new_role not in [UserRole.OWNER.value, UserRole.USER.value]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'OWNER' or 'USER'.")

    async with AsyncSessionLocal() as session:
        stmt = select(User).where(User.id == user_id)
        res = await session.execute(stmt)
        user = res.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.role = new_role
        await session.commit()
        return {"message": f"Updated role for {user.display_name} to {new_role}", "id": user.id, "role": user.role}
