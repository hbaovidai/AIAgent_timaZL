import React, { useEffect, useState } from 'react';
import { BrainCircuit, Search, Trash2, Plus, Sparkles, Tag, Star } from 'lucide-react';
import { api } from '../services/api';
import { Memory, User } from '../types';

export const MemoryPage: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Memory[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('PERSONAL');
  const [importance, setImportance] = useState(3);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mems, usrs] = await Promise.all([api.getMemories(), api.getUsers()]);
      setMemories(mems);
      setUsers(usrs);
      if (usrs.length > 0 && !selectedUserId) {
        setSelectedUserId(usrs[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      setLoading(true);
      const results = await api.searchMemories(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !selectedUserId) return;
    try {
      await api.createMemory({
        user_id: selectedUserId,
        content,
        category,
        importance,
      });
      setContent('');
      setShowAddModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mục bộ nhớ này?')) return;
    try {
      await api.deleteMemory(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const displayList = searchResults !== null ? searchResults : memories;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
            Bộ nhớ Dài hạn (Persistent Long-term Memory)
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Lưu trữ tri thức người dùng với Vector Embeddings, phân loại và truy xuất ngữ nghĩa bền vững qua restart.
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={16} /> Thêm Bộ nhớ Thủ công
        </button>
      </div>

      {/* Semantic Search Tester Playground */}
      <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Sparkles size={18} color="#a78bfa" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
            Semantic Vector Search Playground (Demo Khóa luận)
          </h3>
        </div>
        <form onSubmit={handleSemanticSearch} style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              placeholder="Nhập câu truy vấn ngữ nghĩa (ví dụ: 'giảng viên', 'đề tài tốt nghiệp', 'sở thích')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                padding: '0.65rem 1rem 0.65rem 2.2rem',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' }}>
            <Search size={16} /> Tìm kiếm Ngữ nghĩa
          </button>
          {searchResults !== null && (
            <button
              type="button"
              onClick={() => {
                setSearchResults(null);
                setSearchQuery('');
              }}
              className="btn btn-secondary"
            >
              Đặt lại
            </button>
          )}
        </form>
      </div>

      {/* Memory Table */}
      <div className="glass-panel" style={{ padding: '1rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
              <th style={{ padding: '0.75rem' }}>Người dùng</th>
              <th style={{ padding: '0.75rem' }}>Nội dung bộ nhớ</th>
              <th style={{ padding: '0.75rem' }}>Phân loại</th>
              <th style={{ padding: '0.75rem' }}>Độ quan trọng</th>
              {searchResults !== null && <th style={{ padding: '0.75rem' }}>Điểm tương đồng</th>}
              <th style={{ padding: '0.75rem' }}>Thời gian lưu</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {displayList.map((m) => (
              <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600, color: '#e2e8f0' }}>
                  {m.user_name || m.user_id.slice(0, 8)}
                </td>
                <td style={{ padding: '0.75rem', color: '#f1f5f9', maxWidth: '400px' }}>
                  {m.content}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                    {m.category}
                  </span>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', color: '#fbbf24', gap: '2px' }}>
                    {Array.from({ length: m.importance || 3 }).map((_, i) => (
                      <Star key={i} size={12} fill="#fbbf24" />
                    ))}
                  </div>
                </td>
                {searchResults !== null && (
                  <td style={{ padding: '0.75rem', color: '#34d399', fontWeight: 700 }}>
                    {m.relevance_score ? `${(m.relevance_score * 100).toFixed(1)}%` : 'N/A'}
                  </td>
                )}
                <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.75rem' }}>
                  {m.created_at}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                  <button
                    onClick={() => handleDelete(m.id)}
                    style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {displayList.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            Chưa có mục bộ nhớ nào. Hãy bảo Agent ghi nhớ thông tin bằng cách gõ: "Nhớ rằng..."
          </div>
        )}
      </div>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '500px', padding: '1.75rem', background: '#0f172a' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>
              Thêm Mục Bộ Nhớ Mới
            </h3>
            <form onSubmit={handleAddMemory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Người dùng:</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '6px', color: '#fff' }}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.display_name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Nội dung cần nhớ:</label>
                <textarea
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Ví dụ: Giảng viên hướng dẫn khóa luận là cô Lan..."
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Danh mục:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '6px', color: '#fff' }}
                  >
                    <option value="PERSONAL">PERSONAL</option>
                    <option value="PREFERENCE">PREFERENCE</option>
                    <option value="PROJECT">PROJECT</option>
                    <option value="TASK">TASK</option>
                    <option value="FACT">FACT</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Độ quan trọng (1-5):</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={importance}
                    onChange={(e) => setImportance(Number(e.target.value))}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu vào Bộ nhớ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
