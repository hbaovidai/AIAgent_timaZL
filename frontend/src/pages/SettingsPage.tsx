import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, ShieldCheck, Cpu, Sliders } from 'lucide-react';
import { api } from '../services/api';
import { SystemSettings } from '../types';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getSettings();
        setSettings(data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      setLoading(true);
      await api.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!settings) return null;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
          Cài đặt Hệ thống (System Settings)
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
          Cấu hình danh tính Chủ nhân (OWNER), Nhà cung cấp LLM và tham số vòng lặp Agent.
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Owner Identification Card */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} color="#fbbf24" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              Nhận diện Chủ nhân (Owner / Boss Configuration)
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                Tên Chủ nhân:
              </label>
              <input
                type="text"
                value={settings.owner_name}
                onChange={(e) => setSettings({ ...settings, owner_name: e.target.value })}
                style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.65rem', borderRadius: '8px', color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                Zalo User ID của Chủ nhân (Immutable Platform ID):
              </label>
              <input
                type="text"
                value={settings.owner_zalo_id}
                onChange={(e) => setSettings({ ...settings, owner_zalo_id: e.target.value })}
                style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.65rem', borderRadius: '8px', color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                Số điện thoại Chủ nhân:
              </label>
              <input
                type="text"
                value={settings.owner_phone || ''}
                onChange={(e) => setSettings({ ...settings, owner_phone: e.target.value })}
                style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.65rem', borderRadius: '8px', color: '#fff' }}
              />
            </div>
          </div>
        </div>

        {/* LLM Provider Configuration */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={20} color="#818cf8" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              Cấu hình Trí tuệ nhân tạo (LLM Provider)
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                Nhà cung cấp LLM hoạt động:
              </label>
              <select
                value={settings.llm_provider}
                onChange={(e) => setSettings({ ...settings, llm_provider: e.target.value })}
                style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.65rem', borderRadius: '8px', color: '#fff' }}
              >
                <option value="mock">MOCK (Offline Deterministic - Demo không cần key)</option>
                <option value="openai">OpenAI (gpt-4o-mini / gpt-4o)</option>
                <option value="gemini">Google Gemini (gemini-1.5-flash / gemini-1.5-pro)</option>
                <option value="openrouter">OpenRouter (Claude-3.5, Llama-3, DeepSeek)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                Mô hình OpenAI:
              </label>
              <input
                type="text"
                value={settings.openai_model}
                onChange={(e) => setSettings({ ...settings, openai_model: e.target.value })}
                style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.65rem', borderRadius: '8px', color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                Mô hình Gemini:
              </label>
              <input
                type="text"
                value={settings.gemini_model}
                onChange={(e) => setSettings({ ...settings, gemini_model: e.target.value })}
                style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.65rem', borderRadius: '8px', color: '#fff' }}
              />
            </div>
          </div>
        </div>

        {/* Agent Execution & Loop Parameters */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={20} color="#34d399" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              Tham số Vòng lặp Agent (Agent Execution Parameters)
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                Số vòng lặp suy luận tối đa (Max Agent Iterations):
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={settings.max_agent_iterations || 8}
                onChange={(e) => setSettings({ ...settings, max_agent_iterations: parseInt(e.target.value, 10) || 8 })}
                style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.65rem', borderRadius: '8px', color: '#fff' }}
              />
              <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                Giới hạn số bước ReAct suy luận / gọi tool liên tiếp trong một câu hỏi (mặc định: 8).
              </span>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                Giới hạn bộ nhớ ngắn hạn (Short-term Memory Limit):
              </label>
              <input
                type="number"
                min={5}
                max={100}
                value={settings.short_term_memory_limit || 20}
                onChange={(e) => setSettings({ ...settings, short_term_memory_limit: parseInt(e.target.value, 10) || 20 })}
                style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.65rem', borderRadius: '8px', color: '#fff' }}
              />
              <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                Số tin nhắn gần nhất được nạp vào ngữ cảnh của phiên hội thoại (mặc định: 20).
              </span>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
          {saved && (
            <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>
              ✓ Đã lưu cài đặt thành công!
            </span>
          )}
          <button type="submit" disabled={loading} className="btn btn-primary">
            <Save size={16} /> Lưu Cài đặt
          </button>
        </div>
      </form>
    </div>
  );
};
