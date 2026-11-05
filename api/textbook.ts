// api/textbook.ts - 教材管理 API 模块（xs-book，端口 8083）
import { request } from '@/api/request'

const DATA_API_BASE = 'http://localhost:8083'

// ==================== 类型定义 ====================

/** 教材信息 */
export interface TextbookInfo {
  id: string
  title: string
  isbn: string
  author: string
  category: string
  totalPages: number
  publishDate: string
  fileType: string
  fileSize: number
  classId?: number | null
  /** 多对多：教材可同时绑定多个教学班 */
  classIds?: number[]
  classNames?: string[]
  className?: string
  createTime: string
  updateTime: string
}

/** 教材统计 */
export interface TextbookStats {
  textbookCount: number
  chunkCount: number
  totalPages: number
  searchCount: number
}

/** 教材上传/删除进度 */
export interface TaskProgress {
  taskId: string
  type: string          // upload / delete
  textbookId: string
  title: string
  totalSteps: number     // 总步骤数（页数 = 切片数）
  completedSteps: number // 已完成步骤数
  currentStep: string    // 当前步骤描述
  status: string         // processing / completed / failed
  error: string
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

/** 分页查询教材 */
export function getTextbookPage(params: {
  keyword?: string
  category?: string
  classId?: number
  page?: number
  size?: number
  sort?: string
  order?: string
}): Promise<PageResult<TextbookInfo>> {
  return request<PageResult<TextbookInfo>>({
    url: '/api/textbooks',
    method: 'GET',
    data: params as unknown as Record<string, unknown>,
    baseURL: DATA_API_BASE
  })
}

/** 删除教材（异步，返回 taskId） */
export function deleteTextbook(id: string): Promise<{ taskId: string; textbookId: string; title: string }> {
  return request<{ taskId: string; textbookId: string; title: string }>({
    url: `/api/textbooks/${id}`,
    method: 'DELETE',
    baseURL: DATA_API_BASE
  })
}

/** 上传PDF创建教材（返回包含 taskId 和 textbook 信息） */
export function uploadTextbook(
  filePath: string,
  title?: string,
  category?: string,
  author?: string,
  h5File?: File,
  classId?: number,
  className?: string
): Promise<{ textbook: TextbookInfo; taskId: string }> {
  // #ifdef H5
  if (h5File) {
    return uploadViaFormData(h5File, title, category, author, classId, className)
  }
  // #endif
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: DATA_API_BASE + '/api/textbooks/upload',
      filePath: filePath,
      name: 'file',
      formData: {
        title: title || '',
        category: category || '',
        author: author || '',
        classId: classId != null ? String(classId) : '',
        className: className || ''
      },
      header: {
        'Authorization': uni.getStorageSync('token') || ''
      },
      success: (res) => {
        try {
          const body = JSON.parse(res.data)
          if (body.code === 200) {
            resolve(body.data)
          } else {
            uni.showToast({ title: body.message || '上传失败', icon: 'none' })
            reject(new Error(body.message))
          }
        } catch {
          reject(new Error('解析响应失败'))
        }
      },
      fail: (err) => {
        uni.showToast({ title: '上传失败', icon: 'none' })
        reject(err)
      }
    })
  })
}

/** H5环境使用 FormData + XMLHttpRequest 上传 */
function uploadViaFormData(
  file: File,
  title?: string,
  category?: string,
  author?: string,
  classId?: number,
  className?: string
): Promise<{ textbook: TextbookInfo; taskId: string }> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title || '')
    formData.append('category', category || '')
    formData.append('author', author || '')
    if (classId != null) formData.append('classId', String(classId))
    formData.append('className', className || '')

    const xhr = new XMLHttpRequest()
    xhr.open('POST', DATA_API_BASE + '/api/textbooks/upload')
    const token = uni.getStorageSync('token')
    if (token) {
      xhr.setRequestHeader('Authorization', token)
    }
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText)
        if (body.code === 200) {
          resolve(body.data)
        } else {
          uni.showToast({ title: body.message || '上传失败', icon: 'none' })
          reject(new Error(body.message))
        }
      } catch {
        reject(new Error('解析响应失败'))
      }
    }
    xhr.onerror = () => {
      uni.showToast({ title: '上传失败', icon: 'none' })
      reject(new Error('网络异常'))
    }
    xhr.send(formData)
  })
}

/** 根据ID获取教材 */
export function getTextbookById(id: string): Promise<TextbookInfo> {
  return request<TextbookInfo>({
    url: `/api/textbooks/${id}`,
    method: 'GET',
    baseURL: DATA_API_BASE
  })
}

/** 根据名称搜索教材（返回第一个匹配） */
export async function searchTextbookByTitle(title: string): Promise<TextbookInfo | null> {
  const result = await getTextbookPage({ keyword: title, page: 1, size: 1 })
  if (result.list && result.list.length > 0) {
    return result.list[0]
  }
  return null
}

/** 获取教材统计 */
export function getTextbookStats(): Promise<TextbookStats> {
  return request<TextbookStats>({
    url: '/api/textbooks/stats',
    method: 'GET',
    baseURL: DATA_API_BASE
  })
}

/** 为教学班选择/解绑教材（教师端使用；classId 为 null 表示解绑，不会删除教材本身） */
export function bindTextbookClass(id: string, classId: number | null, className?: string): Promise<TextbookInfo> {
  return request<TextbookInfo>({
    url: `/api/textbooks/${id}/class`,
    method: 'PUT',
    data: { classId, className: classId == null ? '' : className || '' },
    baseURL: DATA_API_BASE
  })
}

/** 解除教材与某个教学班的绑定（多对多，其它班级保留） */
export function unbindTextbookClass(id: string, classId: number): Promise<TextbookInfo> {
  return request<TextbookInfo>({
    url: `/api/textbooks/${id}/classes/${classId}`,
    method: 'DELETE',
    baseURL: DATA_API_BASE
  })
}

/** 修改教材名称 */
export function updateTextbookTitle(id: string, title: string): Promise<TextbookInfo> {
  return request<TextbookInfo>({
    url: `/api/textbooks/${id}/title`,
    method: 'PUT',
    data: { title },
    baseURL: DATA_API_BASE
  })
}

/** 查询教材上传/删除进度 */
export function getTextbookProgress(taskId: string): Promise<TaskProgress> {
  return request<TaskProgress>({
    url: `/api/textbooks/progress/${taskId}`,
    method: 'GET',
    baseURL: DATA_API_BASE
  })
}