<template>
  <view class="dashboard-container">
    <!-- 左侧导航栏 -->
    <view class="sidebar">
      <!-- 导航菜单 -->
      <view class="nav-menu">
        <view 
          v-for="item in menuItems" 
          :key="item.key"
          class="nav-item"
          :class="{ active: currentMenu === item.key }"
          @click="handleMenuClick(item.key)"
        >
          <text class="nav-text">{{ item.title }}</text>
        </view>
      </view>

      <!-- 底部退出按钮 -->
      <view class="logout-btn" @click="handleLogout">
        <text class="logout-text">退出登录</text>
      </view>
    </view>

    <!-- 右侧内容区域（使用路由出口） -->
    <view class="main-content">
      <!-- 只有仪表盘页面显示欢迎语 -->
      <view v-if="currentMenu === 'dashboard'" class="welcome-area">
        <text class="welcome-title">欢迎你，管理员</text>
        <text class="user-name">账号：{{ userName }}</text>
      </view>

      <!-- 路由页面容器 -->
      <view class="page-container">
        <component :is="currentComponent" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef, onMounted } from 'vue'
import { useUserStore } from '@/store/user'

// 导入页面组件
import AccountIndex from '../account/index.vue'
import KnowledgeIndex from '../knowledge/index.vue'
import AiAgentIndex from '../ai-agent/index.vue'

const userStore = useUserStore()

// 菜单项定义
const menuItems = [
  { key: 'dashboard', title: '仪表盘', component: null },
  { key: 'user', title: '用户管理', component: AccountIndex },
  { key: 'knowledge', title: '知识库管理', component: KnowledgeIndex },
  { key: 'agent', title: '智能体管理', component: AiAgentIndex }
]

// 当前选中的菜单
const currentMenu = ref('dashboard')

// 当前显示的组件
const currentComponent = shallowRef(null)

// 用户名
const userName = computed(() => userStore.userInfo?.username || '管理员')

// 菜单点击处理 - 路由跳转
const handleMenuClick = (key: string) => {
  currentMenu.value = key
  
  // 找到对应的组件
  const menuItem = menuItems.find(item => item.key === key)
  if (menuItem && menuItem.component) {
    currentComponent.value = menuItem.component
  } else {
    // 仪表盘清空组件
    currentComponent.value = null
  }
}

// 退出登录
const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
      }
    }
  })
}

// 页面加载时检查登录状态
onMounted(() => {
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/index' })
  }
})
</script>

<style lang="scss" scoped>
.dashboard-container {
  display: flex;
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
}

// 左侧导航栏
.sidebar {
  width: 200rpx;
  background: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 2rpx 0 10rpx rgba(0, 0, 0, 0.05);
  
  .nav-menu {
    flex: 1;
    padding: 40rpx 0;
    
    .nav-item {
      padding: 30rpx 40rpx;
      margin: 10rpx 0;
      transition: all 0.3s;
      cursor: pointer;
      
      .nav-text {
        font-size: 28rpx;
        color: #666;
      }
      
      &.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        
        .nav-text {
          color: #fff;
          font-weight: bold;
        }
      }
    }
  }
  
  .logout-btn {
    padding: 30rpx 40rpx;
    border-top: 1px solid #f0f0f0;
    cursor: pointer;
    
    .logout-text {
      font-size: 28rpx;
      color: #ff6b6b;
    }
  }
}

// 右侧内容区域
.main-content {
  flex: 1;
  padding: 40rpx;
  
  .welcome-area {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20rpx;
    padding: 40rpx;
    margin-bottom: 40rpx;
    
    .welcome-title {
      display: block;
      font-size: 40rpx;
      font-weight: bold;
      color: #fff;
      margin-bottom: 20rpx;
    }
    
    .user-name {
      display: block;
      font-size: 28rpx;
      color: rgba(255, 255, 255, 0.9);
    }
  }
  
  .page-container {
    background: #fff;
    border-radius: 20rpx;
    min-height: 500rpx;
  }
}
</style>