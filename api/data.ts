// api/data.ts - 数据统计 API 模块（xs-data，端口 8085）
import { request } from '@/api/request'

const DATA_API_BASE = 'http://localhost:8085'

// ==================== 类型定义 ====================

/** 统计数据汇总（仅统计学生，不含教师） */
export interface DataStats {
  onlineCount: number
  todayLoginCount: number
  apiCallCount: number
}

/** 教师视角统计：仅包含其可见教学班的学生 */
export interface TeacherDataStats {
  classCount: number
  onlineCount: number
  todayLoginCount: number
  onlineStudents: string[]
}

// ==================== API 函数 ====================

/** 心跳上报（教师上报不会计入在线人数） */
export function sendHeartbeat(
  userId: number,
  userName: string,
  roleId?: number,
  classIds?: number[]
): Promise<null> {
  return request<null>({
    url: '/api/data/heartbeat',
    method: 'POST',
    data: { userId, userName, roleId, classIds } as unknown as Record<string, unknown>,
    baseURL: DATA_API_BASE
  })
}

/** 获取在线人数 */
export function getOnlineCount(): Promise<number> {
  return request<number>({
    url: '/api/data/online/count',
    method: 'GET',
    baseURL: DATA_API_BASE
  })
}

/** 记录今日登录（教师登录不计入人数） */
export function recordLogin(
  userId: number,
  userName: string,
  roleId?: number,
  classIds?: number[]
): Promise<null> {
  return request<null>({
    url: '/api/data/login/record',
    method: 'POST',
    data: { userId, userName, roleId, classIds } as unknown as Record<string, unknown>,
    baseURL: DATA_API_BASE
  })
}

/** 获取今日登录人数 */
export function getTodayLoginCount(): Promise<number> {
  return request<number>({
    url: '/api/data/login/today/count',
    method: 'GET',
    baseURL: DATA_API_BASE
  })
}

/** 获取统计数据汇总 */
export function getDataStats(): Promise<DataStats> {
  return request<DataStats>({
    url: '/api/data/stats',
    method: 'GET',
    baseURL: DATA_API_BASE
  })
}

/** 获取教师可见教学班的学生在线/登录统计 */
export function getTeacherDataStats(classIds: number[]): Promise<TeacherDataStats> {
  const query = classIds.length ? `?classIds=${classIds.join(',')}` : ''
  return request<TeacherDataStats>({
    url: `/api/data/teacher/stats${query}`,
    method: 'GET',
    baseURL: DATA_API_BASE
  })
}

/** 获取单个教学班的学生在线/登录统计 */
export function getClassDataStats(classId: number): Promise<TeacherDataStats> {
  return request<TeacherDataStats>({
    url: `/api/data/class/${classId}/stats`,
    method: 'GET',
    baseURL: DATA_API_BASE
  })
}
