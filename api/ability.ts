// api/ability.ts - 教学班能力图谱 API（xs-learning，端口 8087）
import { request } from '@/api/request'

const LEARNING_API_BASE = 'http://localhost:8087'

export interface AbilityDimension {
  id: number
  classId: number
  chapterId?: number | null
  dimensionName: string
  dimensionCode: string
  weight: number
  description?: string
  sortOrder?: number
}

export interface DimensionScore {
  dimensionId: number
  dimensionName: string
  dimensionCode: string
  weight: number
  description?: string
  sortOrder?: number
  score: number
  comment?: string
  evidenceCount: number
}

export interface AbilityReport {
  overallScore: number
  summary: string
  source: string
  evaluatedAt?: string
  questionCount?: number
  homeworkCount?: number
  homeworkAvgScore?: number | null
}

export interface AbilityProfile {
  studentId: number
  classId: number
  studentName: string
  report: AbilityReport | null
  dimensions: DimensionScore[]
  questions: {
    count: number
    topTopics: Array<{ topic: string; count: number }>
  }
  homework: {
    count: number
    gradedCount: number
    submittedCount: number
    avgScore: number | null
    items: Array<{
      templateId: number
      title: string
      score: number | null
      status: string
      comment?: string
      submitTime?: string
    }>
  }
}

export interface DimensionPayload {
  id?: number
  classId: number
  dimensionName: string
  dimensionCode?: string
  weight?: number
  description?: string
  sortOrder?: number
  teacherId?: number
}

/** 学生详情画像（没有历史报告时由后端自动触发一次评估） */
export function getAbilityProfile(
  studentId: number,
  classId: number,
  autoEvaluate = true
): Promise<AbilityProfile> {
  return request<AbilityProfile>({
    url: `/api/ability/student/${studentId}/class/${classId}/profile`,
    method: 'GET',
    data: { autoEvaluate } as unknown as Record<string, unknown>,
    baseURL: LEARNING_API_BASE
  })
}

/** 手动重新评估 */
export function evaluateAbility(
  studentId: number,
  classId: number,
  studentName?: string
): Promise<AbilityProfile> {
  return request<AbilityProfile>({
    url: `/api/ability/student/${studentId}/class/${classId}/evaluate`,
    method: 'POST',
    data: { studentName: studentName || '' } as unknown as Record<string, unknown>,
    baseURL: LEARNING_API_BASE
  })
}

/** 教学班能力维度 */
export function getAbilityDimensions(classId: number): Promise<AbilityDimension[]> {
  return request<AbilityDimension[]>({
    url: `/api/ability/dimensions/${classId}`,
    method: 'GET',
    baseURL: LEARNING_API_BASE
  })
}

export function createAbilityDimension(data: DimensionPayload): Promise<AbilityDimension> {
  return request<AbilityDimension>({
    url: '/api/ability/dimensions',
    method: 'POST',
    data: data as unknown as Record<string, unknown>,
    baseURL: LEARNING_API_BASE
  })
}

export function updateAbilityDimension(
  id: number,
  data: DimensionPayload
): Promise<AbilityDimension> {
  return request<AbilityDimension>({
    url: `/api/ability/dimensions/${id}`,
    method: 'PUT',
    data: data as unknown as Record<string, unknown>,
    baseURL: LEARNING_API_BASE
  })
}

export function deleteAbilityDimension(id: number): Promise<null> {
  return request<null>({
    url: `/api/ability/dimensions/${id}`,
    method: 'DELETE',
    baseURL: LEARNING_API_BASE
  })
}

/** 教师推荐维度（首次配置时一键生成） */
export const RECOMMENDED_DIMENSIONS: Array<{
  name: string
  code: string
  weight: number
  description: string
}> = [
  { name: '概念理解', code: 'concept', weight: 1.2, description: '对核心概念、定义与原理的理解准确度' },
  { name: '知识应用', code: 'application', weight: 1.2, description: '能否将课堂知识用于解决具体问题' },
  { name: '分析推理', code: 'analysis', weight: 1, description: '面对复杂问题时的拆解与推理能力' },
  { name: '表达规范', code: 'expression', weight: 0.8, description: '作业与回答的条理性、规范性与完整性' },
  { name: '探究意识', code: 'inquiry', weight: 0.8, description: '主动提问、追根究底与拓展学习的表现' },
  { name: '学习投入', code: 'engagement', weight: 1, description: '作业完成度与课堂互动的持续投入程度' }
]
