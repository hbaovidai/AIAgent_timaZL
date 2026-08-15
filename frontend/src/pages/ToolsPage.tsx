import React, { useEffect, useState } from 'react';
import { Wrench, Shield, Lock, Unlock, Code2 } from 'lucide-react';
import { api } from '../services/api';
import { ToolDefinition } from '../types';

export const ToolsPage: React.FC = () => {
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getTools();
        setTools(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
          Đăng ký Công cụ & Ma trận Phân quyền (Tool Registry & RBAC)
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
          Danh sách các công cụ mà Agent có thể tự động lựa chọn thực thi kèm định nghĩa JSON Schema và cấp độ phân quyền.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.25rem' }}>
        {tools.map((t) => (
          <div key={t.name} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: t.permission === 'OWNER' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: t.permission === 'OWNER' ? '#fbbf24' : '#818cf8',
                  }}
                >
                  <Wrench size={16} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                  {t.name}
                </h3>
              </div>

              <span
                className={`badge ${t.permission === 'OWNER' ? 'badge-owner' : 'badge-success'}`}
                style={{ fontSize: '0.65rem' }}
              >
                {t.permission === 'OWNER' ? <Lock size={10} /> : <Unlock size={10} />}
                {t.permission}
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.4' }}>
              {t.description}
            </p>

            <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Code2 size={12} /> Parameters Schema:
              </div>
              <pre
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  padding: '0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: '#e2e8f0',
                  maxHeight: '120px',
                  overflowY: 'auto',
                }}
              >
                {JSON.stringify(t.parameters, null, 2)}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
