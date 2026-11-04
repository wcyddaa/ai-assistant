// api/homework.ts - 作业管理 API 模块（xs-exam，端口 8084）
import { request } from '@/api/request'

const EXAM_API_BASE = 'http://localhost:8084'
const FASTAPI_BASE = 'http://localhost:8000'

// ==================== 类型定义 ====================

export interface TemplateHomework {
  id: number
  courseId: number
  classId: number
  chapterId: number | null
  startPage: number | null
  endPage: number | null
  title: string
  description: string
  markdownContent: string
  attachments: string
  teacherId: number
  teacherName: string
  status: string
  totalStudents: number
  submittedCount: number
  gradedCount: number
  createTime: string
  updateTime: string
}

export interface StudentHomework {
  id: number
  templateId: number
  studentId: number
  studentName: string
  answer: string
  status: string
  score: number | null
  comment: string
  submitTime: string | null
  createTime: string
  updateTime: string
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  size: number
  totalPages: number
}

// ==================== 模板作业 API ====================

/** 创建/保存模板作业 */
export function createTemplate(data: Partial<TemplateHomework>): Promise<TemplateHomework> {
  return request<TemplateHomework>({
    url: '/api/homework/templates',
    method: 'POST',
    data: data as unknown as Record<string, unknown>,
    baseURL: EXAM_API_BASE
  })
}

/** 更新模板作业 */
export function updateTemplate(id: number, data: Partial<TemplateHomework>): Promise<null> {
  return request<null>({
    url: `/api/homework/templates/${id}`,
    method: 'PUT',
    data: data as unknown as Record<string, unknown>,
    baseURL: EXAM_API_BASE
  })
}

/** 发布模板作业 */
export function publishTemplate(id: number): Promise<null> {
  return request<null>({
    url: `/api/homework/templates/${id}/publish`,
    method: 'PUT',
    baseURL: EXAM_API_BASE
  })
}

/** 删除模板作业 */
export function deleteTemplate(id: number): Promise<null> {
  return request<null>({
    url: `/api/homework/templates/${id}`,
    method: 'DELETE',
    baseURL: EXAM_API_BASE
  })
}

/** 教师分页查询自己的模板作业 */
export function getTemplatesByTeacher(params: {
  pageNum?: number
  pageSize?: number
  teacherId: number
  classIds?: string
}): Promise<PageResult<TemplateHomework>> {
  return request<PageResult<TemplateHomework>>({
    url: '/api/homework/templates/teacher',
    method: 'GET',
    data: params as unknown as Record<string, unknown>,
    baseURL: EXAM_API_BASE
  })
}

/** 学生查询自己教学班的已发布模板作业 */
export function getTemplatesByStudent(params: {
  pageNum?: number
  pageSize?: number
  classIds: string
}): Promise<PageResult<TemplateHomework>> {
  return request<PageResult<TemplateHomework>>({
    url: '/api/homework/templates/student',
    method: 'GET',
    data: params as unknown as Record<string, unknown>,
    baseURL: EXAM_API_BASE
  })
}

/** 获取单个模板作业 */
export function getTemplate(id: number): Promise<TemplateHomework> {
  return request<TemplateHomework>({
    url: `/api/homework/templates/${id}`,
    method: 'GET',
    baseURL: EXAM_API_BASE
  })
}

// ==================== 学生实例作业 API ====================

/** 学生提交作业 */
export function submitHomework(data: {
  templateId: number
  studentId: number
  studentName: string
  answer: string
}): Promise<null> {
  return request<null>({
    url: '/api/homework/students/submit',
    method: 'POST',
    data: data as unknown as Record<string, unknown>,
    baseURL: EXAM_API_BASE
  })
}

/** 获取模板作业的所有学生提交 */
export function getSubmissions(templateId: number): Promise<StudentHomework[]> {
  return request<StudentHomework[]>({
    url: `/api/homework/templates/${templateId}/submissions`,
    method: 'GET',
    baseURL: EXAM_API_BASE
  })
}

/** 分页查询学生实例作业 */
export function getStudentHomeworks(params: {
  pageNum?: number
  pageSize?: number
  studentId?: number
  templateId?: number
}): Promise<PageResult<StudentHomework>> {
  return request<PageResult<StudentHomework>>({
    url: '/api/homework/students',
    method: 'GET',
    data: params as unknown as Record<string, unknown>,
    baseURL: EXAM_API_BASE
  })
}

/** 老师批改作业 */
export function gradeHomework(id: number, score: number | null, comment: string): Promise<null> {
  return request<null>({
    url: `/api/homework/students/${id}/grade`,
    method: 'PUT',
    data: { score, comment } as unknown as Record<string, unknown>,
    baseURL: EXAM_API_BASE
  })
}

/** AI生成作业内容（调用FastAPI作业生成接口），返回 { content, markdown } */
export function generateHomeworkAI(message: string, textbookId?: string | null, classId?: number | null): Promise<{ content: string; markdown: string }> {
  return new Promise((resolve, reject) => {
    const data: Record<string, unknown> = { message }
    if (textbookId) data.textbook_id = textbookId
    if (classId != null) data.class_id = classId
    uni.request({
      url: FASTAPI_BASE + '/api/homework/generate',
      method: 'POST',
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': uni.getStorageSync('token') || ''
      },
      success: (res) => {
        const body = res.data as { response?: string; markdown_content?: string; code?: number; message?: string }
        if (body.response) {
          resolve({
            content: body.response,
            markdown: body.markdown_content || body.response
          })
        } else {
          uni.showToast({ title: body.message || 'AI生成失败', icon: 'none' })
          reject(new Error(body.message || 'AI生成失败'))
        }
      },
      fail: (err) => {
        uni.showToast({ title: 'AI服务连接失败', icon: 'none' })
        reject(err)
      }
    })
  })
}