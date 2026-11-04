// api/chat.ts - AI 对话服务层
// 参考 pages/chat/chat.vue 的接口调用，抽取为独立 API 模块

// ==================== FastAPI 后端地址 ====================
const CHAT_API_BASE = 'http://localhost:8000'

// ==================== 类型定义 ====================

/** 消息角色 */
export type MessageRole = 'user' | 'assistant' | 'system'

/** 聊天消息 */
export interface ChatMessage {
  role: MessageRole
  content: string
  timestamp: string
  message_id?: string | null
}

/** 会话信息 */
export interface ChatSession {
  session_id: string
  created_at: string
  updated_at: string
  message_count: number
}

/** 会话列表响应 */
export interface SessionListResponse {
  sessions: ChatSession[]
  total: number
  page: number
  page_size: number
}

/** 历史消息响应 */
export interface HistoryResponse {
  session_id: string
  messages: ChatMessage[]
  total_count: number
}

/** 发送消息请求 */
export interface SendMessageRequest {
  message: string
  session_id?: string | null
  stream?: boolean
  class_id?: number | null
  /** 教学班智能体名称，为空时使用该教学班默认智能体 */
  agent_name?: string | null
  student_id?: number | null
  student_name?: string | null
}

/** 发送消息响应 */
export interface SendMessageResponse {
  response: string
  session_id: string
  message_id: string | null
  timestamp: string
}

/** 通用 API 响应包装 */
interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// ==================== 请求工具 ====================

/**
 * 向 FastAPI 发送请求（不经过 xs-auth 的 Authorization 拦截）
 */
function chatRequest<T>(url: string, options: {
  method?: 'GET' | 'POST' | 'DELETE'
  data?: Record<string, unknown>
}): Promise<T> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: CHAT_API_BASE + url,
      method: options.method || 'GET',
      data: options.data,
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        const body = res.data as ApiResponse<T> | T
        if (res.statusCode === 200) {
          // FastAPI 可能直接返回数据，也可能包装在 ApiResponse 中
          resolve((body as ApiResponse<T>).data || (body as T))
        } else {
          const detail = (body as { detail?: string })?.detail
          reject(new Error(detail || (res.statusCode === 429 ? '该智能体用量已达教师设定的上限' : '请求失败')))
        }
      },
      fail: (err) => reject(err)
    })
  })
}

// ==================== API 函数 ====================

/**
 * 获取会话列表
 */
export function fetchSessions(page = 1, pageSize = 20): Promise<SessionListResponse> {
  return chatRequest<SessionListResponse>('/api/chat/sessions', {
    data: { page, page_size: pageSize }
  })
}

/**
 * 获取会话历史消息
 */
export function fetchHistory(sessionId: string, limit = 100, offset = 0): Promise<HistoryResponse> {
  return chatRequest<HistoryResponse>(`/api/chat/history/${sessionId}`, {
    data: { limit, offset }
  })
}

/**
 * 发送消息
 */
export function sendMessage(params: SendMessageRequest): Promise<SendMessageResponse> {
  return chatRequest<SendMessageResponse>('/api/chat/send', {
    method: 'POST',
    data: params as unknown as Record<string, unknown>
  })
}

/**
 * 删除会话
 */
export function deleteSession(sessionId: string): Promise<void> {
  return chatRequest<void>(`/api/chat/session/${sessionId}`, {
    method: 'DELETE'
  })
}