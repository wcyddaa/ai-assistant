// api/course.ts - 课程管理 API 模块（xs-course，端口 8082）
import { request } from '@/api/request'

const COURSE_API_BASE = 'http://localhost:8082'

// ==================== 类型定义 ====================

/** 课程信息 */
export interface CourseInfo {
  id: number
  name: string
  description: string
  textbookId: string
  textbookTitle: string
  status: string
  createrId: number | null
  createTime: string
  updateTime: string
}

/** 课程-教学班关联 */
export interface CourseClass {
  id: number
  courseId: number
  classId: number
  className: string
}

/** 章节信息 */
export interface ChapterInfo {
  id: number
  courseId: number
  title: string
  description: string
  sortOrder: number
  startPage: number | null
  endPage: number | null
}

/** 分页结果 */
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  size: number
  totalPages: number
}

/** 知识图谱节点 */
export interface KnowledgeNode {
  id: number
  courseId: number
  nodeKey: string
  name: string
  category: 'chapter' | 'courseware' | 'question' | 'homework' | 'concept' | 'course' | string
  description: string
  chapterId: number | null
  weight: number
  source: string
}

/** 知识图谱关系 */
export interface KnowledgeEdge {
  id: number
  courseId: number
  sourceKey: string
  targetKey: string
  relation: string
  weight: number
}

/** 课程知识图谱 */
export interface KnowledgeGraph {
  courseId: number
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
  generatedAt: string | null
  empty: boolean
  source?: string
}

// ==================== API 函数 ====================

/** 分页查询课程 */
export function getCoursePage(params: {
  pageNum?: number
  pageSize?: number
  keyword?: string
}): Promise<PageResult<CourseInfo>> {
  return request<PageResult<CourseInfo>>({
    url: '/api/courses',
    method: 'GET',
    data: params as unknown as Record<string, unknown>,
    baseURL: COURSE_API_BASE
  })
}

/** 获取创建者的课程列表 */
export function getCoursesByCreator(creatorId: number, pageNum?: number, pageSize?: number): Promise<PageResult<CourseInfo>> {
  return request<PageResult<CourseInfo>>({
    url: `/api/courses/creator/${creatorId}`,
    method: 'GET',
    data: { pageNum: pageNum ?? 1, pageSize: pageSize ?? 100 } as unknown as Record<string, unknown>,
    baseURL: COURSE_API_BASE
  })
}

/** 创建课程 */
export function createCourse(data: Record<string, unknown>): Promise<CourseInfo> {
  return request<CourseInfo>({
    url: '/api/courses',
    method: 'POST',
    data: data,
    baseURL: COURSE_API_BASE
  })
}

/** 更新课程 */
export function updateCourse(id: number, data: Partial<CourseInfo>): Promise<null> {
  return request<null>({
    url: `/api/courses/${id}`,
    method: 'PUT',
    data: data as unknown as Record<string, unknown>,
    baseURL: COURSE_API_BASE
  })
}

/** 删除前预检查：返回课程绑定的数据概览 */
export function preCheckDeleteCourse(id: number): Promise<{
  exists: boolean
  courseName: string
  classCount: number
  hasTextbook: boolean
  textbookTitle: string
  chapterCount: number
  canDelete: boolean
  blockers: string[]
}> {
  return request({
    url: `/api/courses/${id}/pre-check`,
    method: 'GET',
    baseURL: COURSE_API_BASE
  })
}

/** 删除课程 */
export function deleteCourse(id: number): Promise<null> {
  return request<null>({
    url: `/api/courses/${id}`,
    method: 'DELETE',
    baseURL: COURSE_API_BASE
  })
}

/** 审核通过课程 */
export function approveCourse(id: number): Promise<null> {
  return request<null>({
    url: `/api/courses/${id}/approve`,
    method: 'PUT',
    baseURL: COURSE_API_BASE
  })
}

/** 获取课程知识图谱 */
export function getKnowledgeGraph(courseId: number): Promise<KnowledgeGraph> {
  return request<KnowledgeGraph>({
    url: `/api/courses/${courseId}/knowledge-graph`,
    method: 'GET',
    baseURL: COURSE_API_BASE
  })
}

/** 基于课件、学生提问与作业错误重新生成课程知识图谱 */
export function extractKnowledgeGraph(courseId: number): Promise<KnowledgeGraph> {
  return request<KnowledgeGraph>({
    url: `/api/courses/${courseId}/knowledge-graph/extract`,
    method: 'POST',
    data: {},
    baseURL: COURSE_API_BASE
  })
}

// ==================== 统计 API ====================

/** 课程统计 */
export interface CourseStats {
  courseCount: number
}

/** 获取课程统计数据 */
export function getCourseStats(): Promise<CourseStats> {
  return request<CourseStats>({
    url: '/api/courses/stats',
    method: 'GET',
    baseURL: COURSE_API_BASE
  })
}

/** 获取课程章节列表 */
export function getChapters(courseId: number): Promise<ChapterInfo[]> {
  return request<ChapterInfo[]>({
    url: `/api/courses/${courseId}/chapters`,
    method: 'GET',
    baseURL: COURSE_API_BASE
  })
}

/** 批量添加章节 */
export function addChapters(courseId: number, chapters: Partial<ChapterInfo>[]): Promise<null> {
  return request<null>({
    url: `/api/courses/${courseId}/chapters`,
    method: 'POST',
    data: chapters as unknown as Record<string, unknown>,
    baseURL: COURSE_API_BASE
  })
}

/** 更新章节 */
export function updateChapter(courseId: number, chapterId: number, data: Partial<ChapterInfo>): Promise<null> {
  return request<null>({
    url: `/api/courses/${courseId}/chapters/${chapterId}`,
    method: 'PUT',
    data: data as unknown as Record<string, unknown>,
    baseURL: COURSE_API_BASE
  })
}

/** 删除章节 */
export function deleteChapter(courseId: number, chapterId: number): Promise<null> {
  return request<null>({
    url: `/api/courses/${courseId}/chapters/${chapterId}`,
    method: 'DELETE',
    baseURL: COURSE_API_BASE
  })
}

/** 获取课程的教学班列表 */
export function getCourseClasses(courseId: number): Promise<CourseClass[]> {
  return request<CourseClass[]>({
    url: `/api/courses/${courseId}/classes`,
    method: 'GET',
    baseURL: COURSE_API_BASE
  })
}

/** 获取教学班关联的课程列表 */
export function getCoursesByClass(classId: number): Promise<CourseInfo[]> {
  return request<CourseInfo[]>({
    url: `/api/classes/${classId}/courses`,
    method: 'GET',
    baseURL: COURSE_API_BASE
  })
}

/** 绑定教学班到课程 */
export function addCourseClass(courseId: number, classId: number, className: string): Promise<null> {
  return request<null>({
    url: `/api/courses/${courseId}/classes`,
    method: 'POST',
    data: { classId, className } as unknown as Record<string, unknown>,
    baseURL: COURSE_API_BASE
  })
}

/** 移除课程教学班 */
export function removeCourseClass(courseId: number, classId: number): Promise<null> {
  return request<null>({
    url: `/api/courses/${courseId}/classes/${classId}`,
    method: 'DELETE',
    baseURL: COURSE_API_BASE
  })
}