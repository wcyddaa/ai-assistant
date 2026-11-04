// api/courseware.ts - 课件管理 API 模块（xs-book，端口 8083）
import { request } from '@/api/request'

const BOOK_API_BASE = 'http://localhost:8083'

// ==================== 类型定义 ====================

export interface CoursewareInfo {
  id: string
  courseId: number
  courseName: string
  chapterId?: number | null
  title: string
  fileType: string
  fileSize: number
  totalPages: number
  processStatus: string
  createrId: number
  createrName: string
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

// ==================== API 函数 ====================

/** 分页查询某课程（可选章节）的课件列表 */
export function getCoursewareList(params: {
  courseId: number
  chapterId?: number
  page?: number
  size?: number
}): Promise<PageResult<CoursewareInfo>> {
  return request<PageResult<CoursewareInfo>>({
    url: '/api/courseware',
    method: 'GET',
    data: params as unknown as Record<string, unknown>,
    baseURL: BOOK_API_BASE
  })
}

/** 上传课件（H5环境使用FormData） */
export function uploadCourseware(
  file: File,
  courseId: number,
  courseName: string,
  createrId: number,
  createrName: string,
  title?: string,
  chapterId?: number
): Promise<CoursewareInfo> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('courseId', String(courseId))
    formData.append('courseName', courseName)
    formData.append('createrId', String(createrId))
    formData.append('createrName', createrName)
    if (title) formData.append('title', title)
    if (chapterId != null) formData.append('chapterId', String(chapterId))

    const xhr = new XMLHttpRequest()
    xhr.open('POST', BOOK_API_BASE + '/api/courseware/upload')
    xhr.setRequestHeader('Authorization', uni.getStorageSync('token') || '')
    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText)
        if (res.code === 200) {
          resolve(res.data)
        } else {
          uni.hideLoading()
          uni.showToast({ title: res.message || '上传失败', icon: 'none' })
          reject(new Error(res.message || '上传失败'))
        }
      } catch {
        uni.hideLoading()
        reject(new Error('解析响应失败'))
      }
    }
    xhr.onerror = () => {
      uni.hideLoading()
      uni.showToast({ title: '网络错误', icon: 'none' })
      reject(new Error('网络错误'))
    }
    xhr.send(formData)
  })
}

export interface CoursewareFromTextbookParams {
  textbookId: string
  startPage: number
  endPage: number
  title?: string
  courseId: number
  courseName: string
  chapterId?: number
  createrId: number
  createrName: string
}

/** 从教材 PDF 截取指定页范围生成课件 */
export function createCoursewareFromTextbook(params: CoursewareFromTextbookParams): Promise<CoursewareInfo> {
  return request<CoursewareInfo>({
    url: '/api/courseware/from-textbook',
    method: 'POST',
    data: params as unknown as Record<string, unknown>,
    baseURL: BOOK_API_BASE
  })
}

/** 删除课件 */
export function deleteCourseware(id: string): Promise<null> {
  return request<null>({
    url: `/api/courseware/${id}`,
    method: 'DELETE',
    baseURL: BOOK_API_BASE
  })
}

/** 获取课件详情 */
export function getCoursewareDetail(id: string): Promise<CoursewareInfo> {
  return request<CoursewareInfo>({
    url: `/api/courseware/${id}`,
    method: 'GET',
    baseURL: BOOK_API_BASE
  })
}