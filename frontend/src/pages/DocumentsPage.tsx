import React, { useEffect, useState } from 'react';
import { BookOpen, Upload, FileText, Trash2, Search, CheckCircle, Database, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'text' | 'search'>('upload');

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [author, setAuthor] = useState('Huỳnh Bảo');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Raw Text State
  const [textFilename, setTextFilename] = useState('');
  const [textContent, setTextContent] = useState('');

  // Semantic Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any | null>(null);
  const [searching, setSearching] = useState(false);

  const loadDocs = async () => {
    try {
      setLoading(true);
      const res = await api.getDocuments();
      setDocuments(res.documents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    try {
      setUploadStatus('Đang xử lý phân tích và lưu vector vào ChromaDB...');
      const res = await api.uploadDocument(file, author);
      setUploadStatus(`✓ Đã nạp thành công tài liệu: ${res.filename} (${res.chunks_count} đoạn vector).`);
      setFile(null);
      loadDocs();
      setTimeout(() => setUploadStatus(null), 5000);
    } catch (err: any) {
      setUploadStatus(`Lỗi tải lên: ${err.response?.data?.detail || err.message}`);
      setTimeout(() => setUploadStatus(null), 5000);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textFilename || !textContent) return;
    try {
      setUploadStatus('Đang lưu văn bản vào kho tri thức...');
      const res = await api.addTextDocument(textFilename, textContent, author);
      setUploadStatus(`✓ Đã nạp thành công: ${res.filename} (${res.chunks_count} đoạn vector).`);
      setTextFilename('');
      setTextContent('');
      loadDocs();
      setTimeout(() => setUploadStatus(null), 5000);
    } catch (err: any) {
      setUploadStatus(`Lỗi lưu văn bản: ${err.response?.data?.detail || err.message}`);
      setTimeout(() => setUploadStatus(null), 5000);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      await api.deleteDocument(id);
      loadDocs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    try {
      setSearching(true);
      const res = await api.searchKnowledge(searchQuery, 3);
      setSearchResults(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
          Kho Tri thức & Đọc hiểu Tài liệu (RAG / Vector Database)
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
          Nạp tài liệu PDF, Markdown hoặc văn bản vào ChromaDB để Agent tự động tra cứu và trích dẫn chuẩn xác.
        </p>
      </div>

      {uploadStatus && (
        <div className="glass-panel" style={{ padding: '0.75rem 1rem', borderLeft: '4px solid #38bdf8', color: '#38bdf8', fontSize: '0.85rem', fontWeight: 600 }}>
          {uploadStatus}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={() => setActiveTab('upload')}
          style={{
            padding: '0.65rem 1.25rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'upload' ? '2px solid #6366f1' : '2px solid transparent',
            color: activeTab === 'upload' ? '#fff' : '#94a3b8',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Upload size={16} /> Tải file PDF / Text
        </button>
        <button
          onClick={() => setActiveTab('text')}
          style={{
            padding: '0.65rem 1.25rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'text' ? '2px solid #6366f1' : '2px solid transparent',
            color: activeTab === 'text' ? '#fff' : '#94a3b8',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <FileText size={16} /> Nhập văn bản trực tiếp
        </button>
        <button
          onClick={() => setActiveTab('search')}
          style={{
            padding: '0.65rem 1.25rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'search' ? '2px solid #6366f1' : '2px solid transparent',
            color: activeTab === 'search' ? '#fff' : '#94a3b8',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Search size={16} /> Thử nghiệm Tìm kiếm Vector (RAG Test)
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'upload' && (
        <form onSubmit={handleFileUpload} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                Chọn file tài liệu (PDF, TXT, Markdown):
              </label>
              <input
                type="file"
                accept=".pdf,.txt,.md"
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '8px', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                Tác giả / Nguồn tài liệu:
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.65rem', borderRadius: '8px', color: '#fff' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={!file} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Upload size={16} /> Nạp vào Vector DB
            </button>
          </div>
        </form>
      )}

      {activeTab === 'text' && (
        <form onSubmit={handleTextSubmit} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
              Tiêu đề tài liệu / Quy định / Hướng dẫn:
            </label>
            <input
              type="text"
              placeholder="VD: Quy chế bảo vệ khóa luận tốt nghiệp 2026"
              value={textFilename}
              onChange={(e) => setTextFilename(e.target.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.65rem', borderRadius: '8px', color: '#fff' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
              Nội dung văn bản chi tiết:
            </label>
            <textarea
              rows={6}
              placeholder="Dán nội dung tài liệu, quy định hoặc thông số kỹ thuật vào đây..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.65rem', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={!textFilename || !textContent} className="btn btn-primary">
              <Sparkles size={16} /> Lưu vào Tri thức Agent
            </button>
          </div>
        </form>
      )}

      {activeTab === 'search' && (
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              placeholder="Nhập câu hỏi để tìm kiếm ngữ nghĩa trong Vector DB..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.65rem', borderRadius: '8px', color: '#fff' }}
            />
            <button type="submit" disabled={searching || !searchQuery} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={16} /> Tìm kiếm Semantic
            </button>
          </form>

          {searchResults && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
                Kết quả tìm thấy ({searchResults.total_matches} đoạn văn bản phù hợp nhất):
              </div>
              {searchResults.results.map((r: any, idx: number) => (
                <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                    <span style={{ fontWeight: 700, color: '#fff' }}>📄 {r.filename} (Đoạn {r.chunk_index + 1})</span>
                    <span>Độ tương đồng: {r.distance ? (1 - r.distance).toFixed(3) : 'N/A'}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                    {r.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Document Repository List */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Database size={18} color="#6366f1" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
            Danh mục Tài liệu đã được Nạp ({documents.length})
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {documents.map((doc) => (
            <div
              key={doc.id}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <BookOpen size={20} color="#38bdf8" />
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>{doc.filename}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    Tác giả: {doc.author} • Số đoạn Vector: {doc.total_chunks} đoạn
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDeleteDoc(doc.id)}
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

          {documents.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              Kho tài liệu đang trống. Hãy tải lên file PDF hoặc dán nội dung văn bản ở trên!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
