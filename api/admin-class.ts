// api/admin-class.ts - 行政班 API 模块
import { request } from '@/api/request'

const USER_API_BASE = 'http://localhost:8080'

/** 行政班信息 */
export interface AdminClassInfo {
  id: number
  name: string
}

/** 获取所有行政班 */
export function getAdminClasses(): Promise<AdminClassInfo[]> {
  return request<AdminClassInfo[]>({
    url: '/api/admin-classes',
    method: 'GET',
    baseURL: USER_API_BASE
  })
}