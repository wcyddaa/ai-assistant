// ========== 统一响应 ==========
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: string
}

// ========== 教材实体 ==========
export interface TextbookEntity {
  id: string
  title: string
  isbn: string
  author: string
  category: string
  totalPages: number
  publishDate: string
  fileType: string
  fileSize: number
  createTime: string
  updateTime: string
}

// ========== 创建教材请求 ==========
export interface TextbookCreateRequest {
  title: string
  isbn?: string
  author?: string
  category?: string
  totalPages?: number
  publishDate?: string
  fileType?: string
  fileSize?: number
  chunks?: ChunkItem[]
}

// ========== 切片 ==========
export interface ChunkItem {
  chunkIndex: number
  startPage: number
  endPage: number
  content: string
}

// ========== 分页响应 ==========
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  size: number
  totalPages: number
}

// ========== 统计信息 ==========
export interface StatsResponse {
  textbookCount: number
  chunkCount: number
  totalPages: number
  searchCount: number
}

// ========== 切片列表结果 ==========
export interface ChunkListResult {
  chunkId: string
  textbookId: string
  textbookTitle: string
  chunkIndex: number
  startPage: number
  endPage: number
  content: string
  hasMore?: boolean
}

// ========== 搜索请求/结果 ==========
export interface SearchRequest {
  query: string
  topK?: number
  textbookId?: string
  minScore?: number
}

export interface SearchResult {
  chunkId: string
  textbookId: string
  textbookTitle: string
  chunkIndex: number
  startPage: number
  endPage: number
  content: string
  score: number
}