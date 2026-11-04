import type { ApiResponse } from '@/types/api'

// 开发环境 - xs-auth 认证服务
const BASE_URL = 'http://localhost:8081'

/** 是否正在刷新 token（防止并发刷新） */
let isRefreshing = false
/** 等待刷新完成的请求队列 */
let refreshQueue: Array<{
  resolve: (token: string) => void
  reject: (err: Error) => void
}> = []

/**
 * 尝试刷新 token
 * @returns 新的 accessToken，失败返回 null
 */
async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = uni.getStorageSync('refreshToken')
  if (!refreshToken) {
    return null
  }

  try {
    const res = await new Promise<{ accessToken: string; refreshToken: string }>(
      (resolve, reject) => {
        uni.request({
          url: BASE_URL + '/auth/refresh',
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'X-Refresh-Token': refreshToken
          },
          success: (response) => {
            const body = response.data as ApiResponse<{
              accessToken: string
              refreshToken: string
            }>
            if (response.statusCode === 200 && body.code === 200 && body.data) {
              resolve(body.data)
            } else {
              reject(new Error(body.message || '刷新失败'))
            }
          },
          fail: (err) => reject(err)
        })
      }
    )

    // 存储新的 token
    uni.setStorageSync('token', res.accessToken)
    uni.setStorageSync('refreshToken', res.refreshToken)
    return res.accessToken
  } catch {
    return null
  }
}

/**
 * 通用请求封装，自动携带 Authorization token
 * 支持 401 自动刷新 token 和 403 权限拦截
 */
export function request<T = unknown>(options: {
  url: string
  method?: 'GET' | 'POST' | 'DELETE' | 'PUT'
  data?: Record<string, unknown>
  header?: Record<string, string>
  /** 是否跳过 token 刷新（用于刷新接口本身） */
  skipRefresh?: boolean
  /** 自定义 baseURL，默认使用 xs-auth (8081) */
  baseURL?: string
}): Promise<T> {
  return new Promise((resolve, reject) => {
    const doRequest = (retryToken?: string) => {
      // 自动附加 token
      const token = retryToken || uni.getStorageSync('token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.header
      }
      if (token) {
        headers['Authorization'] = token
      }

      const baseURL = options.baseURL || BASE_URL
      uni.request({
        url: baseURL + options.url,
        method: options.method || 'GET',
        data: options.data ?? {},
        header: headers,
        success: (res) => {
          const body = (res.data || {}) as ApiResponse<T>

          // 401 - 未登录/token 过期，尝试刷新
          if (res.statusCode === 401 || body.code === 401) {
            if (options.skipRefresh) {
              // 跳过刷新（刷新接口本身失败）
              uni.removeStorageSync('token')
              uni.removeStorageSync('refreshToken')
              uni.removeStorageSync('userInfo')
              uni.reLaunch({ url: '/pages/login/index' })
              reject(new Error('登录已过期'))
              return
            }

            // 尝试刷新 token
            if (!isRefreshing) {
              isRefreshing = true
              tryRefreshToken()
                .then((newToken) => {
                  isRefreshing = false
                  if (newToken) {
                    // 刷新成功，重试当前请求
                    refreshQueue.forEach((q) => q.resolve(newToken))
                    refreshQueue = []
                    doRequest(newToken)
                  } else {
                    // 刷新失败，清空登录态
                    refreshQueue.forEach((q) =>
                      q.reject(new Error('登录已过期'))
                    )
                    refreshQueue = []
                    uni.removeStorageSync('token')
                    uni.removeStorageSync('refreshToken')
                    uni.removeStorageSync('userInfo')
                    uni.reLaunch({ url: '/pages/login/index' })
                    reject(new Error('登录已过期'))
                  }
                })
                .catch(() => {
                  isRefreshing = false
                  refreshQueue.forEach((q) =>
                    q.reject(new Error('登录已过期'))
                  )
                  refreshQueue = []
                  uni.removeStorageSync('token')
                  uni.removeStorageSync('refreshToken')
                  uni.removeStorageSync('userInfo')
                  uni.reLaunch({ url: '/pages/login/index' })
                  reject(new Error('登录已过期'))
                })
            } else {
              // 正在刷新中，加入队列等待
              refreshQueue.push({
                resolve: (newToken: string) => doRequest(newToken),
                reject
              })
            }
            return
          }

          // 403 - 无权限
          if (res.statusCode === 403 || body.code === 403) {
            uni.showToast({
              title: '无权限访问该资源',
              icon: 'none',
              duration: 2000
            })
            reject(new Error('无权限'))
            return
          }

          // 正常响应
          if (res.statusCode === 200 && body.code === 200) {
            resolve(body.data)
          } else {
            // 后端异常时 message 可能为空（如 500 页面/异常堆栈），必须给兜底文案，
            // 否则页面侧 showToast 会弹出没有文字的小黑框
            const fallback = res.statusCode >= 500 ? '服务异常，请稍后重试' : '请求失败'
            const message = (body.message || '').trim() || `${fallback}（${res.statusCode}）`
            uni.showToast({ title: message, icon: 'none' })
            reject(new Error(message))
          }
        },
        fail: (err) => {
          uni.showToast({ title: '网络异常', icon: 'none' })
          reject(err)
        }
      })
    }

    doRequest()
  })
}

export { BASE_URL }