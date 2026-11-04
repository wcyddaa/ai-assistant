<!-- pages/index/index.vue - 首页重定向 -->
<template>
  <view class="redirect-page">
    <view class="splash">
      <view class="splash-seal">星</view>
      <text class="splash-name">星枢平台</text>
      <text class="splash-sub">正在进入工作台…</text>
      <view class="splash-line"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

onMounted(() => {
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/index' })
    return
  }
  const roleMap: Record<string, string> = {
    admin: '/pages/admin/dashboard/index',
    teacher: '/pages/teacher/dashboard/index',
    student: '/pages/student/dashboard/index'
  }
  const target = roleMap[userStore.userRole || ''] || '/pages/login/index'
  uni.reLaunch({ url: target })
})
</script>

<style scoped>
.redirect-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: var(--paper);
}

.splash {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  animation: splashIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes splashIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.splash-seal {
  width: 54px;
  height: 54px;
  border-radius: 8px;
  background: var(--accent);
  color: #FFF6EC;
  font-family: var(--font-display);
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16px 30px -16px rgba(180, 83, 42, 0.9);
  margin-bottom: 6px;
}

.splash-name {
  font-family: var(--font-display);
  font-size: 20px;
  letter-spacing: 0.1em;
  color: var(--ink);
}

.splash-sub {
  font-size: 11px;
  letter-spacing: 0.16em;
  color: var(--muted);
}

.splash-line {
  width: 44px;
  height: 1px;
  background: var(--line-strong);
  margin-top: 10px;
}
</style>
