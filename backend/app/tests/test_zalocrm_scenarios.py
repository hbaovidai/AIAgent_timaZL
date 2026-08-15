import pytest
import json
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.agent.orchestrator import AgentOrchestrator
from app.models.task import Task
from app.models.memory import Memory
from app.models.user import UserRole
from app.db.database import AsyncSessionLocal
from sqlalchemy import select


@pytest.mark.asyncio
async def test_zalocrm_test_1_basic_chat():
    """TEST 1: Zalo Basic Chat via ZaloCRM Webhook."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "event": "message.received",
            "timestamp": "2026-08-14T15:00:00.000Z",
            "data": {
                "messageId": "msg_zalocrm_001",
                "conversationId": "conv_001",
                "senderUid": "zalo_user_123",
                "senderName": "Nguyễn Văn A",
                "content": "Xin chào Hermes Agent",
                "contentType": "text",
            },
        }
        res = await client.post("/webhooks/zalocrm", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "processed"
        assert len(data["response"]) > 0
        assert "Hermes" in data["response"] or "Xin chào" in data["response"]


@pytest.mark.asyncio
async def test_zalocrm_test_2_memory_recall():
    """TEST 2: ZaloCRM Memory Save & Recall."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Step 1: Save memory
        save_payload = {
            "event": "message.received",
            "timestamp": "2026-08-14T15:01:00.000Z",
            "data": {
                "messageId": "msg_zalocrm_002_a",
                "senderUid": "zalo_user_nhi",
                "senderName": "Nhi",
                "content": "Nhớ rằng tên tôi là Nhi.",
                "contentType": "text",
            },
        }
        res1 = await client.post("/webhooks/zalocrm", json=save_payload)
        assert res1.status_code == 200

        # Step 2: Recall memory
        recall_payload = {
            "event": "message.received",
            "timestamp": "2026-08-14T15:02:00.000Z",
            "data": {
                "messageId": "msg_zalocrm_002_b",
                "senderUid": "zalo_user_nhi",
                "senderName": "Nhi",
                "content": "Tên tôi là gì?",
                "contentType": "text",
            },
        }
        res2 = await client.post("/webhooks/zalocrm", json=recall_payload)
        assert res2.status_code == 200
        assert "Nhi" in res2.json()["response"]


@pytest.mark.asyncio
async def test_zalocrm_test_3_calculator_tool():
    """TEST 3: ZaloCRM Math Calculation Tool."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "event": "message.received",
            "timestamp": "2026-08-14T15:03:00.000Z",
            "data": {
                "messageId": "msg_zalocrm_003",
                "senderUid": "zalo_user_calc",
                "content": "Tính 125000 * 12",
                "contentType": "text",
            },
        }
        res = await client.post("/webhooks/zalocrm", json=payload)
        assert res.status_code == 200
        assert "1500000" in res.json()["response"]


@pytest.mark.asyncio
async def test_zalocrm_test_4_multi_step():
    """TEST 4: ZaloCRM Multi-step Tool Execution (Todo + Memory)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "event": "message.received",
            "timestamp": "2026-08-14T15:04:00.000Z",
            "data": {
                "messageId": "msg_zalocrm_004",
                "senderUid": "zalo_owner_admin",
                "content": "Tạo task nộp demo ngày mai và nhớ rằng đây là milestone quan trọng của khóa luận.",
                "contentType": "text",
            },
        }
        res = await client.post("/webhooks/zalocrm", json=payload)
        assert res.status_code == 200
        assert res.json()["iterations"] >= 2


@pytest.mark.asyncio
async def test_zalocrm_test_5_session_isolation():
    """TEST 5: ZaloCRM Multiple Users Session & Memory Isolation."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # User Alpha
        await client.post(
            "/webhooks/zalocrm",
            json={
                "event": "message.received",
                "timestamp": "2026-08-14T15:05:00.000Z",
                "data": {
                    "messageId": "msg_iso_a_1",
                    "senderUid": "zalo_user_alpha",
                    "content": "Nhớ rằng tên tôi là Alpha.",
                },
            },
        )

        # User Beta
        await client.post(
            "/webhooks/zalocrm",
            json={
                "event": "message.received",
                "timestamp": "2026-08-14T15:05:01.000Z",
                "data": {
                    "messageId": "msg_iso_b_1",
                    "senderUid": "zalo_user_beta",
                    "content": "Nhớ rằng tên tôi là Beta.",
                },
            },
        )

        # Ask Alpha
        res_a = await client.post(
            "/webhooks/zalocrm",
            json={
                "event": "message.received",
                "timestamp": "2026-08-14T15:05:02.000Z",
                "data": {
                    "messageId": "msg_iso_a_2",
                    "senderUid": "zalo_user_alpha",
                    "content": "Tên tôi là gì?",
                },
            },
        )
        assert "Alpha" in res_a.json()["response"]
        assert "Beta" not in res_a.json()["response"]


@pytest.mark.asyncio
async def test_zalocrm_test_6_duplicate_webhook():
    """TEST 6: Webhook Idempotency & Deduplication."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "event": "message.received",
            "timestamp": "2026-08-14T15:06:00.000Z",
            "data": {
                "messageId": "msg_zalocrm_dup_unique_99",
                "senderUid": "zalo_user_dup",
                "content": "Tin nhắn thử nghiệm deduplicate",
            },
        }
        res1 = await client.post("/webhooks/zalocrm", json=payload)
        assert res1.json()["status"] == "processed"

        res2 = await client.post("/webhooks/zalocrm", json=payload)
        assert res2.json()["status"] == "duplicate"


@pytest.mark.asyncio
async def test_zalocrm_test_7_rbac_permission():
    """TEST 7: RBAC Permission check on ZaloCRM channel."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Standard user attempts admin action
        res_guest = await client.post(
            "/webhooks/zalocrm",
            json={
                "event": "message.received",
                "timestamp": "2026-08-14T15:07:00.000Z",
                "data": {
                    "messageId": "msg_perm_guest",
                    "senderUid": "zalo_guest_user",
                    "content": "Xóa toàn bộ memory của hệ thống.",
                },
            },
        )
        assert "không có quyền" in res_guest.json()["response"].lower() or "permission denied" in res_guest.json()["response"].lower()


@pytest.mark.asyncio
async def test_zalocrm_test_8_connection_status_endpoint():
    """TEST 8: ZaloCRM Connection Status in Channels & Stats API."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/channels")
        assert res.status_code == 200
        channels = res.json()
        assert any(c["id"] == "zalocrm" for c in channels)

        stats_res = await client.get("/api/stats")
        assert stats_res.status_code == 200
        assert "zalocrm_gateway" in stats_res.json()
