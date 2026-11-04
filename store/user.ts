// store/user.ts - 用户认证与角色管理
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { request } from '@/api/request'
import { sendHeartbeat, recordLogin } from '@/api/data'
import { getStudentClasses } from '@/api/class'

/** 心跳定时器ID */
let heartbeatTimer: ReturnType<typeof setInterval> | null = null
/** 上次拉取学生教学班的时间 */
let lastClassFetch = 0

/** 后端返回的用户信息 */
export interface UserInfo {
  userId: number
  username: string
  name: string
  number: string
  roleId: number
  roleName: string
}

/** 后端返回的登录响应 */
interface TokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  userInfo: UserInfo
}

/** 前端角色标识 */
export type RoleType = 'admin' | 'teacher' | 'student'

/** 角色ID → 前端角色标识映射 */
const ROLE_ID_MAP: Record<number, RoleType> = {
  1: 'admin',
  2: 'teacher',
  3: 'student'
}

/** 前端角色标识 → 角色ID映射 */
const ROLE_TYPE_MAP: Record<string, number> = {
  admin: 1,
  teacher: 2,
  student: 3
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string>('')
  const refreshToken = ref<string>('')
  const userInfo = ref<UserInfo | null>(null)
  /** 学生所属教学班ID（用于按班统计在线/登录） */
  const classIds = ref<number[]>([])

  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed<RoleType | null>(() => {
    if (!userInfo.value) return null
    return ROLE_ID_MAP[userInfo.value.roleId] || null
  })
  const userName = computed(() => userInfo.value?.username || '')
  /** 优先显示姓名，姓名不存在时使用账户名 */
  const displayName = computed(() => userInfo.value?.name || userInfo.value?.username || '')

  /**
   * 真实登录：调用 xs-auth 服务的 /auth/login 接口
   */
  async function login(username: string, password: string, role: RoleType): Promise<UserInfo> {
    const type = ROLE_TYPE_MAP[role]

    const res = await request<TokenResponse>({
      url: '/auth/login',
      method: 'POST',
      data: { username, password, type }
    })

    // 存储 token 和用户信息
    token.value = res.accessToken
    refreshToken.value = res.refreshToken
    userInfo.value = res.userInfo

    uni.setStorageSync('token', res.accessToken)
    uni.setStorageSync('refreshToken', res.refreshToken)
    uni.setStorageSync('userInfo', res.userInfo)

    // 记录今日登录（仅学生计入登录人数），同时带上学号所属教学班
    const name = res.userInfo.name || res.userInfo.username
    if (res.userInfo.roleId === 3) {
      await refreshClassIds()
    }
    recordLogin(res.userInfo.userId, name, res.userInfo.roleId, classIds.value).catch(() => { /* 忽略错误 */ })

    return res.userInfo
  }

  /** 拉取学生所属教学班（用于在线与登录的教学班维度统计） */
  async function refreshClassIds(force = false): Promise<void> {
    const user = userInfo.value
    if (!user || user.roleId !== 3) {
      classIds.value = []
      return
    }
    const now = Date.now()
    if (!force && lastClassFetch > 0 && now - lastClassFetch < 60000) return
    try {
      const classes = await getStudentClasses(user.userId)
      classIds.value = (classes || []).map((c) => c.id)
      lastClassFetch = Date.now()
    } catch {
      // 忽略错误，保持已有班级
    }
  }

  function initUser() {
    const storedToken = uni.getStorageSync('token')
    const storedRefreshToken = uni.getStorageSync('refreshToken')
    const storedUserInfo = uni.getStorageSync('userInfo')
    if (storedToken && storedUserInfo) {
      token.value = storedToken
      refreshToken.value = storedRefreshToken || ''
      userInfo.value = storedUserInfo
      // 已登录状态，启动心跳
      startHeartbeat()
    }
  }

  function logout() {
    // 停止心跳
    stopHeartbeat()

    // 调用服务端登出接口（不阻塞本地清理）
    const storedToken = uni.getStorageSync('token')
    if (storedToken) {
      request({
        url: '/auth/logout',
        method: 'POST'
      }).catch(() => { /* 忽略登出接口错误 */ })
    }

    token.value = ''
    refreshToken.value = ''
    userInfo.value = null
    classIds.value = []
    lastClassFetch = 0
    uni.removeStorageSync('token')
    uni.removeStorageSync('refreshToken')
    uni.removeStorageSync('userInfo')
    uni.reLaunch({ url: '/pages/login/index' })
  }

  /** 启动心跳（30秒间隔） */
  function startHeartbeat() {
    if (!userInfo.value) return
    const userId = userInfo.value.userId
    const roleId = userInfo.value.roleId
    const name = userInfo.value.name || userInfo.value.username

    // 立即发送第一次心跳（学生先同步所属教学班）
    refreshClassIds().finally(() => {
      sendHeartbeat(userId, name, roleId, classIds.value).catch(() => { /* 忽略错误 */ })
    })

    // 每30秒发送一次心跳
    if (heartbeatTimer) clearInterval(heartbeatTimer)
    heartbeatTimer = setInterval(() => {
      refreshClassIds().finally(() => {
        sendHeartbeat(userId, name, roleId, classIds.value).catch(() => { /* 忽略错误 */ })
      })
    }, 30000)
  }

  /** 停止心跳 */
  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  return { token, refreshToken, userInfo, classIds, isLoggedIn, userRole, userName, displayName, login, initUser, logout, startHeartbeat, stopHeartbeat, refreshClassIds }
})