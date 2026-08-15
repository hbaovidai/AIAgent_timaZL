import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  MessageSquare,
  BrainCircuit,
  CheckSquare,
  Activity,
  Wrench,
  Radio,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats } from '../types';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getStats();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      title: 'Tổng tin nhắn',
      value: stats?.counters?.messages || 0,
      icon: MessageSquare,
      color: '#6366f1',
      link: '/conversations',
    },
    {
      title: 'Agent Runs (Lượt chạy)',
      value: stats?.counters?.agent_runs || 0,
      icon: Activity,
      color: '#06b6d4',
      link: '/agent-runs',
    },
    {
      title: 'Lệnh gọi Tool',
      value: stats?.counters?.tool_executions || 0,
      icon: Wrench,
      color: '#f59e0b',
      link: '/tools',
    },
    {
      title: 'Mục bộ nhớ dài hạn',
      value: stats?.counters?.memories || 0,
      icon: BrainCircuit,
      color: '#8b5cf6',
      link: '/memories',
    },
    {
      title: 'Tasks & Công việc',
      value: stats?.counters?.tasks || 0,
      icon: CheckSquare,
      color: '#10b981',
      link: '/tasks',
    },
    {
      title: 'Người dùng',
      value: stats?.counters?.users || 0,
      icon: Users,
      color: '#ec4899',
      link: '/users',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Banner / Hero */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Sparkles size={20} color="#818cf8" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Autonomous Multi-Step AI Agent
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
            Hệ thống Trợ lý AI Cá nhân 24/7 (Zalo & Mock)
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '650px', lineHeight: '1.5' }}>
            Mô phỏng trợ lý tương tự Hermes Agent tích hợp Zalo: tự động phân tích yêu cầu, truy xuất bộ nhớ dài hạn,
            thực thi chuỗi công cụ (Tools), phân quyền Chủ nhân (OWNER) vs User và trực quan hóa từng bước suy luận.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/demo-chat" className="btn btn-primary">
            <MessageSquare size={16} /> Mở Demo Chat Ngay
          </Link>
          <Link to="/agent-runs" className="btn btn-secondary">
            <Activity size={16} /> Xem Trace Agent
          </Link>
        </div>
      </div>

      {/* KPI Counters Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link
              key={i}
              to={card.link}
              className="glass-panel glass-panel-hover"
              style={{ padding: '1.25rem', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>{card.title}</span>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: `${card.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: card.color,
                  }}
                >
                  <Icon size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                {card.value}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Two Column Layout: Recent Agent Runs & System Capabilities */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Runs */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="#06b6d4" /> Hoạt động Agent gần đây
            </h3>
            <Link to="/agent-runs" style={{ fontSize: '0.8rem', color: '#818cf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {stats?.recent_runs && stats.recent_runs.length > 0 ? (
              stats.recent_runs.map((r) => (
                <Link
                  key={r.id}
                  to={`/agent-runs?id=${r.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', maxWidth: '70%' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      "{r.incoming_message}"
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.created_at}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Clock size={12} /> {r.duration_ms} ms
                    </span>
                    <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                      {r.status}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.85rem' }}>
                Chưa có hoạt động nào. Hãy thử gửi tin nhắn tại tab Demo Chat!
              </div>
            )}
          </div>
        </div>

        {/* Thesis Presentation Quick Highlights */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={18} color="#10b981" /> Điểm cốt lõi cho Khóa luận Tốt nghiệp
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '8px', borderLeft: '3px solid #6366f1' }}>
              <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: '0.2rem' }}>1. Kiến trúc AI Agent Đa bước (Multi-step ReAct)</div>
              <div style={{ color: '#cbd5e1' }}>Tự động chọn tool, quan sát kết quả và tiếp tục suy luận (tối đa 8 vòng lặp) trước khi trả lời.</div>
            </div>

            <div style={{ padding: '0.75rem', background: 'rgba(6, 182, 212, 0.08)', borderRadius: '8px', borderLeft: '3px solid #06b6d4' }}>
              <div style={{ fontWeight: 700, color: '#67e8f9', marginBottom: '0.2rem' }}>2. Bộ nhớ Persistent & Semantic Cosine Search</div>
              <div style={{ color: '#cbd5e1' }}>Lưu thông tin dài hạn vào Database + Vector Embedding, duy trì toàn vẹn ngay cả khi khởi động lại server.</div>
            </div>

            <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
              <div style={{ fontWeight: 700, color: '#fde047', marginBottom: '0.2rem' }}>3. Phân quyền chặt chẽ (RBAC)</div>
              <div style={{ color: '#cbd5e1' }}>Kiểm tra quyền trực tiếp tại Tool Executor, từ chối người dùng thường thực hiện tác vụ của Chủ nhân (OWNER).</div>
            </div>

            <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
              <div style={{ fontWeight: 700, color: '#86efac', marginBottom: '0.2rem' }}>4. Tách biệt hoàn toàn Core Agent & Messaging Channel</div>
              <div style={{ color: '#cbd5e1' }}>Zalo OA và Mock Chat sử dụng chung một Pipeline xử lý chuẩn hóa, dễ mở rộng thêm Telegram/Slack sau này.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
