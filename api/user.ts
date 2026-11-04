// api/user.ts - 用户服务 API 模块（xs-user，端口 8080）
import { request } from '@/api/request'

/** xs-user 服务地址 */
const USER_API_BASE = 'http://localhost:8080'

// ==================== 类型定义 ====================

/** 后端用户实体 */
export interface User {
  id: number
  username: string
  name: string
  password?: string
  number: string
  type: number    // 1-管理员, 2-老师, 3-学生
  status: number  // 0-禁用, 1-正常
  createrId: number
  updaterId: number
  createTime: string
  updateTime: string
}

/** 分页结果（与后端 PageResult 匹配） */
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  size: number
  totalPages: number
}

/** 用户分页查询参数 */
export interface UserPageQuery {
  pageNum?: number
  pageSize?: number
  keyword?: string
  type?: number
  status?: number
}

// ==================== API 函数 ====================

/**
 * 条件分页查询用户
 */
export function getUserPage(params: UserPageQuery): Promise<PageResult<User>> {
  return request<PageResult<User>>({
    url: '/users/page',
    method: 'GET',
    data: params as unknown as Record<string, unknown>,
    baseURL: USER_API_BASE
  })
}

/**
 * 根据ID查询用户
 */
export function getUserById(id: number): Promise<User> {
  return request<User>({
    url: `/users/${id}`,
    baseURL: USER_API_BASE
  })
}

/**
 * 根据用户名查询用户
 */
export function getUserByUsername(username: string): Promise<User> {
  return request<User>({
    url: `/users/username/${username}`,
    baseURL: USER_API_BASE
  })
}

/**
 * 添加用户
 */
export function addUser(user: Partial<User>): Promise<User> {
  return request<User>({
    url: '/users',
    method: 'POST',
    data: user as unknown as Record<string, unknown>,
    baseURL: USER_API_BASE
  })
}

/**
 * 更新用户
 */
export function updateUser(user: Partial<User>): Promise<null> {
  return request<null>({
    url: '/users',
    method: 'PUT',
    data: user as unknown as Record<string, unknown>,
    baseURL: USER_API_BASE
  })
}

/**
 * 删除用户
 */
export function deleteUser(id: number): Promise<null> {
  return request<null>({
    url: `/users/${id}`,
    method: 'DELETE',
    baseURL: USER_API_BASE
  })
}

/**
 * 批量导入用户
 */
export function batchImportUsers(users: Partial<User>[]): Promise<number> {
  return request<number>({
    url: '/users/batch-import',
    method: 'POST',
    data: users as unknown as Record<string, unknown>,
    baseURL: USER_API_BASE
  })
}

/**
 * 启用用户
 */
export function enableUser(userId: number): Promise<null> {
  return request<null>({
    url: `/users/enable/${userId}`,
    method: 'PUT',
    baseURL: USER_API_BASE
  })
}

/**
 * 禁用用户
 */
export function disableUser(userId: number): Promise<null> {
  return request<null>({
    url: `/users/disable/${userId}`,
    method: 'PUT',
    baseURL: USER_API_BASE
  })
}

// ==================== 统计 API ====================

/** 用户统计 */
export interface UserStats {
  studentCount: number
  teacherCount: number
  adminCount: number
}

/** 获取用户统计数据 */
export function getUserStats(): Promise<UserStats> {
  return request<UserStats>({
    url: '/users/stats',
    method: 'GET',
    baseURL: USER_API_BASE
  })
}

// ==================== 学生专用 API ====================

/**
 * 分页查询学生
 */
export function getStudentPage(params: UserPageQuery): Promise<PageResult<User>> {
  return request<PageResult<User>>({
    url: '/students/page',
    method: 'GET',
    data: params as unknown as Record<string, unknown>,
    baseURL: USER_API_BASE
  })
}

/**
 * 学生注册
 */
export function registerStudent(user: Partial<User>): Promise<null> {
  return request<null>({
    url: '/students/register',
    method: 'POST',
    data: user as unknown as Record<string, unknown>,
    baseURL: USER_API_BASE
  })
}

/**
 * 修改学生密码
 */
export function updateStudentPassword(id: number, password: string): Promise<null> {
  return request<null>({
    url: `/students/${id}/password`,
    method: 'PUT',
    data: { password } as unknown as Record<string, unknown>,
    baseURL: USER_API_BASE
  })
}