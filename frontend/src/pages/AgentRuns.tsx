import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  Clock,
  Wrench,
  ChevronRight,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { AgentRun } from '../types';
import { TraceViewer } from '../components/TraceViewer';

export const AgentRuns: React.FC = () => {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<AgentRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams] = useSearchParams();

  const loadRuns = async () => {
    try {
      setLoading(true);
      const data = await api.getAgentRuns(100);
      setRuns(data);

      const targetId = searchParams.get('id');
      if (targetId) {
        const found = data.find((r) => r.id === targetId);
        if (found) {
          const detail = await api.getAgentRunDetail(found.id);
          setSelectedRun(detail);
        }
      } else if (data.length > 0 && !selectedRun) {
        const detail = await api.getAgentRunDetail(data[0].id);
        setSelectedRun(detail);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const handleSelectRun = async (r: AgentRun) => {
    try {
      const detail = await api.getAgentRunDetail(r.id);
      setSelectedRun(detail);
    } catch (err) {
      console.error(err);
      setSelectedRun(r);
    }
  };

  const filteredRuns = runs.filter((r) =>
    (r.incoming_message || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.final_response || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
          Agent Execution Runs & Trace Visualizer
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
          Xem và phân tích chi tiết từng chuỗi quyết định, công cụ được chọn và độ trễ thực thi (Observable Trace).
        </p>
      </div>

      {/* Main Grid: Left List - Right Flowchart */}
      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '1.5rem', height: 'calc(100vh - 200px)' }}>
        {/* Left List */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#64748b" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="text"
                placeholder="Tìm kiếm theo nội dung tin nhắn..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '0.5rem 0.5rem 0.5rem 2rem',
                  color: '#fff',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredRuns.map((r) => {
              const isSelected = selectedRun?.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => handleSelectRun(r)}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.02)',
                    border: isSelected ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(255,255,255,0.05)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
                      #{r.id.slice(0, 8)}
                    </span>
                    <span className={`badge ${r.status === 'SUCCESS' ? 'badge-success' : 'badge-user'}`} style={{ fontSize: '0.65rem' }}>
                      {r.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '0.4rem', lineHeight: '1.4' }}>
                    "{r.incoming_message}"
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b' }}>
                    <span>{r.started_at}</span>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <span style={{ color: '#38bdf8' }}>{r.duration_ms} ms</span>
                      <span style={{ color: '#fbbf24' }}>
                        {r.tool_executions ? r.tool_executions.length : r.tool_executions_count || 0} tools
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Flowchart Trace */}
        <div className="glass-panel" style={{ height: '100%', overflowY: 'auto', padding: '1.5rem' }}>
          {selectedRun ? (
            <TraceViewer run={selectedRun} />
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              Chọn một lượt chạy bên trái để hiển thị cây quyết định.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
