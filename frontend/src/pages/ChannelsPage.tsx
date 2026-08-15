import React, { useEffect, useState } from 'react';
import { Radio, CheckCircle, AlertTriangle, Send, ShieldCheck, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { ChannelInfo } from '../types';

export const ChannelsPage: React.FC = () => {
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [testRecipient, setTestRecipient] = useState('demo_recipient');
  const [testText, setTestText] = useState('Tin nhắn kiểm tra kết nối từ Dashboard.');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const loadChannels = async () => {
    try {
      setLoading(true);
      const data = await api.getChannels();
      setChannels(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  const handleTestSend = async (channelId: string) => {
    try {
      setLoading(true);
      const res = await api.sendTestMessage(channelId, testRecipient, testText);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
          Quản lý Kênh Tin Nhắn (Messaging Channels)
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
          Tách biệt hoàn toàn Core Agent và Channel: Hỗ trợ Official Zalo OA Webhook và Mock Chat Demo.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
        {channels.map((ch) => (
          <div key={ch.id} className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: ch.id === 'zalo' ? 'linear-gradient(135deg, #0068ff 0%, #00a4ff 100%)' : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <Radio size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>{ch.name}</h3>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Channel ID: {ch.id}</span>
                </div>
              </div>

              <span
                className={`badge ${
                  ch.status === 'CONNECTED' || ch.status === 'ONLINE' ? 'badge-success' : 'badge-owner'
                }`}
              >
                {ch.status}
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5' }}>
              {ch.description}
            </p>

            <div style={{ padding: '0.85rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '0.8rem', color: '#94a3b8' }}>
              <div><strong>Trạng thái:</strong> {ch.message}</div>
              {ch.oa_id && <div><strong>OA ID:</strong> {ch.oa_id}</div>}
              {ch.app_id && <div><strong>App ID:</strong> {ch.app_id}</div>}
            </div>

            {/* Test Message Box */}
            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.5rem' }}>
                Gửi tin nhắn kiểm tra outbound:
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.8rem',
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleTestSend(ch.id)}
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                >
                  <Send size={14} /> Test
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {testResult && (
        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #38bdf8' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.3rem' }}>
            Kết quả kiểm tra Outbound Message:
          </div>
          <pre style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>{JSON.stringify(testResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
