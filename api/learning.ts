// api/learning.ts - 学习服务 API（xs-learning，端口 8085）
import { request } from '@/api/request'

const LEARNING_API_BASE = 'http://localhost:8087'

/** 学生提问统计 */
export interface StudentQuestionStats {
  studentId: number
  studentName: string
  questionCount: number
  topTopics: string
}

/** 教学班提问统计 */
export interface ClassQuestionStats {
  classId: number
  totalQuestions: number
  studentCount: number
  topTopics: string
}

/** 提问倾向 */
export interface QuestionTendency {
  topic: string
  count: number
}

/** 获取教学班提问统计 */
export function getClassQuestionStats(classId: number): Promise<ClassQuestionStats> {
  return request<ClassQuestionStats>({
    url: `/api/question-log/class/${classId}/stats`,
    method: 'GET',
    baseURL: LEARNING_API_BASE
  })
}

/** 获取教学班学生提问次数统计 */
export function getStudentQuestionStats(classId: number): Promise<StudentQuestionStats[]> {
  return request<StudentQuestionStats[]>({
    url: `/api/question-log/class/${classId}/students`,
    method: 'GET',
    baseURL: LEARNING_API_BASE
  })
}

/** 获取教学班提问倾向 */
export function getQuestionTendencies(classId: number): Promise<QuestionTendency[]> {
  return request<QuestionTendency[]>({
    url: `/api/question-log/class/${classId}/tendencies`,
    method: 'GET',
    baseURL: LEARNING_API_BASE
  })
}