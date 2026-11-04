<!-- pages/student/dashboard/index.vue - 学生首页 -->
<template>
  <AppLayout>
    <view class="dashboard">
      <!-- 欢迎区域 -->
      <view class="welcome-section">
        <view class="welcome-left">
          <view class="welcome-avatar">
            <text>{{ displayName.charAt(0) }}</text>
          </view>
          <view class="welcome-text">
            <text class="welcome-kicker">STUDENT DESK</text>
            <text class="welcome-greeting">欢迎你，{{ displayName }}</text>
            <text class="welcome-role">学生学习空间</text>
          </view>
        </view>
        <view class="welcome-right">
          <text class="current-date">{{ currentDate }}</text>
          <text class="current-time">{{ currentTime }}</text>
        </view>
      </view>

      <!-- 学习入口 -->
      <view class="panel quick-section">
        <view class="section-header">
          <text class="section-title">学习入口</text>
          <text class="section-sub">课程、作业与智能助教</text>
        </view>
        <view class="quick-list">
          <view class="quick-item" @click="goPage('/pages/student/course/index')">
            <text class="quick-index">01</text>
            <view class="quick-body">
              <text class="quick-label">我的课程</text>
              <text class="quick-sub">查看所选教学班的课程与教材</text>
            </view>
            <text class="quick-arrow">→</text>
          </view>
          <view class="quick-item" @click="goPage('/pages/student/homework/index')">
            <text class="quick-index">02</text>
            <view class="quick-body">
              <text class="quick-label">我的作业</text>
              <text class="quick-sub">查看任务、提交与批改结果</text>
            </view>
            <text class="quick-arrow">→</text>
          </view>
          <view class="quick-item" @click="goPage('/pages/student/chat/index')">
            <text class="quick-index">03</text>
            <view class="quick-body">
              <text class="quick-label">AI 助手</text>
              <text class="quick-sub">基于教学班课件与教材答疑</text>
            </view>
            <text class="quick-arrow">→</text>
          </view>
        </view>
      </view>

      <!-- 说明条 -->
      <view class="note-band">
        <text class="note-mark">“</text>
        <text class="note-text">课程、教材与智能体，都跟随你所在的教学班。</text>
      </view>
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow, onHide } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import AppLayout from '@/components/layout/AppLayout.vue'

const userStore = useUserStore()

const displayName = computed(() => {
  return userStore.userInfo?.name || userStore.userInfo?.username || '同学'
})

// 当前时间
const currentDate = ref('')
const currentTime = ref('')
let timeTimer: ReturnType<typeof setInterval> | null = null

function updateTime() {
  const now = new Date()
  const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  currentDate.value = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`
  currentTime.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
}

function goPage(path: string) {
  uni.navigateTo({ url: path })
}

onShow(() => {
  updateTime()
  timeTimer = setInterval(updateTime, 1000)
})

onHide(() => {
  if (timeTimer) {
    clearInterval(timeTimer)
    timeTimer = null
  }
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* ========== 欢迎区域 ========== */
.welcome-section {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 30px 32px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--line);
  background: var(--surface);
  background-image:
    radial-gradient(520px 200px at 0% 0%, rgba(180, 83, 42, 0.08), transparent 70%);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
}

.welcome-section::before {
  content: '';
  position: absolute;
  left: 0;
  top: 26px;
  bottom: 26px;
  width: 3px;
  background: var(--accent);
  border-radius: 0 3px 3px 0;
}

.welcome-left {
  display: flex;
  align-items: center;
  gap: 18px;
}

.welcome-avatar {
  width: 58px;
  height: 58px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--ink);
  color: #F8F3E8;
  font-family: var(--font-display);
  font-size: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 14px 26px -18px rgba(23, 35, 59, 0.9);
}

.welcome-text {
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: flex-start;
}

.welcome-kicker {
  font-size: 9px;
  letter-spacing: 0.28em;
  color: var(--accent);
}

.welcome-greeting {
  font-family: var(--font-display);
  font-size: 25px;
  line-height: 1.3;
  color: var(--ink);
}

.welcome-role {
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 0.1em;
  border-top: 1px solid var(--line);
  padding-top: 5px;
}

.welcome-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.current-date {
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.current-time {
  font-family: var(--font-display);
  font-size: 30px;
  letter-spacing: 0.04em;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

/* ========== 面板 ========== */
.panel {
  padding: 24px 26px;
  border-radius: var(--radius);
  border: 1px solid var(--line);
  background: var(--surface);
  box-shadow: var(--shadow-soft);
}

.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 18px;
}

.section-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--ink);
}

.section-sub {
  font-size: 11px;
  color: var(--muted);
}

/* ========== 学习入口 ========== */
.quick-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.quick-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #FDFBF6;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-item:hover {
  border-color: var(--line-strong);
  background: #FFFFFF;
  transform: translateY(-2px);
  box-shadow: var(--shadow-soft);
}

.quick-index {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--accent);
}

.quick-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.quick-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}

.quick-sub {
  font-size: 11px;
  color: var(--muted);
  line-height: 1.6;
}

.quick-arrow {
  font-size: 14px;
  color: var(--line-strong);
  transition: all 0.2s ease;
}

.quick-item:hover .quick-arrow {
  color: var(--accent);
  transform: translateX(3px);
}

/* ========== 说明条 ========== */
.note-band {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 20px 26px;
  border-radius: var(--radius);
  border: 1px dashed var(--line-strong);
  background: rgba(255, 253, 248, 0.6);
}

.note-mark {
  font-family: var(--font-display);
  font-size: 26px;
  line-height: 1;
  color: var(--accent);
}

.note-text {
  font-family: var(--font-display);
  font-size: 15px;
  color: var(--ink-2);
  letter-spacing: 0.02em;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .welcome-section {
    flex-direction: column;
    align-items: flex-start;
    padding: 22px 20px;
  }
  .welcome-right {
    flex-direction: row;
    gap: 10px;
    align-items: baseline;
  }
  .current-time {
    font-size: 22px;
  }
  .quick-list {
    grid-template-columns: 1fr;
  }
  .panel,
  .note-band {
    padding: 20px 16px;
  }
}
</style>
