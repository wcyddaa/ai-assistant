<!-- pages/teacher/dashboard/index.vue - 教师首页 -->
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
            <text class="welcome-kicker">TEACHER DESK</text>
            <text class="welcome-greeting">欢迎你，{{ displayName }}</text>
            <text class="welcome-role">教师工作台</text>
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
          <text class="section-title">数据概览</text>
          <text class="section-sub">所负责教学班的实时状态</text>
        </view>
        <view class="stats-band">
          <view class="stat-item">
            <text class="stat-value primary">{{ stats.classCount }}</text>
            <text class="stat-label">教学班</text>
          </view>
          <view class="stat-item">
            <text class="stat-value success">{{ stats.studentCount }}</text>
            <text class="stat-label">学生</text>
          </view>
          <view class="stat-item">
            <text class="stat-value warning">{{ stats.publishedCount }}</text>
            <text class="stat-label">已发布作业</text>
          </view>
          <view class="stat-item">
            <text class="stat-value info">{{ onlineCount }}</text>
            <text class="stat-label">在线学生</text>
          </view>
          <view class="stat-item">
            <text class="stat-value purple">{{ todayLoginCount }}</text>
            <text class="stat-label">今日登录</text>
          </view>
        </view>
      </view>

      <!-- 学生登录情况 -->
      <view class="panel students-section">
        <view class="section-header">
          <text class="section-title">学生登录情况</text>
          <text class="section-sub">仅统计你所负责教学班的学生</text>
        </view>
        <view v-if="onlineStudentNames.length" class="student-chips">
          <view v-for="name in onlineStudentNames" :key="name" class="student-chip">
            <view class="online-dot"></view>
            <text>{{ name }}</text>
          </view>
        </view>
        <view v-else class="empty-tip">暂无学生在线</view>
      </view>

      <!-- 快捷入口 -->
      <view class="panel quick-section">
        <view class="section-header">
          <text class="section-title">快捷入口</text>
          <text class="section-sub">常用管理动作</text>
        </view>
        <view class="quick-list">
          <view class="quick-item" @click="goPage('/pages/teacher/class/index')">
            <text class="quick-index">01</text>
            <view class="quick-body">
              <text class="quick-label">我的教学班</text>
              <text class="quick-sub">创建教学班、绑定课程与学生</text>
            </view>
            <text class="quick-arrow">→</text>
          </view>
          <view class="quick-item" @click="goPage('/pages/teacher/course/index')">
            <text class="quick-index">02</text>
            <view class="quick-body">
              <text class="quick-label">我的课程</text>
              <text class="quick-sub">维护课程与教材资料</text>
            </view>
            <text class="quick-arrow">→</text>
          </view>
          <view class="quick-item" @click="goPage('/pages/teacher/chapter/list')">
            <text class="quick-index">03</text>
            <view class="quick-body">
              <text class="quick-label">章节管理</text>
              <text class="quick-sub">组织课件章节与教学内容</text>
            </view>
            <text class="quick-arrow">→</text>
          </view>
          <view class="quick-item" @click="goPage('/pages/teacher/homework/list')">
            <text class="quick-index">04</text>
            <view class="quick-body">
              <text class="quick-label">作业管理</text>
              <text class="quick-sub">生成、发布与批改作业</text>
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
import { request } from '@/api/request'
import { getTeacherClassIds } from '@/api/class'
import { getTeacherDataStats } from '@/api/data'

const COURSE_API_BASE = 'http://localhost:8082'
const EXAM_API_BASE = 'http://localhost:8084'

const userStore = useUserStore()

const displayName = computed(() => {
  return userStore.userInfo?.name || userStore.userInfo?.username || '教师'
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

interface TeacherStats {
  classCount: number
  studentCount: number
  publishedCount: number
}

const stats = reactive<TeacherStats>({
  classCount: 0,
  studentCount: 0,
  publishedCount: 0
})

const onlineCount = ref(0)
const todayLoginCount = ref(0)
const onlineStudents = ref<string[]>([])
const onlineStudentNames = computed(() => {
  return onlineStudents.value.map((item) => {
    const idx = item.indexOf(':')
    const name = idx >= 0 ? item.slice(idx + 1) : ''
    return name || `学生 ${item}`
  })
})

const fetchStats = async () => {
  const teacherId = userStore.userInfo?.userId
  if (!teacherId) return
  try {
    const [classRes, homeworkRes, classIds] = await Promise.all([
      request<{ classCount: number; studentCount: number }>({
        url: `/api/classes/teacher/${teacherId}/stats`,
        method: 'GET',
        baseURL: COURSE_API_BASE
      }),
      request<{ publishedCount: number }>({
        url: `/api/homework/templates/teacher/stats?teacherId=${teacherId}`,
        method: 'GET',
        baseURL: EXAM_API_BASE
      }),
      getTeacherClassIds(teacherId).catch(() => [] as number[])
    ])
    stats.classCount = classRes.classCount
    stats.studentCount = classRes.studentCount
    stats.publishedCount = homeworkRes.publishedCount

    // 在线/今日登录只统计教师可见教学班内的学生，教师本人不计入
    const dataRes = await getTeacherDataStats(classIds).catch(() => ({
      classCount: 0,
      onlineCount: 0,
      todayLoginCount: 0,
      onlineStudents: [] as string[]
    }))
    onlineCount.value = dataRes.onlineCount
    todayLoginCount.value = dataRes.todayLoginCount
    onlineStudents.value = dataRes.onlineStudents || []
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

/* ========== 通用面板 ========== */
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
  letter-spacing: 0.02em;
}

/* ========== 数据统计 ========== */
.stats-band {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
}

.stat-item {
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 22px;
  border-right: 1px solid var(--line);
}

.stat-item:first-child {
  padding-left: 2px;
}

.stat-item:last-child {
  border-right: none;
}

.stat-value {
  font-size: 32px;
  line-height: 1;
  color: var(--ink);
}

.stat-value.primary { color: var(--accent); }
.stat-value.success { color: var(--success); }
.stat-value.warning { color: var(--warning); }
.stat-value.info { color: var(--info); }
.stat-value.purple { color: #6B4B6E; }

.stat-label {
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 0.1em;
}

/* ========== 学生登录情况 ========== */
.student-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.student-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  background: #F7F2E8;
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: 12.5px;
  color: var(--ink-2);
}

.online-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 0 3px rgba(63, 107, 82, 0.14);
}

.empty-tip {
  padding: 26px 16px;
  text-align: center;
  font-size: 12px;
  color: var(--muted);
  background: #F7F3EA;
  border: 1px dashed var(--line-strong);
  border-radius: 10px;
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
  letter-spacing: 0.06em;
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

@media (max-width: 768px) {
  .welcome-section {
    flex-direction: column;
    align-items: flex-start;
    padding: 22px 20px;
  }
  .welcome-right {
    align-items: flex-start;
    flex-direction: row;
    gap: 10px;
    align-items: baseline;
  }
  .current-time {
    font-size: 22px;
  }
  .stats-band {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px 0;
  }
  .stat-item {
    padding: 2px 16px;
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
