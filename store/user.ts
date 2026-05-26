// store/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 定义用户信息的 TypeScript 接口
interface UserInfo {
  id: string
  username: string
  phone?: string
  role: 'admin' | 'teacher' | 'student'
  avatar?: string
}

// 定义登录请求参数接口
interface LoginParams {
  username: string
  password: string
}

// 定义登录响应接口（服务器返回的数据）
interface LoginResponse {
  code: number
  data: {
    token: string
    userInfo: UserInfo
  }
  message: string
}

// 定义注册请求参数接口
interface RegisterParams {
  username: string
  phone: string
  password: string
  role: 'student' | 'teacher'
  code: string
}

export const useUserStore = defineStore('user', () => {
  // ========== State（状态）==========
  // 用户令牌
  const token = ref<string>('')
  // 用户信息
  const userInfo = ref<UserInfo | null>(null)

  // ========== Getters（计算属性）==========
  // 是否已登录
  const isLoggedIn = computed(() => !!token.value)
  
  // 用户角色
  const userRole = computed(() => userInfo.value?.role || null)
  
  // 用户名
  const userName = computed(() => userInfo.value?.username || '')
  
  // 用户头像
  const userAvatar = computed(() => userInfo.value?.avatar || '')

  // ========== Actions（方法）==========
  
  /**
   * 用户登录
   * @param params - 登录参数（用户名、密码）
   * @returns 返回用户信息
   */
  const login = async (params: LoginParams): Promise<UserInfo> => {
    try {
      // 发送登录请求到服务器
      // const res = await uni.request({
      //   url: 'https://your-api.com/login',  // 替换成你的实际接口地址
      //   method: 'POST',
      //   data: {
      //     username: params.username,
      //     password: params.password
      //   }
      // }) as unknown as LoginResponse
      const res = {
            code: 200,
            data: {
              token: 'mock_token_' + Date.now(),
              userInfo: {
                id: 'admin_001',
                username: params.username,
                phone: '13800138000',
                role: 'admin',
                avatar: ''
              }
            },
            message: '登录成功'
          } as unknown as LoginResponse
      // 检查响应状态
      if (res.code !== 200) {
        throw new Error(res.message || '登录失败')
      }
      
      // 解构服务器返回的数据
      const { token: newToken, userInfo: newUserInfo } = res.data
      
      // 保存到 state（内存）
      token.value = newToken
      userInfo.value = newUserInfo
      
      // 持久化到本地存储
      uni.setStorageSync('token', newToken)
      uni.setStorageSync('userInfo', newUserInfo)
      
      // 返回用户信息
      return newUserInfo
      
    } catch (error) {
      console.error('登录请求失败:', error)
      throw new Error('登录失败，请检查网络或账号密码')
    }
  }
  
  /**
   * 用户注册
   * @param params - 注册参数
   */
  const register = async (params: RegisterParams): Promise<void> => {
    try {
      const res = await uni.request({
        url: 'https://your-api.com/register',  // 替换成你的实际接口地址
        method: 'POST',
        data: params
      }) as unknown as LoginResponse
      
      if (res.code !== 200) {
        throw new Error(res.message || '注册失败')
      }
      
      uni.showToast({ title: '注册成功，请登录', icon: 'success' })
      
    } catch (error) {
      console.error('注册请求失败:', error)
      throw new Error('注册失败，请稍后重试')
    }
  }
  
  /**
   * 发送验证码
   * @param phone - 手机号
   */
  const sendCode = async (phone: string): Promise<void> => {
    try {
      const res = await uni.request({
        url: 'https://your-api.com/send-code',  // 替换成你的实际接口地址
        method: 'POST',
        data: { phone }
      }) as unknown as { code: number; message: string }
      
      if (res.code !== 200) {
        throw new Error(res.message || '发送失败')
      }
      
      uni.showToast({ title: '验证码已发送', icon: 'success' })
      
    } catch (error) {
      console.error('发送验证码失败:', error)
      throw new Error('发送失败，请稍后重试')
    }
  }
  
  /**
   * 初始化用户状态（从本地存储恢复登录状态）
   * 在 App.vue 的 onLaunch 中调用
   */
  const initUser = (): void => {
    const storedToken = uni.getStorageSync('token')
    const storedUserInfo = uni.getStorageSync('userInfo')
    
    if (storedToken && storedUserInfo) {
      token.value = storedToken
      userInfo.value = storedUserInfo
    }
  }
  
  /**
   * 更新用户信息
   * @param newInfo - 要更新的用户信息
   */
  const updateUserInfo = (newInfo: Partial<UserInfo>): void => {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, ...newInfo }
      uni.setStorageSync('userInfo', userInfo.value)
    }
  }
  
  /**
   * 退出登录
   */
  const logout = (): void => {
    // 清空 state
    token.value = ''
    userInfo.value = null
    
    // 清除本地存储
    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')
    
    // 跳转到登录页
    uni.reLaunch({ url: '/pages/login/index' })
  }

  // ========== 返回所有状态和方法 ==========
  return {
    // state
    token,
    userInfo,
    
    // getters
    isLoggedIn,
    userRole,
    userName,
    userAvatar,
    
    // actions
    login,
    register,
    sendCode,
    initUser,
    updateUserInfo,
    logout
  }
})