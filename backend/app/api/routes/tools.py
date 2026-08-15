from fastapi import APIRouter

router = APIRouter()

HERMES_TOOLS = [
    {
        "name": "todo",
        "description": "Quản lý nhiệm vụ (Tasks): tạo mới, liệt kê danh sách, cập nhật và hoàn thành công việc của người dùng.",
        "permission": "PUBLIC",
        "parameters": {
            "type": "object",
            "properties": {
                "action": {"type": "string", "enum": ["create", "list", "complete", "delete"]},
                "title": {"type": "string", "description": "Tiêu đề công việc"},
                "due_date": {"type": "string", "description": "Thời hạn hoàn thành"},
            },
            "required": ["action"],
        },
    },
    {
        "name": "memory",
        "description": "Lưu trữ và quản lý bộ nhớ dài hạn của Hermes Agent theo từng người dùng.",
        "permission": "PUBLIC",
        "parameters": {
            "type": "object",
            "properties": {
                "action": {"type": "string", "enum": ["save", "search", "list", "delete"]},
                "content": {"type": "string", "description": "Nội dung cần ghi nhớ"},
                "category": {"type": "string", "description": "Phân loại: PERSONAL, PROJECT, TASK, OTHER"},
            },
            "required": ["action"],
        },
    },
    {
        "name": "session_search",
        "description": "Truy xuất lịch sử và tri thức đã lưu trong các phiên hội thoại trước của Hermes Agent.",
        "permission": "PUBLIC",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Nội dung cần tìm kiếm"},
            },
            "required": ["query"],
        },
    },
    {
        "name": "execute_code",
        "description": "Thực thi mã Python số học chính xác (tính toán, xử lý logic phức tạp).",
        "permission": "PUBLIC",
        "parameters": {
            "type": "object",
            "properties": {
                "code": {"type": "string", "description": "Mã Python cần thực thi"},
            },
            "required": ["code"],
        },
    },
    {
        "name": "skill_manage",
        "description": "Tạo, cập nhật và nâng cao kỹ năng (Self-improving skills) trong quá trình hoạt động của Hermes.",
        "permission": "PUBLIC",
        "parameters": {
            "type": "object",
            "properties": {
                "action": {"type": "string", "enum": ["create", "update", "delete", "list"]},
                "skill_name": {"type": "string"},
            },
        },
    },
    {
        "name": "system_admin_wipe",
        "description": "[ADMIN / OWNER ONLY] Xóa toàn bộ bộ nhớ và thiết lập hệ thống.",
        "permission": "OWNER",
        "parameters": {
            "type": "object",
            "properties": {
                "target": {"type": "string", "enum": ["all_system_memories", "cache"]},
            },
            "required": ["target"],
        },
    },
]


@router.get("/tools")
async def list_tools():
    return HERMES_TOOLS
