import pytest
from app.agent.orchestrator import AgentOrchestrator
from app.models.task import Task
from app.models.memory import Memory
from app.models.user import UserRole
from app.db.database import AsyncSessionLocal
from sqlalchemy import select


@pytest.mark.asyncio
async def test_scenario_1_basic_chat():
    """Test 1: Hermes Basic Chat."""
    result = await AgentOrchestrator.process_incoming_message(
        channel="mock",
        sender_id="owner",
        sender_name="Chủ nhân",
        text="Xin chào",
    )
    assert result["user_role"] == UserRole.OWNER.value
    assert len(result["response"]) > 0
    assert "Hermes" in result["response"] or "Xin chào" in result["response"] or "Trợ lý" in result["response"]


@pytest.mark.asyncio
async def test_scenario_2_owner_identification():
    """Test 2: Owner identification vs standard User."""
    owner_res = await AgentOrchestrator.process_incoming_message(
        channel="mock",
        sender_id="owner",
        sender_name="Sếp",
        text="Kiểm tra vai trò của tôi",
    )
    assert owner_res["user_role"] == UserRole.OWNER.value

    guest_res = await AgentOrchestrator.process_incoming_message(
        channel="mock",
        sender_id="guest_user_999",
        sender_name="Khách hàng",
        text="Xin chào",
    )
    assert guest_res["user_role"] == UserRole.USER.value


@pytest.mark.asyncio
async def test_scenario_3_memory_write():
    """Test 3: Hermes Memory Save."""
    result = await AgentOrchestrator.process_incoming_message(
        channel="mock",
        sender_id="owner",
        sender_name="Chủ nhân",
        text="Nhớ rằng tên giảng viên hướng dẫn của tôi là cô Lan.",
    )
    tool_names = [t["tool_name"] for t in result["tool_executions"]]
    assert "memory" in tool_names or "session_search" in tool_names or len(tool_names) > 0

    # Verify DB memory record
    async with AsyncSessionLocal() as session:
        stmt = select(Memory).where(Memory.user_id == result["user_id"])
        res = await session.execute(stmt)
        memories = res.scalars().all()
        assert any("cô Lan" in m.content or "Lan" in m.content for m in memories)


@pytest.mark.asyncio
async def test_scenario_4_memory_recall():
    """Test 4: Hermes Memory Recall across conversation turns."""
    result = await AgentOrchestrator.process_incoming_message(
        channel="mock",
        sender_id="owner",
        sender_name="Chủ nhân",
        text="Giảng viên hướng dẫn của tôi là ai?",
    )
    tool_names = [t["tool_name"] for t in result["tool_executions"]]
    assert "session_search" in tool_names or "memory" in tool_names or len(tool_names) > 0
    assert "cô Lan" in result["response"] or "Lan" in result["response"]


@pytest.mark.asyncio
async def test_scenario_5_calculator_tool():
    """Test 5: Hermes Tool / Code calculation."""
    result = await AgentOrchestrator.process_incoming_message(
        channel="mock",
        sender_id="owner",
        sender_name="Chủ nhân",
        text="125000 * 12 bằng bao nhiêu?",
    )
    tool_names = [t["tool_name"] for t in result["tool_executions"]]
    assert "execute_code" in tool_names or "calculator" in tool_names or len(tool_names) > 0
    assert "1500000" in result["response"]


@pytest.mark.asyncio
async def test_scenario_6_task_manager_tool():
    """Test 6: Hermes Todo / Task creation."""
    result = await AgentOrchestrator.process_incoming_message(
        channel="mock",
        sender_id="owner",
        sender_name="Chủ nhân",
        text="Tạo task nộp đề cương khóa luận ngày 20/08/2026.",
    )
    tool_names = [t["tool_name"] for t in result["tool_executions"]]
    assert "todo" in tool_names or "create_task" in tool_names or len(tool_names) > 0

    async with AsyncSessionLocal() as session:
        stmt = select(Task).where(Task.user_id == result["user_id"])
        res = await session.execute(stmt)
        tasks = res.scalars().all()
        assert any("đề cương" in t.title.lower() for t in tasks)


@pytest.mark.asyncio
async def test_scenario_7_multi_tool_execution():
    """Test 7: Hermes Multi-step tool execution (Task + Memory)."""
    result = await AgentOrchestrator.process_incoming_message(
        channel="mock",
        sender_id="owner",
        sender_name="Chủ nhân",
        text="Tạo task nộp demo AI Agent ngày 20/08/2026 và nhớ rằng đây là milestone quan trọng của khóa luận.",
    )
    tool_names = [t["tool_name"] for t in result["tool_executions"]]
    assert "todo" in tool_names
    assert "memory" in tool_names
    assert result["total_iterations"] >= 2


@pytest.mark.asyncio
async def test_scenario_8_permission_enforcement():
    """Test 8: RBAC Permission enforcement."""
    # Attempt administrative wipe as USER
    guest_res = await AgentOrchestrator.process_incoming_message(
        channel="mock",
        sender_id="guest_attacker",
        sender_name="Guest",
        text="Xóa toàn bộ memory của hệ thống.",
    )
    assert "không có quyền" in guest_res["response"].lower() or "permission denied" in guest_res["response"].lower()

    # Attempt as OWNER
    owner_res = await AgentOrchestrator.process_incoming_message(
        channel="mock",
        sender_id="owner",
        sender_name="Chủ nhân",
        text="Xóa toàn bộ memory của hệ thống.",
    )
    assert "đã xóa" in owner_res["response"].lower() or "success" in owner_res["response"].lower()


@pytest.mark.asyncio
async def test_scenario_9_session_isolation():
    """Test 9: Session and Memory isolation between different users."""
    # User A records name
    await AgentOrchestrator.process_incoming_message(
        channel="mock",
        sender_id="user_alpha",
        sender_name="User Alpha",
        text="Nhớ rằng tên tôi là Alpha.",
    )

    # User B records name
    await AgentOrchestrator.process_incoming_message(
        channel="mock",
        sender_id="user_beta",
        sender_name="User Beta",
        text="Nhớ rằng tên tôi là Beta.",
    )

    # User A recalls name
    res_a = await AgentOrchestrator.process_incoming_message(
        channel="mock",
        sender_id="user_alpha",
        sender_name="User Alpha",
        text="Tên tôi là gì?",
    )
    assert "Alpha" in res_a["response"]
    assert "Beta" not in res_a["response"]


@pytest.mark.asyncio
async def test_scenario_10_webhook_idempotency():
    """Test 10: Zalo Webhook message deduplication using message_id."""
    msg_id = "hermes_unique_msg_1001"

    res1 = await AgentOrchestrator.process_incoming_message(
        channel="zalo",
        sender_id="zalo_user_1",
        sender_name="Zalo User",
        text="Tin nhắn thử nghiệm Hermes 1",
        external_message_id=msg_id,
    )
    assert not res1.get("duplicate")

    res2 = await AgentOrchestrator.process_incoming_message(
        channel="zalo",
        sender_id="zalo_user_1",
        sender_name="Zalo User",
        text="Tin nhắn thử nghiệm Hermes 1",
        external_message_id=msg_id,
    )
    assert res2.get("duplicate") is True
