<!-- pages/teacher/student/index.vue - 教师端我的学生 -->
<template>
  <AppLayout>
    <view class="page-container">
      <view class="page-header">
        <view class="header-text">
          <text class="page-kicker">STUDENT ROSTER</text>
          <text class="page-title">我的学生</text>
          <text class="page-sub">按教学班归档的名册与提问记录</text>
        </view>
        <text class="header-meta">ROSTER</text>
      </view>

      <view v-for="cls in classStudents" :key="cls.classId" class="class-section">
        <view class="class-header">
          <text class="class-name">{{ cls.className }}</text>
          <text class="class-count">{{ cls.students.length }}人</text>
          <text v-if="cls.questionStats" class="class-questions">
            提问{{ cls.questionStats.totalQuestions }}次
          </text>
        </view>

        <view class="student-table">
          <view class="table-header">
            <text class="th th-id">学生ID</text>
            <text class="th th-name">姓名</text>
            <text class="th th-account">学号</text>
            <text class="th th-questions">提问次数</text>
            <text class="th th-action">操作</text>
          </view>
          <view v-for="s in cls.students" :key="s.studentId" class="table-row">
            <text class="td th-id">{{ s.studentId }}</text>
            <text class="td th-name">{{ s.studentName }}</text>
            <text class="td th-account">{{ s.studentAccount || '-' }}</text>
            <text class="td th-questions">{{ s.questionCount ?? '-' }}</text>
            <view class="td th-action">
              <text class="link-detail" @click="openStudentDetail(cls.classId, cls.className, s)">查看详情</text>
            </view>
          </view>
          <view v-if="cls.students.length === 0" class="empty-row">
            <text class="empty-text">暂无学生</text>
          </view>
        </view>
      </view>

      <view v-if="classStudents.length === 0 && !loading" class="empty-state">
        <text class="empty-text">暂未绑定教学班</text>
      </view>
    </view>

    <!-- 学生详情：学习情况 + 教学班能力图谱 -->
    <StudentDetailModal
      :visible="detailVisible"
      :class-id="detailClassId"
      :class-name="detailClassName"
      :student="detailStudent"
      :teacher-id="teacherId"
      @close="closeDetail"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AppLayout from '@/components/layout/AppLayout.vue'
import StudentDetailModal from '@/components/teacher/StudentDetailModal.vue'
import { useUserStore } from '@/store/user'
import { getClassesByTeacher, getClassStudents, type ClassStudent } from '@/api/class'
import { getStudentQuestionStats, type StudentQuestionStats } from '@/api/learning'

interface StudentWithCourses extends ClassStudent {
  questionCount?: number
  topTopics?: string
}

interface ClassWithStudents {
  classId: number
  className: string
  students: StudentWithCourses[]
  questionStats?: { totalQuestions: number }
}

const userStore = useUserStore()
const classStudents = ref<ClassWithStudents[]>([])
const loading = ref(false)

const teacherId = computed(() => Number(userStore.userInfo?.userId) || 0)

// 学生详情
const detailVisible = ref(false)
const detailClassId = ref(0)
const detailClassName = ref('')
const detailStudent = ref<StudentWithCourses | null>(null)

async function fetchData() {
  loading.value = true
  try {
    const userId = userStore.userInfo?.userId
    if (!userId) {
      classStudents.value = []
      return
    }
    const classes = await getClassesByTeacher(userId)
    const result: ClassWithStudents[] = []

    for (const c of classes.list) {
      try {
        const students = await getClassStudents(c.id)

        // 获取提问统计
        let questionStatsMap: Map<number, StudentQuestionStats> = new Map()
        try {
          const stats = await getStudentQuestionStats(c.id)
          for (const s of stats) {
            questionStatsMap.set(s.studentId, s)
          }
        } catch { /* ignore */ }

        const enriched: StudentWithCourses[] = students.map(s => {
          const stats = questionStatsMap.get(s.studentId)
          return {
            ...s,
            questionCount: stats?.questionCount ?? 0,
            topTopics: stats?.topTopics
          }
        })

        let totalQuestions = 0
        try {
          // 汇总提问次数
          const stats = await getStudentQuestionStats(c.id)
          totalQuestions = stats.reduce((sum, s) => sum + s.questionCount, 0)
        } catch { /* ignore */ }

        result.push({
          classId: c.id,
          className: c.name,
          students: enriched,
          questionStats: { totalQuestions }
        })
      } catch {
        result.push({ classId: c.id, className: c.name, students: [] })
      }
    }
    classStudents.value = result
  } catch {
    classStudents.value = []
  } finally {
    loading.value = false
  }
}

function openStudentDetail(classId: number, className: string, student: StudentWithCourses) {
  detailClassId.value = classId
  detailClassName.value = className
  detailStudent.value = student
  detailVisible.value = true
}

function closeDetail() {
  detailVisible.value = false
  detailStudent.value = null
}

onShow(() => {
  fetchData()
})
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 2px;
  width: 100%;
  box-sizing: border-box;
}

/* ========== 页面头部 ========== */
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-kicker {
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
}

.page-title {
  font-family: var(--font-display);
  font-size: 24px;
  line-height: 1.2;
  letter-spacing: 0.02em;
  color: var(--ink);
}

.page-sub {
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--muted);
}

.header-meta {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  color: var(--muted);
}

/* ========== 教学班分组 ========== */
.class-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.class-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 12px;
  border-left: 3px solid var(--accent);
}

.class-name {
  font-family: var(--font-display);
  font-size: 17px;
  color: var(--ink);
}

.class-count {
  padding: 2px 9px;
  font-size: 11px;
  color: var(--ink-2);
  background: var(--paper-deep);
  border-radius: 999px;
  font-variant-numeric: tabular-nums;
}

.class-questions {
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

/* ========== 学生表 ========== */
.student-table {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
}

.table-header {
  display: flex;
  align-items: center;
  padding: 12px 18px;
  background: #F7F3EA;
  border-bottom: 1px solid var(--line);
}

.table-row {
  display: flex;
  align-items: center;
  padding: 12px 18px;
  background: var(--surface-raised);
  border-bottom: 1px solid var(--line);
  transition: background 0.16s ease;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: #FFFCF6;
}

.th,
.td {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-header .th {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.12em;
  color: var(--muted);
}

.td {
  font-size: 13px;
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
}

.td.th-name {
  font-family: var(--font-display);
  font-size: 14px;
  color: var(--ink);
}

.th-id {
  width: 70px;
  flex-shrink: 0;
}

.th-name {
  width: 80px;
  flex-shrink: 0;
}

.th-account {
  flex: 1;
}

.th-questions {
  width: 80px;
  flex-shrink: 0;
  text-align: center;
}

.th-action {
  width: 80px;
  flex-shrink: 0;
  text-align: center;
}

.link-detail {
  font-size: 12px;
  color: var(--accent);
  cursor: pointer;
  padding-bottom: 1px;
  border-bottom: 1px solid transparent;
  transition: color 0.16s ease, border-color 0.16s ease;
}

.link-detail:hover {
  color: var(--accent-ink);
  border-bottom-color: var(--accent);
}

.empty-row {
  padding: 22px 16px;
  text-align: center;
}

.empty-text {
  font-size: 12.5px;
  color: var(--muted);
  letter-spacing: 0.04em;
}

.empty-state {
  padding: 56px 20px;
  text-align: center;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius);
}

/* ========== 弹窗 ========== */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(23, 35, 59, 0.34);
}

.modal-dialog {
  width: 100%;
  max-width: 520px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lift);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 22px 24px 14px;
  border-bottom: 1px solid var(--line);
}

.modal-title {
  flex: 1;
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--ink);
  line-height: 1.4;
}

.modal-close {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: var(--muted);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.16s ease;
}

.modal-close:hover {
  color: var(--ink);
  background: var(--paper-deep);
}

.modal-body {
  padding: 18px 24px 24px;
}

/* ========== 详情统计 ========== */
.detail-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  margin-bottom: 20px;
}

.detail-stats .stat-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 16px;
  border-right: 1px solid var(--line);
}

.detail-stats .stat-item:first-child {
  padding-left: 2px;
}

.detail-stats .stat-item:last-child {
  border-right: none;
}

.stat-label {
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--muted);
}

.stat-value {
  font-family: var(--font-display);
  font-size: 26px;
  line-height: 1.1;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.stat-value.topic {
  font-family: var(--font-body);
  font-size: 13px;
  line-height: 1.6;
  color: var(--accent-ink);
}

/* ========== 倾向分布 ========== */
.tendency-section {
  padding-top: 16px;
  border-top: 1px solid var(--line);
}

.section-title {
  display: block;
  margin-bottom: 14px;
  font-family: var(--font-display);
  font-size: 14px;
  color: var(--ink);
}

.tendency-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tendency-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tendency-topic {
  flex-shrink: 0;
  width: 100px;
  font-size: 12.5px;
  color: var(--ink-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tendency-bar-wrap {
  flex: 1;
  height: 6px;
  background: var(--paper-deep);
  border-radius: 999px;
  overflow: hidden;
}

.tendency-bar {
  height: 100%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.tendency-count {
  flex-shrink: 0;
  width: 44px;
  font-size: 11px;
  color: var(--muted);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* ========== 移动端 ========== */
@media (max-width: 768px) {
  .page-container {
    gap: 14px;
    padding: 0;
  }
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding-bottom: 12px;
  }
  .page-title {
    font-size: 20px;
  }
  .header-meta {
    display: none;
  }
  .table-header {
    display: none;
  }
  .table-row {
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 2px 10px;
    padding: 12px 16px;
  }
  .th-id {
    width: 100%;
    font-size: 11px;
    color: var(--muted);
  }
  .th-name {
    width: auto;
    flex: 1;
  }
  .th-account {
    width: 100%;
    flex: none;
    font-size: 12px;
    color: var(--muted);
  }
  .th-questions {
    width: auto;
    text-align: left;
    font-size: 11px;
    color: var(--muted);
  }
  .th-action {
    width: auto;
    margin-left: auto;
    text-align: right;
  }
  .modal-overlay {
    padding: 12px;
  }
  .modal-header {
    padding: 18px 16px 12px;
  }
  .modal-body {
    padding: 16px;
  }
  .detail-stats .stat-item {
    padding: 2px 12px;
  }
  .stat-value {
    font-size: 22px;
  }
  .tendency-topic {
    width: 74px;
  }
}
</style>
