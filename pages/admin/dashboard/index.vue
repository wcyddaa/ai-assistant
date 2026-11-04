<!-- pages/admin/dashboard/index.vue - 管理员首页 -->
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
            <text class="welcome-kicker">ADMIN DESK</text>
            <text class="welcome-greeting">欢迎你，{{ displayName }}</text>
            <text class="welcome-role">平台管理台</text>
          </view>
        </view>
        <view class="welcome-right">
          <text class="current-date">{{ currentDate }}</text>
          <text class="current-time">{{ currentTime }}</text>
        </view>
      </view>

      <!-- 数据统计区 -->
      <view class="panel stats-section">
        <view class="section-header">
          <text class="section-title">平台数据概览</text>
          <text class="section-sub">账号、组织与实时在线</text>
        </view>
        <view class="stats-band">
          <view class="stat-item">
            <text class="stat-value blue">{{ stats.studentCount }}</text>
            <text class="stat-label">学生总数</text>
          </view>
          <view class="stat-item">
            <text class="stat-value green">{{ stats.teacherCount }}</text>
            <text class="stat-label">教师总数</text>
          </view>
          <view class="stat-item">
            <text class="stat-value dark">{{ stats.adminCount }}</text>
            <text class="stat-label">管理员</text>
          </view>
          <view class="stat-item">
            <text class="stat-value orange">{{ stats.classCount }}</text>
            <text class="stat-label">教学班</text>
          </view>
          <view class="stat-item">
            <text class="stat-value teal">{{ stats.courseCount }}</text>
            <text class="stat-label">课程</text>
          </view>
          <view class="stat-item">
            <text class="stat-value indigo">{{ stats.textbookCount }}</text>
            <text class="stat-label">教材</text>
          </view>
          <view class="stat-item">
            <text class="stat-value info">{{ onlineCount }}</text>
            <text class="stat-label">在线人数</text>
          </view>
          <view class="stat-item">
            <text class="stat-value purple">{{ todayLoginCount }}</text>
            <text class="stat-label">今日登录</text>
          </view>
          <view class="stat-item">
            <text class="stat-value red">{{ apiCallCount }}</text>
            <text class="stat-label">API 调用</text>
          </view>
        </view>
      </view>

      <!-- 快捷入口 -->
      <view class="panel quick-section">
        <view class="section-header">
          <text class="section-title">管理入口</text>
          <text class="section-sub">按组织与资源维护平台</text>
        </view>
        <view class="quick-list">
          <view class="quick-item" @click="goPage('/pages/admin/student/index')">
            <text class="quick-index">01</text>
            <view class="quick-body">
              <text class="quick-label">学生管理</text>
              <text class="quick-sub">学生档案与教学班归属</text>
            </view>
            <text class="quick-arrow">→</text>
          </view>
          <view class="quick-item" @click="goPage('/pages/admin/account/index')">
            <text class="quick-index">02</text>
            <view class="quick-body">
              <text class="quick-label">账号管理</text>
              <text class="quick-sub">教师与管理员账号</text>
            </view>
            <text class="quick-arrow">→</text>
          </view>
          <view class="quick-item" @click="goPage('/pages/admin/class/index')">
            <text class="quick-index">03</text>
            <view class="quick-body">
              <text class="quick-label">教学班管理</text>
              <text class="quick-sub">分配教师、绑定课程</text>
            </view>
            <text class="quick-arrow">→</text>
          </view>
          <view class="quick-item" @click="goPage('/pages/admin/course/index')">
            <text class="quick-index">04</text>
            <view class="quick-body">
              <text class="quick-label">课程管理</text>
              <text class="quick-sub">课程与教材关联</text>
            </view>
            <text class="quick-arrow">→</text>
          </view>
          <view class="quick-item" @click="goPage('/pages/admin/textbook/index')">
            <text class="quick-index">05</text>
            <view class="quick-body">
              <text class="quick-label">教材管理</text>
              <text class="quick-sub">教材文件与元信息</text>
            </view>
            <text class="quick-arrow">→</text>
          </view>
        </view>
      </view>
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { onShow, onHide } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import AppLayout from '@/components/layout/AppLayout.vue'
import { getUserStats } from '@/api/user'
import { getClassStats } from '@/api/class'
import { getCourseStats } from '@/api/course'
import { getTextbookStats } from '@/api/textbook'
import { getDataStats } from '@/api/data'

const userStore = useUserStore()

const displayName = computed(() => {
  return userStore.userInfo?.name || userStore.userInfo?.username || '管理员'
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

interface DashboardStats {
  studentCount: number
  teacherCount: number
  adminCount: number
  classCount: number
  courseCount: number
  textbookCount: number
}

const stats = reactive<DashboardStats>({
  studentCount: 0,
  teacherCount: 0,
  adminCount: 0,
  classCount: 0,
  courseCount: 0,
  textbookCount: 0
})

const onlineCount = ref(0)
const todayLoginCount = ref(0)
const apiCallCount = ref(0)

const fetchStats = async () => {
  try {
    const [userStats, classStats, courseStats, textbookStats, dataRes] = await Promise.all([
      getUserStats(),
      getClassStats(),
      getCourseStats(),
      getTextbookStats(),
      getDataStats().catch(() => ({ onlineCount: 0, todayLoginCount: 0, apiCallCount: 0 }))
    ])
    stats.studentCount = userStats.studentCount
    stats.teacherCount = userStats.teacherCount
    stats.adminCount = userStats.adminCount
    stats.classCount = classStats.classCount
    stats.courseCount = courseStats.courseCount
    stats.textbookCount = textbookStats.textbookCount
    onlineCount.value = dataRes.onlineCount
    todayLoginCount.value = dataRes.todayLoginCount
    apiCallCount.value = dataRes.apiCallCount
  } catch (e) {
    console.error('获取统计数据失败:', e)
  }
}

function goPage(path: string) {
  uni.navigateTo({ url: path })
}

onShow(() => {
  updateTime()
  timeTimer = setInterval(updateTime, 1000)
  fetchStats()
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

/* ========== 数据统计 ========== */
.stats-band {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  row-gap: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 20px;
  border-right: 1px solid var(--line);
}

.stat-item:first-child {
  padding-left: 2px;
}

.stat-item:nth-child(5n) {
  border-right: none;
}

.stat-value {
  font-size: 30px;
  line-height: 1;
  color: var(--ink);
}

.stat-value.blue { color: #35597F; }
.stat-value.green { color: var(--success); }
.stat-value.dark { color: var(--ink); }
.stat-value.orange { color: var(--accent); }
.stat-value.teal { color: #456B62; }
.stat-value.indigo { color: #4B5B7E; }
.stat-value.info { color: #2F6A85; }
.stat-value.purple { color: #6B4B6E; }
.stat-value.red { color: var(--danger); }

.stat-label {
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 0.1em;
}

/* ========== 快捷入口 ========== */
.quick-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.quick-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
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
  gap: 3px;
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

@media (max-width: 900px) {
  .stats-band {
    grid-template-columns: repeat(3, 1fr);
  }
  .stat-item:nth-child(5n) {
    border-right: 1px solid var(--line);
  }
  .stat-item:nth-child(3n) {
    border-right: none;
  }
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
  .stats-band {
    grid-template-columns: repeat(2, 1fr);
  }
  .stat-item:nth-child(3n) {
    border-right: 1px solid var(--line);
  }
  .stat-item:nth-child(2n) {
    border-right: none;
  }
  .quick-list {
    grid-template-columns: 1fr;
  }
  .panel {
    padding: 20px 16px;
  }
}
</style>
