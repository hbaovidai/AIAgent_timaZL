import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { DemoChat } from './pages/DemoChat';
import { AgentRuns } from './pages/AgentRuns';
import { Conversations } from './pages/Conversations';
import { MemoryPage } from './pages/MemoryPage';
import { TasksPage } from './pages/TasksPage';
import { ToolsPage } from './pages/ToolsPage';
import { ChannelsPage } from './pages/ChannelsPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="demo-chat" element={<DemoChat />} />
          <Route path="agent-runs" element={<AgentRuns />} />
          <Route path="conversations" element={<Conversations />} />
          <Route path="memories" element={<MemoryPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="tools" element={<ToolsPage />} />
          <Route path="channels" element={<ChannelsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
