import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Wrench,
  Bot,
  User as UserIcon,
  Cpu,
  ArrowDown,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import { AgentRun } from '../types';

interface TraceViewerProps {
  run: AgentRun;
}

export const TraceViewer: React.FC<TraceViewerProps> = ({ run }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Run Summary Header Card */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: run.status === 'SUCCESS' ? '#10b981' : '#f43f5e',
                display: 'inline-block',
              }}
            />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
              Agent Run Trace: <span style={{ fontFamily: 'var(--font-mono)', color: '#818cf8', fontSize: '0.9rem' }}>{run.id.slice(0, 8)}...</span>
            </h3>
          </div>
          <span
            className={`badge ${
              run.status === 'SUCCESS' ? 'badge-success' : 'badge-user'
            }`}
          >
            {run.status}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Mô hình LLM</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>{run.model}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Thời gian thực thi</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Clock size={14} /> {run.duration_ms} ms
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Số vòng lặp (Iterations)</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Layers size={14} /> {run.total_iterations} / 8
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Công cụ đã gọi</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Wrench size={14} /> {run.tool_executions ? run.tool_executions.length : run.tool_executions_count || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-Step Flowchart Execution Trace */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
        {/* Step 1: Incoming Message */}
        <div className="glass-panel" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #38bdf8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <UserIcon size={16} color="#38bdf8" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
              [BƯỚC 1] Nhận tin nhắn từ Zalo / Người dùng
            </span>
          </div>
          <div style={{ fontSize: '0.9rem', color: '#f1f5f9', background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: '8px' }}>
            "{run.incoming_message}"
          </div>
        </div>

        {/* Down Arrow */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '-0.25rem 0' }}>
          <ArrowDown size={18} color="#6366f1" />
        </div>

        {/* Step 2: Context & Memory Retrieval */}
        <div className="glass-panel" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <Cpu size={16} color="#8b5cf6" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase' }}>
              [BƯỚC 2] Nạp Ngữ cảnh & Truy xuất Bộ nhớ Dài hạn
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4' }}>
            Hệ thống tự động tra cứu bộ nhớ ngữ nghĩa (Semantic Memory), lịch sử ngắn hạn gần nhất và phân quyền người gửi (RBAC).
          </div>
        </div>

        {/* Step 3+: Observable Tool Executions (Iterations) */}
        {run.tool_executions && run.tool_executions.length > 0 ? (
          run.tool_executions.map((te, idx) => (
            <React.Fragment key={te.id || idx}>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '-0.25rem 0' }}>
                <ArrowDown size={18} color="#f59e0b" />
              </div>

              <div
                className="glass-panel"
                style={{
                  padding: '1.25rem',
                  borderLeft: `4px solid ${
                    te.status === 'SUCCESS' ? '#f59e0b' : te.status === 'PERMISSION_DENIED' ? '#f43f5e' : '#ef4444'
                  }`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Wrench size={16} color="#f59e0b" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase' }}>
                      [VÒNG LẶP #{te.iteration}] Agent chọn Tool: <code style={{ color: '#fff', background: 'rgba(245, 158, 11, 0.2)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>{te.tool_name}</code>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{te.duration_ms} ms</span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        background:
                          te.status === 'SUCCESS'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : te.status === 'PERMISSION_DENIED'
                            ? 'rgba(244, 63, 94, 0.2)'
                            : 'rgba(239, 68, 68, 0.2)',
                        color:
                          te.status === 'SUCCESS'
                            ? '#34d399'
                            : te.status === 'PERMISSION_DENIED'
                            ? '#fb7185'
                            : '#f87171',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      {te.status}
                    </span>
                  </div>
                </div>

                {/* Tool Arguments */}
                <div style={{ marginBottom: '0.6rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Tham số truyền vào (Arguments):</div>
                  <pre
                    style={{
                      background: 'rgba(0,0,0,0.4)',
                      padding: '0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      color: '#e2e8f0',
                      overflowX: 'auto',
                    }}
                  >
                    {typeof te.arguments === 'object' ? JSON.stringify(te.arguments, null, 2) : String(te.arguments)}
                  </pre>
                </div>

                {/* Tool Execution Result */}
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Kết quả Tool trả về (Observation):</div>
                  <pre
                    style={{
                      background: 'rgba(0,0,0,0.4)',
                      padding: '0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      color: te.status === 'SUCCESS' ? '#34d399' : '#fb7185',
                      overflowX: 'auto',
                    }}
                  >
                    {typeof te.result === 'object' ? JSON.stringify(te.result, null, 2) : String(te.result)}
                  </pre>
                </div>
              </div>
            </React.Fragment>
          ))
        ) : (
          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748b', padding: '0.5rem' }}>
            (Không có lệnh gọi công cụ ngoại vi nào cần thiết - Phản hồi trực tiếp từ LLM)
          </div>
        )}

        {/* Down Arrow */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '-0.25rem 0' }}>
          <ArrowDown size={18} color="#10b981" />
        </div>

        {/* Final Step: Final Answer Delivered */}
        <div className="glass-panel" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <Bot size={16} color="#10b981" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
              [KẾT QUẢ CUỐI CÙNG] Phản hồi gửi lại người dùng qua Zalo
            </span>
          </div>
          <div
            style={{
              fontSize: '0.95rem',
              color: '#f8fafc',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              padding: '0.85rem',
              borderRadius: '8px',
              lineHeight: '1.5',
            }}
          >
            {run.final_response || 'Đã hoàn thành tác vụ.'}
          </div>
        </div>
      </div>
    </div>
  );
};
