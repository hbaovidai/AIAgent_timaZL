import React, { useEffect, useState } from 'react';
import { CheckSquare, Calendar, Trash2, CheckCircle, FileText } from 'lucide-react';
import { api } from '../services/api';
import { Task, Note } from '../types';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes'>('tasks');
  const [loading, setLoading] = useState(false);

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

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
          Quản lý Nhiệm vụ (Tasks) & Ghi chú (Notes)
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
          Tất cả công việc và mẩu ghi chú do Agent tự động tạo ra từ yêu cầu của người dùng.
        </p>
      </div>

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
                      marginTop: '2px',
                    }}
                  >
                    <CheckCircle size={20} />
                  </button>
                  <div>
                    <div
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: t.status === 'COMPLETED' ? '#94a3b8' : '#f8fafc',
                        textDecoration: t.status === 'COMPLETED' ? 'line-through' : 'none',
                      }}
                    >
                      {t.title}
                    </div>
                    {t.description && (
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                        {t.description}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
                      {t.due_date && (
                        <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Calendar size={12} /> Hạn: {t.due_date}
                        </span>
                      )}
                      <span>Tạo lúc: {t.created_at}</span>
                      <span>Người tạo: {t.user_name}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={`badge ${t.status === 'COMPLETED' ? 'badge-success' : 'badge-owner'}`}>
                    {t.status}
                  </span>
                  <button
                    onClick={() => handleDeleteTask(t.id)}
                    style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {tasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                Chưa có task nào. Thử yêu cầu Agent: "Tạo task nộp đề cương ngày mai..."
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {notes.map((n) => (
            <div key={n.id} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>{n.title}</div>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                {n.content}
              </div>
              <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.75rem', color: '#64748b' }}>
                {n.created_at} • {n.user_name}
              </div>
            </div>
          ))}

          {notes.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#64748b' }} className="glass-panel">
              Chưa có ghi chú nào. Thử yêu cầu Agent: "Tạo ghi chú về đề tài tốt nghiệp..."
            </div>
          )}
        </div>
      )}
    </div>
  );
};
