import axios from 'axios';
import {
  Conversation,
  AgentRun,
  Memory,
  Task,
  Note,
  ToolDefinition,
  ChannelInfo,
  DashboardStats,
  SystemSettings,
  User,
} from '../types';

const API_BASE = '/api';

export const api = {
  // Stats
  getStats: async (): Promise<DashboardStats> => {
    const res = await axios.get(`${API_BASE}/stats`);
    return res.data;
  },

  // Demo Chat
  sendDemoMessage: async (data: {
    sender_role: 'OWNER' | 'USER';
    sender_id?: string;
    sender_name?: string;
    text: string;
  }) => {
    const res = await axios.post(`${API_BASE}/demo/messages`, data);
    return res.data;
  },

  // Conversations
  getConversations: async (): Promise<Conversation[]> => {
    const res = await axios.get(`${API_BASE}/conversations`);
    return res.data;
  },

  getConversationDetail: async (id: string): Promise<any> => {
    const res = await axios.get(`${API_BASE}/conversations/${id}`);
    return res.data;
  },

  // Agent Runs
  getAgentRuns: async (limit = 50): Promise<AgentRun[]> => {
    const res = await axios.get(`${API_BASE}/agent-runs?limit=${limit}`);
    return res.data;
  },

  getAgentRunDetail: async (id: string): Promise<AgentRun> => {
    const res = await axios.get(`${API_BASE}/agent-runs/${id}`);
    return res.data;
  },

  // Memories
  getMemories: async (userId?: string): Promise<Memory[]> => {
    const url = userId ? `${API_BASE}/memories?user_id=${userId}` : `${API_BASE}/memories`;
    const res = await axios.get(url);
    return res.data;
  },

  createMemory: async (data: {
    user_id: string;
    content: string;
    category?: string;
    importance?: number;
  }): Promise<Memory> => {
    const res = await axios.post(`${API_BASE}/memories`, data);
    return res.data;
  },

  searchMemories: async (query: string, userId?: string): Promise<Memory[]> => {
    const res = await axios.post(`${API_BASE}/memories/search`, { query, user_id: userId });
    return res.data;
  },

  deleteMemory: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE}/memories/${id}`);
  },

  // Tasks & Notes
  getTasks: async (userId?: string): Promise<Task[]> => {
    const url = userId ? `${API_BASE}/tasks?user_id=${userId}` : `${API_BASE}/tasks`;
    const res = await axios.get(url);
    return res.data;
  },

  createTask: async (data: { user_id: string; title: string; description?: string; due_date?: string }): Promise<Task> => {
    const res = await axios.post(`${API_BASE}/tasks`, data);
    return res.data;
  },

  updateTask: async (id: string, data: Partial<Task>): Promise<void> => {
    await axios.put(`${API_BASE}/tasks/${id}`, data);
  },

  deleteTask: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE}/tasks/${id}`);
  },

  getNotes: async (userId?: string): Promise<Note[]> => {
    const url = userId ? `${API_BASE}/notes?user_id=${userId}` : `${API_BASE}/notes`;
    const res = await axios.get(url);
    return res.data;
  },

  // Tools
  getTools: async (): Promise<ToolDefinition[]> => {
    const res = await axios.get(`${API_BASE}/tools`);
    return res.data;
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    const res = await axios.get(`${API_BASE}/users`);
    return res.data;
  },

  updateUserRole: async (userId: string, role: 'OWNER' | 'USER'): Promise<void> => {
    await axios.put(`${API_BASE}/users/${userId}/role`, { role });
  },

  // Channels
  getChannels: async (): Promise<ChannelInfo[]> => {
    const res = await axios.get(`${API_BASE}/channels`);
    return res.data;
  },

  sendTestMessage: async (channel: string, recipient_id: string, text: string): Promise<any> => {
    const res = await axios.post(`${API_BASE}/channels/test`, { channel, recipient_id, text });
    return res.data;
  },

  // Settings
  getSettings: async (): Promise<SystemSettings> => {
    const res = await axios.get(`${API_BASE}/settings`);
    return res.data;
  },

  updateSettings: async (data: Partial<SystemSettings>): Promise<void> => {
    await axios.put(`${API_BASE}/settings`, data);
  },

  // Proactive Scheduler & Reminders
  getScheduledJobs: async (): Promise<any> => {
    const res = await axios.get(`${API_BASE}/scheduler/jobs`);
    return res.data;
  },

  triggerMorningBriefing: async (recipientId?: string): Promise<any> => {
    const res = await axios.post(`${API_BASE}/scheduler/morning-briefing`, { recipient_id: recipientId });
    return res.data;
  },

  sendProactiveReminder: async (title: string, text: string, recipientId?: string): Promise<any> => {
    const res = await axios.post(`${API_BASE}/scheduler/reminders`, { title, text, recipient_id: recipientId });
    return res.data;
  },

  // RAG & Documents
  getDocuments: async (): Promise<any> => {
    const res = await axios.get(`${API_BASE}/documents`);
    return res.data;
  },

  getDocumentDetail: async (id: string): Promise<any> => {
    const res = await axios.get(`${API_BASE}/documents/${id}`);
    return res.data;
  },

  uploadDocument: async (file: File, author = 'Huỳnh Bảo'): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('author', author);
    const res = await axios.post(`${API_BASE}/documents/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  addTextDocument: async (filename: string, content: string, author = 'Huỳnh Bảo'): Promise<any> => {
    const res = await axios.post(`${API_BASE}/documents/text`, { filename, content, author });
    return res.data;
  },

  deleteDocument: async (id: string): Promise<any> => {
    const res = await axios.delete(`${API_BASE}/documents/${id}`);
    return res.data;
  },

  searchKnowledge: async (query: string, nResults = 3): Promise<any> => {
    const res = await axios.post(`${API_BASE}/documents/search`, { query, n_results: nResults });
    return res.data;
  },
};
