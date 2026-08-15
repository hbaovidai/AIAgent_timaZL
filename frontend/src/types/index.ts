export interface User {
  id: string;
  channel: string;
  external_user_id: string;
  display_name: string;
  phone?: string | null;
  role: 'OWNER' | 'USER';
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  channel: string;
  user_id: string;
  user_name: string;
  user_role: 'OWNER' | 'USER';
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  created_at: string;
  metadata?: any;
}

export interface ToolExecution {
  id: string;
  iteration: number;
  tool_name: string;
  arguments: any;
  result: any;
  status: 'SUCCESS' | 'FAILED' | 'PERMISSION_DENIED';
  duration_ms: number;
  created_at?: string;
}

export interface AgentRun {
  id: string;
  conversation_id?: string;
  user_id?: string;
  correlation_id?: string;
  incoming_message: string;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  model: string;
  started_at?: string;
  finished_at?: string;
  duration_ms: number;
  input_tokens?: number;
  output_tokens?: number;
  total_iterations: number;
  tool_executions_count?: number;
  tool_executions: ToolExecution[];
  final_response?: string;
  error_message?: string;
}

export interface Memory {
  id: string;
  user_id: string;
  user_name?: string;
  content: string;
  category: 'PERSONAL' | 'PREFERENCE' | 'PROJECT' | 'TASK' | 'FACT' | 'OTHER';
  importance: number;
  relevance_score?: number;
  created_at: string;
  updated_at?: string;
}

export interface Task {
  id: string;
  user_id: string;
  user_name?: string;
  title: string;
  description?: string;
  due_date?: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  user_name?: string;
  title: string;
  content: string;
  created_at: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  permission: 'PUBLIC' | 'OWNER';
  parameters: any;
}

export interface ChannelInfo {
  id: string;
  name: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'DEMO' | 'ONLINE' | 'ERROR';
  oa_id?: string;
  app_id?: string;
  has_access_token: boolean;
  description: string;
  message?: string;
}

export interface DashboardStats {
  counters: {
    users: number;
    conversations: number;
    messages: number;
    memories: number;
    tasks: number;
    agent_runs: number;
    tool_executions: number;
  };
  agent_status: string;
  llm_provider: string;
  zalo_status: string;
  recent_runs: {
    id: string;
    incoming_message: string;
    status: string;
    duration_ms: number;
    iterations: number;
    created_at: string;
  }[];
}

export interface SystemSettings {
  owner_name: string;
  owner_zalo_id: string;
  owner_phone?: string;
  llm_provider: string;
  openai_model: string;
  gemini_model: string;
  openrouter_model: string;
  max_agent_iterations: number;
  short_term_memory_limit: number;
  zalo_app_id: string;
  zalo_oa_id: string;
}
