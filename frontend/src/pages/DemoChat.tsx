import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  User,
  Bot,
  Shield,
  Activity,
  Sparkles,
  Clock,
  Wrench,
  RotateCcw,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { TraceViewer } from '../components/TraceViewer';
import { AgentRun } from '../types';

interface ChatItem {
  id: string;
  sender: 'user' | 'agent';
  role: 'OWNER' | 'USER';
  text: string;
  timestamp: string;
  agentRun?: AgentRun;
}

export const DemoChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatItem[]>([
    {
      id: 'welcome',
      sender: 'agent',
      role: 'OWNER',
      text: 'Xin chào! Tôi là Trợ lý AI Personal Assistant chạy 24/7. Bạn có thể trò chuyện với tôi với tư cách Chủ nhân (OWNER) hoặc Người dùng thông thường (USER) để kiểm tra các khả năng gọi công cụ và bộ nhớ dài hạn.',
      timestamp: new Date().toLocaleTimeString('vi-VN'),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedRole, setSelectedRole] = useState<'OWNER' | 'USER'>('OWNER');
  const [loading, setLoading] = useState(false);
  const [activeRun, setActiveRun] = useState<AgentRun | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMsgId = `user_${Date.now()}`;
    const newMsg: ChatItem = {
      id: userMsgId,
      sender: 'user',
      role: selectedRole,
      text: text,
      timestamp: new Date().toLocaleTimeString('vi-VN'),
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!textToSend) setInputText('');
    setLoading(true);

    try {
      const res = await api.sendDemoMessage({
        sender_role: selectedRole,
        sender_name: selectedRole === 'OWNER' ? 'Chủ nhân (Owner)' : 'Người dùng (Guest)',
        sender_id: selectedRole === 'OWNER' ? 'owner' : 'guest_user',
        text: text,
      });

      // Construct AgentRun object for trace viewer
      const runObj: AgentRun = {
        id: res.agent_run_id || `run_${Date.now()}`,
        incoming_message: text,
        status: 'SUCCESS',
        model: 'active-provider',
        duration_ms: res.duration_ms || 0,
        total_iterations: res.total_iterations || 1,
        tool_executions: res.tool_executions || [],
        final_response: res.response,
      };

      const agentMsg: ChatItem = {
        id: `agent_${Date.now()}`,
        sender: 'agent',
        role: selectedRole,
        text: res.response || 'Đã thực hiện xong.',
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        agentRun: runObj,
      };

      setMessages((prev) => [...prev, agentMsg]);
      setActiveRun(runObj);
    } catch (err: any) {
      console.error(err);
      const errMsg: ChatItem = {
        id: `err_${Date.now()}`,
        sender: 'agent',
        role: selectedRole,
        text: 'Lỗi kết nối máy chủ: ' + (err.message || 'Không thể xử lý'),
        timestamp: new Date().toLocaleTimeString('vi-VN'),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    { label: 'Tính toán: 125000 * 12', text: '125000 * 12 bằng bao nhiêu?' },
    { label: 'Hỏi thời gian', text: 'Mấy giờ rồi?' },
    { label: 'Lưu bộ nhớ giảng viên', text: 'Nhớ rằng tên giảng viên hướng dẫn của tôi là cô Lan.' },
    { label: 'Truy xuất bộ nhớ', text: 'Giảng viên hướng dẫn của tôi là ai?' },
    { label: 'Tạo Task kèm do date', text: 'Tạo task nộp đề cương khóa luận ngày 20/08/2026.' },
    { label: 'Multi-tool (Task + Memory)', text: 'Tạo task nộp demo AI Agent ngày 20/08/2026 và nhớ rằng đây là milestone quan trọng của khóa luận.' },
    { label: 'Test Phân quyền (USER)', text: 'Xóa toàn bộ memory của hệ thống.' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.5rem', height: 'calc(100vh - 120px)', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Left Column: Interactive Chat Interface */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Chat Header & Role Selector */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0068ff 0%, #00a4ff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.8rem',
              }}
            >
              Z
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                Zalo Mock Chat Demo
              </div>
              <div style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} /> 24/7 Agent Active
              </div>
            </div>
          </div>

          {/* Persona / Role Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(0,0,0,0.4)', padding: '0.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              onClick={() => setSelectedRole('OWNER')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: selectedRole === 'OWNER' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                color: selectedRole === 'OWNER' ? '#000' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
            >
              <Shield size={12} /> OWNER (Sếp)
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('USER')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: selectedRole === 'USER' ? 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)' : 'transparent',
                color: selectedRole === 'USER' ? '#fff' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
            >
              <User size={12} /> USER (Khách)
            </button>
          </div>
        </div>

        {/* Quick Demo Scenario Prompt Buttons */}
        <div style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.4rem', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputText(p.text);
              }}
              style={{
                fontSize: '0.75rem',
                padding: '0.3rem 0.65rem',
                borderRadius: '9999px',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                color: '#c7d2fe',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Chat Messages List */}
        <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isUser ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem', fontSize: '0.7rem', color: '#64748b' }}>
                  {isUser ? (
                    <>
                      <span>{m.timestamp}</span>
                      <span className={`badge ${m.role === 'OWNER' ? 'badge-owner' : 'badge-user'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                        {m.role}
                      </span>
                    </>
                  ) : (
                    <>
                      <span style={{ color: '#818cf8', fontWeight: 600 }}>AI Agent</span>
                      <span>{m.timestamp}</span>
                    </>
                  )}
                </div>

                <div
                  style={{
                    maxWidth: '85%',
                    padding: '0.85rem 1.1rem',
                    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isUser
                      ? m.role === 'OWNER'
                        ? 'linear-gradient(135deg, #4338ca 0%, #3730a3 100%)'
                        : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                      : 'rgba(30, 41, 59, 0.9)',
                    border: isUser ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    lineHeight: '1.5',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  }}
                >
                  {m.text}

                  {m.agentRun && (
                    <div style={{ marginTop: '0.6rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        {m.agentRun.duration_ms} ms • {m.agentRun.tool_executions.length} tools
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveRun(m.agentRun!)}
                        style={{
                          fontSize: '0.7rem',
                          background: 'rgba(99, 102, 241, 0.25)',
                          border: '1px solid rgba(99, 102, 241, 0.4)',
                          color: '#c7d2fe',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                        }}
                      >
                        <Activity size={10} /> Xem Trace
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#818cf8', fontSize: '0.85rem', padding: '0.5rem 0' }}>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', animation: 'pulse 1s infinite' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#818cf8', animation: 'pulse 1s infinite 0.2s' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a5b4fc', animation: 'pulse 1s infinite 0.4s' }} />
              </div>
              <span>Agent đang phân tích & thực thi công cụ...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          style={{
            padding: '1rem',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(15, 23, 42, 0.8)',
            display: 'flex',
            gap: '0.75rem',
          }}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Nhập tin nhắn với vai trò ${selectedRole}...`}
            disabled={loading}
            style={{
              flex: 1,
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
          <button type="submit" disabled={loading || !inputText.trim()} className="btn btn-primary">
            <Send size={16} /> Gửi
          </button>
        </form>
      </div>

      {/* Right Column: Live Observable Trace Inspector */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="#06b6d4" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
              Live Trace Inspector (Bảo vệ Khóa luận)
            </h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Visual Observability</span>
        </div>

        <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto' }}>
          {activeRun ? (
            <TraceViewer run={activeRun} />
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', gap: '0.75rem', textAlign: 'center', padding: '2rem' }}>
              <Layers size={40} color="#334155" />
              <div style={{ fontWeight: 600, color: '#94a3b8' }}>Chưa có lượt chạy Agent nào được chọn</div>
              <p style={{ fontSize: '0.8rem', maxWidth: '320px' }}>
                Khi bạn gửi tin nhắn bên trái, toàn bộ chuỗi quyết định, công cụ được gọi, tham số và kết quả sẽ hiển thị trực quan tại đây.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
