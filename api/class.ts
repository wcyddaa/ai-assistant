// api/class.ts - 教学班管理 API 模块（xs-course，端口 8082）
import { request } from '@/api/request'

const COURSE_API_BASE = 'http://localhost:8082'

// ==================== 类型定义 ====================

/** 教学班信息 */
export interface ClassInfo {
  id: number
  name: string
  description: string
  college: string
  teacherId: number | null
  teacherName: string
  /** 教学班创建者ID */
  createrId?: number | null
  /** 学生人数（后端统计） */
  studentCount?: number
  /** 全部教师姓名（后端拼接） */
  teacherNames?: string
  status: string
  createTime: string
  updateTime: string
}

/** 教学班-教师绑定 */
export interface ClassTeacher {
  id: number
  classId: number
  teacherId: number
  teacherName: string
  isOwner: number
  joinTime: string
}

/** 教学班学生信息 */
export interface ClassStudent {
  id: number
  classId: number
  studentId: number
  studentName: string
  studentAccount: string
  joinTime: string
}

/** 分页结果 */
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  size: number
  totalPages: number
}

// ==================== API 函数 ====================

/** 分页查询教学班 */
export function getClassPage(params: {
  pageNum?: number
  pageSize?: number
  keyword?: string
  status?: string
}): Promise<PageResult<ClassInfo>> {
  return request<PageResult<ClassInfo>>({
    url: '/api/classes',
    method: 'GET',
    data: params as unknown as Record<string, unknown>,
    baseURL: COURSE_API_BASE
  })
}

/** 获取教师可见的教学班列表（管理员分配 + 自己创建） */
export function getClassesByTeacher(teacherId: number, pageNum?: number, pageSize?: number): Promise<PageResult<ClassInfo>> {
  return request<PageResult<ClassInfo>>({
    url: `/api/classes/teacher/${teacherId}`,
    method: 'GET',
    data: { pageNum: pageNum ?? 1, pageSize: pageSize ?? 100 } as unknown as Record<string, unknown>,
    baseURL: COURSE_API_BASE
  })
}

/** 获取教师可见的教学班ID集合 */
export function getTeacherClassIds(teacherId: number): Promise<number[]> {
  return request<number[]>({
    url: `/api/classes/teacher/${teacherId}/class-ids`,
    method: 'GET',
    baseURL: COURSE_API_BASE
  })
}

/** 创建教学班 */
export function createClass(data: Partial<ClassInfo>): Promise<ClassInfo> {
  return request<ClassInfo>({
    url: '/api/classes',
    method: 'POST',
    data: data as unknown as Record<string, unknown>,
    baseURL: COURSE_API_BASE
  })
}

/** 更新教学班 */
export function updateClass(id: number, data: Partial<ClassInfo>): Promise<null> {
  return request<null>({
    url: `/api/classes/${id}`,
    method: 'PUT',
    data: data as unknown as Record<string, unknown>,
    baseURL: COURSE_API_BASE
  })
}

/** 删除教学班 */
export function deleteClass(id: number, role?: string, deleterId?: number): Promise<null> {
  const params: Record<string, string> = { role: role || 'admin' }
  if (deleterId) {
    params.deleterId = String(deleterId)
  }
  const query = new URLSearchParams(params).toString()
  return request<null>({
    url: `/api/classes/${id}?${query}`,
    method: 'DELETE',
    baseURL: COURSE_API_BASE
  })
}

/** 删除前预检查：返回教学班绑定的数据概览 */
export function preCheckDeleteClass(id: number): Promise<{
  exists: boolean
  className: string
  createrId: number | null
  hasTeacher: boolean
  teacherCount: number
  teacherNames: string
  studentCount: number
  courseCount: number
  canDelete: boolean
  blockers: string[]
}> {
  return request({
    url: `/api/classes/${id}/pre-check`,
    method: 'GET',
    baseURL: COURSE_API_BASE
  })
}

/** 审核通过教学班 */
export function approveClass(id: number): Promise<null> {
  return request<null>({
    url: `/api/classes/${id}/approve`,
    method: 'PUT',
    baseURL: COURSE_API_BASE
  })
}

// ==================== 教师绑定（多对多） ====================

/** 绑定教师到教学班（追加绑定） */
export function bindTeacher(classId: number, teacherId: number, teacherName: string): Promise<null> {
  return request<null>({
    url: `/api/classes/${classId}/teacher`,
    method: 'PUT',
    data: { teacherId, teacherName } as unknown as Record<string, unknown>,
    baseURL: COURSE_API_BASE
  })
}

/** 获取教学班绑定的教师列表 */
export function getClassTeachers(classId: number): Promise<ClassTeacher[]> {
  return request<ClassTeacher[]>({
    url: `/api/classes/${classId}/teachers`,
    method: 'GET',
    baseURL: COURSE_API_BASE
  })
}

/** 添加教师到教学班 */
export function addClassTeacher(classId: number, teacherId: number, teacherName: string): Promise<null> {
  return request<null>({
    url: `/api/classes/${classId}/teachers`,
    method: 'POST',
    data: { teacherId, teacherName } as unknown as Record<string, unknown>,
    baseURL: COURSE_API_BASE
  })
}

/** 从教学班移除指定教师 */
export function removeClassTeacher(classId: number, teacherId: number): Promise<null> {
  return request<null>({
    url: `/api/classes/${classId}/teachers/${teacherId}`,
    method: 'DELETE',
    baseURL: COURSE_API_BASE
  })
}

/** 解除教学班全部教师绑定 */
export function unbindTeacherFromClass(classId: number): Promise<null> {
  return request<null>({
    url: `/api/classes/${classId}/teacher`,
    method: 'DELETE',
    baseURL: COURSE_API_BASE
  })
}

// ==================== 统计 API ====================

/** 教学班统计 */
export interface ClassStats {
  classCount: number
}

/** 获取教学班统计数据 */
export function getClassStats(): Promise<ClassStats> {
  return request<ClassStats>({
    url: '/api/classes/stats',
    method: 'GET',
    baseURL: COURSE_API_BASE
  })
}

/** 教师教学班统计（教学班数 + 学生数） */
export function getTeacherClassStats(teacherId: number): Promise<Record<string, number>> {
  return request<Record<string, number>>({
    url: `/api/classes/teacher/${teacherId}/stats`,
    method: 'GET',
    baseURL: COURSE_API_BASE
  })
}

// ==================== 教学班学生管理 ====================

/** 获取教学班学生列表（含姓名） */
export function getClassStudents(classId: number): Promise<ClassStudent[]> {
  return request<ClassStudent[]>({
    url: `/api/classes/${classId}/students`,
    method: 'GET',
    baseURL: COURSE_API_BASE
  })
}

/** 学生自主选班（选上即绑定） */
export function enrollClass(classId: number, studentId: number, studentName: string): Promise<null> {
  return request<null>({
    url: `/api/classes/${classId}/enroll`,
    method: 'POST',
    data: { studentId, studentName } as unknown as Record<string, unknown>,
    baseURL: COURSE_API_BASE
  })
}

/** 添加学生到教学班（教师手动添加） */
export function addClassStudent(classId: number, studentId: number, studentName: string): Promise<null> {
  return request<null>({
    url: `/api/classes/${classId}/students`,
    method: 'POST',
    data: { studentId, studentName } as unknown as Record<string, unknown>,
    baseURL: COURSE_API_BASE
  })
}

/** 从教学班移除学生 */
export function removeClassStudent(classId: number, studentId: number): Promise<null> {
  return request<null>({
    url: `/api/classes/${classId}/students/${studentId}`,
    method: 'DELETE',
    baseURL: COURSE_API_BASE
  })
}

/** 获取学生所属的教学班列表 */
export function getStudentClasses(studentId: number): Promise<ClassInfo[]> {
  return request<ClassInfo[]>({
    url: `/api/classes/student/${studentId}`,
    method: 'GET',
    baseURL: COURSE_API_BASE
  })
}


