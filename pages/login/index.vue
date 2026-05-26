<template>
  <view class="login-container">
    <view class="header">
      <text class="title">智慧教学平台</text>
      <text class="subtitle">AI赋能教育，智慧引领未来</text>
    </view>

    <view class="form-container">
      <view class="input-group">
        <input 
          v-model="loginForm.username" 
          type="text" 
          placeholder="请输入账号/手机号"
        />
      </view>

      <view class="input-group password-group">
        <input 
          v-model="loginForm.password" 
          :type="showPassword ? 'text' : 'password'"
          placeholder="请输入密码"
        />
        <text class="toggle-pwd" @click="showPassword = !showPassword">
          {{ showPassword ? '隐藏' : '显示' }}
        </text>
      </view>

      <view class="options">
        <label class="remember">
          <checkbox value="remember" :checked="rememberMe" @click="rememberMe = !rememberMe" />
          <text>记住密码</text>
        </label>
        <text class="forgot" @click="handleForgotPwd">忘记密码？</text>
      </view>

      <button class="login-btn" @click="handleLogin" :disabled="loginLoading">
        {{ loginLoading ? '登录中...' : '登 录' }}
      </button>
    </view>
  </view>
</template>

<!-- pages/login/index.vue -->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/store/user'

// 获取 store 实例
const userStore = useUserStore()

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: ''
})

const showPassword = ref(false)
const rememberMe = ref(false)
const loginLoading = ref(false)

// 验证登录表单
const validateLogin = (): boolean => {
  if (!loginForm.username) {
    uni.showToast({ title: '请输入账号', icon: 'none' })
    return false
  }
  if (!loginForm.password) {
    uni.showToast({ title: '请输入密码', icon: 'none' })
    return false
  }
  if (loginForm.password.length < 6) {
    uni.showToast({ title: '密码长度不能少于6位', icon: 'none' })
    return false
  }
  return true
}

// 处理登录
const handleLogin = async (): Promise<void> => {
  if (!validateLogin()) return
  
  loginLoading.value = true
  
  try {
    // 调用 store 的登录方法，等待服务器返回用户信息
    const userInfo = await userStore.login({
      username: loginForm.username,
      password: loginForm.password
    })
    
    // 处理记住密码
    if (rememberMe.value) {
      uni.setStorageSync('rememberUser', loginForm.username)
    } else {
      uni.removeStorageSync('rememberUser')
    }
    
    uni.showToast({ title: '登录成功', icon: 'success' })
    
    // 根据服务器返回的角色跳转不同页面
    const roleRoutes = {
      admin: '/pages/admin/dashboard/index',
      teacher: '/pages/teacher/course/list',
      student: '/pages/student/course/select'
    }
    
    setTimeout(() => {
      uni.reLaunch({ url: roleRoutes[userInfo.role] })
    }, 1500)
    
  } catch (error) {
    console.error('登录失败:', error)
    uni.showToast({ 
      title: error instanceof Error ? error.message : '登录失败', 
      icon: 'error' 
    })
  } finally {
    loginLoading.value = false
  }
}

// 忘记密码
const handleForgotPwd = (): void => {
  uni.navigateTo({
    url: '/pages/forgot-password/index'
  })
}

// 页面加载时读取记住的账号
onMounted(() => {
  const rememberedUser = uni.getStorageSync('rememberUser')
  if (rememberedUser) {
    loginForm.username = rememberedUser
    rememberMe.value = true
  }
})
</script>

<style lang="scss">
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
}

.header {
  padding: 100rpx 40rpx 60rpx;
  text-align: center;
  
  .title {
    display: block;
    font-size: 56rpx;
    font-weight: bold;
    color: #fff;
    margin-bottom: 20rpx;
  }
  
  .subtitle {
    display: block;
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.8);
  }
}

.form-container {
  background: #fff;
  border-radius: 40rpx 40rpx 0 0;
  padding: 60rpx 40rpx;
  flex: 1;
}

.input-group {
  margin-bottom: 40rpx;
  border: 1px solid #e0e0e0;
  border-radius: 16rpx;
  background: #f8f9fa;
  
  input {
    width: 100%;
    height: 88rpx;
    padding: 0 30rpx;
    font-size: 28rpx;
    box-sizing: border-box;
  }
}

.password-group {
  position: relative;
  
  input {
    padding-right: 100rpx;
  }
  
  .toggle-pwd {
    position: absolute;
    right: 30rpx;
    top: 50%;
    transform: translateY(-50%);
    font-size: 24rpx;
    color: #667eea;
  }
}

.options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 60rpx;
  font-size: 26rpx;
  
  .remember {
    display: flex;
    align-items: center;
    
    checkbox {
      transform: scale(0.8);
      margin-right: 10rpx;
    }
    
    text {
      color: #666;
    }
  }
  
  .forgot {
    color: #667eea;
  }
}

.login-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 16rpx;
  font-size: 32rpx;
  
  &[disabled] {
    opacity: 0.7;
  }
}
</style>