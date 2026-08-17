import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Bot,
  LayoutDashboard,
  MessageSquare,
  History,
  Activity,
  BrainCircuit,
  CheckSquare,
  BookOpen,
  Wrench,
  Radio,
  Settings as SettingsIcon,
  Users,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats } from '../types';

export const Layout: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const location = useLocation();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await api.getStats();
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { to: '/', label: 'Tổng quan (Dashboard)', icon: LayoutDashboard },
    { to: '/demo-chat', label: 'Demo Chat (Zalo / Web)', icon: MessageSquare, highlight: true },
    { to: '/agent-runs', label: 'Agent Runs (Trace)', icon: Activity, highlight: true },
    { to: '/documents', label: 'Tài liệu & RAG (Docs)', icon: BookOpen, highlight: true },
    { to: '/conversations', label: 'Hội thoại (Conversations)', icon: History },
    { to: '/memories', label: 'Bộ nhớ (Memory)', icon: BrainCircuit },
    { to: '/tasks', label: 'Tasks & Ghi chú', icon: CheckSquare },
    { to: '/tools', label: 'Công cụ (Tools)', icon: Wrench },
    { to: '/channels', label: 'Kênh (Zalo & Mock)', icon: Radio },
    { to: '/users', label: 'Người dùng & Quyền', icon: Users },
    { to: '/settings', label: 'Cài đặt hệ thống', icon: SettingsIcon },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '280px',
          background: 'rgba(11, 17, 33, 0.95)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Logo & Brand */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
              }}
            >
              <Bot size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                AI Assistant <span style={{ color: '#818cf8' }}>24/7</span>
              </h1>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Autonomous Agent & Zalo</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', overflowY: 'auto' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '9px',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: isActive ? '#ffffff' : '#94a3b8',
                  background: isActive
                    ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.25) 0%, rgba(99, 102, 241, 0.05) 100%)'
                    : 'transparent',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={18} color={isActive ? '#818cf8' : item.highlight ? '#38bdf8' : '#64748b'} />
                <span>{item.label}</span>
                {item.highlight && !isActive && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: '0.65rem',
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      fontWeight: 700,
                    }}
                  >
                    DEMO
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <span style={{ color: '#64748b' }}>Graduation Thesis</span>
            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
              <Zap size={12} /> v1.0.0
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header */}
        <header
          style={{
            height: '64px',
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            position: 'sticky',
            top: 0,
            zIndex: 40,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
              Bảng điều khiển AI Agent
            </h2>
          </div>

          {/* Real-time System Status Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Agent Status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '0.3rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#34d399',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Agent: {stats?.agent_status || 'ONLINE'}
            </div>

            {/* Zalo Channel Status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: stats?.zalo_status === 'CONNECTED' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                border: stats?.zalo_status === 'CONNECTED' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                padding: '0.3rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: stats?.zalo_status === 'CONNECTED' ? '#38bdf8' : '#fbbf24',
              }}
            >
              <Radio size={12} />
              Zalo: {stats?.zalo_status || 'DEMO MODE'}
            </div>

            {/* Active LLM */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(139, 92, 246, 0.12)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                padding: '0.3rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#a78bfa',
              }}
            >
              <ShieldCheck size={12} />
              LLM: {stats?.llm_provider?.toUpperCase() || 'MOCK'}
            </div>
          </div>
        </header>

        {/* Page View */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
