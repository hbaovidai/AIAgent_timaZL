import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Conversation } from '../types';

export const Conversations: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await api.getConversations();
      setConversations(data);
      if (data.length > 0 && !selectedConv) {
        const detail = await api.getConversationDetail(data[0].id);
        setSelectedConv(detail);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const handleSelect = async (c: Conversation) => {
    try {
      const detail = await api.getConversationDetail(c.id);
      setSelectedConv(detail);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
          Quản lý Cuộc trò chuyện (Conversations)
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
          Lịch sử trò chuyện theo từng người dùng qua kênh Zalo và Mock Channel.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem', height: 'calc(100vh - 200px)' }}>
        {/* Left List */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', fontWeight: 700, fontSize: '0.9rem' }}>
            Danh sách Phiên ({conversations.length})
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {conversations.map((c) => {
              const isSelected = selectedConv?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.02)',
                    border: isSelected ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f8fafc' }}>{c.title}</span>
                    <span className={`badge ${c.user_role === 'OWNER' ? 'badge-owner' : 'badge-user'}`} style={{ fontSize: '0.65rem' }}>
                      {c.user_role}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{c.user_name} ({c.channel})</span>
                    <span>{c.message_count} tin</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Chat History Viewer */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {selectedConv ? (
            <>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{selectedConv.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Kênh: {selectedConv.channel} • Người gửi: {selectedConv.user?.display_name} ({selectedConv.user?.role})
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {selectedConv.messages && selectedConv.messages.map((m: any) => {
                  const isUser = m.role === 'user';
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isUser ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.2rem' }}>
                        {isUser ? selectedConv.user?.display_name || 'Người dùng' : 'Trợ lý AI'} • {m.created_at}
                      </div>
                      <div
                        style={{
                          maxWidth: '80%',
                          padding: '0.75rem 1rem',
                          borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                          background: isUser ? 'rgba(99, 102, 241, 0.3)' : 'rgba(30, 41, 59, 0.8)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: '#f8fafc',
                          fontSize: '0.9rem',
                          lineHeight: '1.5',
                        }}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              Chọn một phiên hội thoại để xem toàn bộ lịch sử tin nhắn.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
