import React, { useEffect, useState } from 'react';
import { CheckSquare, Calendar, Trash2, CheckCircle, FileText, Bell, Sun, Play } from 'lucide-react';
import { api } from '../services/api';
import { Task, Note } from '../types';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes'>('tasks');
  const [loading, setLoading] = useState(false);
  const [proactiveStatus, setProactiveStatus] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tList, nList] = await Promise.all([api.getTasks(), api.getNotes()]);
      setTasks(tList);
      setNotes(nList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCompleteTask = async (id: string) => {
    try {
      await api.updateTask(id, { status: 'COMPLETED' });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.deleteTask(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerMorningBriefing = async () => {
    try {
      setProactiveStatus('Đang gửi Morning Briefing về Zalo...');
      const res = await api.triggerMorningBriefing();
      if (res.success) {
        setProactiveStatus('✓ Đã gửi Morning Briefing chào buổi sáng về Zalo thành công!');
      } else {
        setProactiveStatus(`Lỗi gửi: ${res.error || 'Không gửi được'}`);
      }
      setTimeout(() => setProactiveStatus(null), 5000);
    } catch (err: any) {
      setProactiveStatus(`Lỗi: ${err.message}`);
      setTimeout(() => setProactiveStatus(null), 5000);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
            Quản lý Nhiệm vụ (Tasks) & Ghi chú (Notes)
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Tất cả công việc và ghi chú do Agent tự động tạo từ Zalo, kèm tính năng nhắc việc chủ động (Proactive Cron Job).
          </p>
        </div>

        {/* Proactive Push Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleTriggerMorningBriefing}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            <Sun size={16} /> Chạy thử Morning Briefing (Bắn Zalo)
          </button>
        </div>
      </div>

      {proactiveStatus && (
        <div className="glass-panel" style={{ padding: '0.75rem 1rem', borderLeft: '4px solid #10b981', color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>
          {proactiveStatus}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={() => setActiveTab('tasks')}
          style={{
            padding: '0.65rem 1.25rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'tasks' ? '2px solid #6366f1' : '2px solid transparent',
            color: activeTab === 'tasks' ? '#fff' : '#94a3b8',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <CheckSquare size={16} /> Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          style={{
            padding: '0.65rem 1.25rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'notes' ? '2px solid #6366f1' : '2px solid transparent',
            color: activeTab === 'notes' ? '#fff' : '#94a3b8',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <FileText size={16} /> Ghi chú ({notes.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'tasks' ? (
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {tasks.map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <button
                    onClick={() => handleCompleteTask(t.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: t.status === 'COMPLETED' ? '#10b981' : '#64748b',
                      cursor: 'pointer',
                      marginTop: '0.2rem',
                    }}
                  >
                    <CheckCircle size={20} />
                  </button>
                  <div>
                    <div
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: t.status === 'COMPLETED' ? '#64748b' : '#fff',
                        textDecoration: t.status === 'COMPLETED' ? 'line-through' : 'none',
                      }}
                    >
                      {t.title}
                    </div>
                    {t.description && (
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                        {t.description}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                      <span>Tạo: {new Date(t.created_at).toLocaleString()}</span>
                      {t.due_date && <span>Hạn: {t.due_date}</span>}
                      <span className={`badge ${t.status === 'COMPLETED' ? 'badge-success' : 'badge-primary'}`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteTask(t.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    padding: '0.5rem',
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {tasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                Chưa có nhiệm vụ nào. Hãy yêu cầu Agent tạo task trên Zalo hoặc Web Demo Chat!
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {notes.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{n.title}</div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', whiteSpace: 'pre-wrap' }}>{n.content}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 'auto' }}>
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </div>
            ))}
            {notes.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                Chưa có ghi chú nào.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
