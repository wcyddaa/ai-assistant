import { request } from '../utils/request'

/** 通知 */
export interface Notification {
  id: number
  userId: number
  type: string
  title: string
  content: string
  isRead: boolean
  redirectUrl: string
  createTime: string
}

/** 获取通知列表 */
export function getNotifications(userId: number, pageNum: number, pageSize: number) {
  return request<{ records: Notification[], total: number, pageNum: number, pageSize: number }>({
    url: '/api/notification/list',
    method: 'GET',
    params: { userId, pageNum, pageSize },
    baseURL: 'http://localhost:8088',
  })
}

/** 获取未读数量 */
export function getUnreadCount(userId: number) {
  return request<{ count: number }>({
    url: '/api/notification/unread-count',
    method: 'GET',
    params: { userId },
    baseURL: 'http://localhost:8088',
  })
}

/** 标记已读 */
export function markRead(id: number) {
  return request<boolean>({
    url: `/api/notification/${id}/read`,
    method: 'PUT',
    baseURL: 'http://localhost:8088',
  })
}

/** 全部已读 */
export function markAllRead(userId: number) {
  return request<boolean>({
    url: '/api/notification/read-all',
    method: 'PUT',
    params: { userId },
    baseURL: 'http://localhost:8088',
  })
}