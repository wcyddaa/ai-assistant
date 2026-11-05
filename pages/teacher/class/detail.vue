<!-- pages/teacher/class/detail.vue - 教学班详情：能力图谱 + 学生画像 + 教材/课件 -->
<template>
  <AppLayout>
    <view class="page-container">
      <view class="page-header">
        <view class="header-text">
          <text class="page-kicker">TEACHING CLASS DETAIL</text>
          <text class="page-title">{{ className || '教学班详情' }}</text>
          <text class="page-sub">能力维度 · 学生画像 · 本班教材与课程课件</text>
        </view>
        <text class="back-link" @click="goBack">← 返回教学班</text>
      </view>

      <!-- 能力维度 -->
      <view class="section">
        <view class="section-head">
          <view class="section-title-wrap">
            <text class="section-kicker">ABILITY GRAPH</text>
            <text class="section-title">能力图谱维度</text>
          </view>
          <text class="link" @click="applyRecommended">一键生成推荐维度</text>
        </view>
        <text class="section-hint">维度与权重只作用于本教学班，能力评分基于本班作业与提问生成。</text>

        <view v-for="dim in dimensions" :key="dim.id" class="dim-row">
          <view class="dim-info">
            <text class="dim-name">{{ dim.dimensionName }}</text>
            <text class="dim-desc">{{ dim.description || '未填写维度说明' }}</text>
            <text class="dim-meta">权重 {{ dim.weight }} · 编码 {{ dim.dimensionCode || '-' }}</text>
          </view>
          <view class="dim-ops">
            <text class="link" @click="startEdit(dim)">编辑</text>
            <text class="link danger" @click="removeDimension(dim.id)">删除</text>
          </view>
        </view>
        <view v-if="dimensions.length === 0" class="empty-tip">
          尚未设置能力维度，可先点“一键生成推荐维度”，或在下方手动新增。
        </view>

        <view class="dim-form">
          <input v-model="dimForm.name" class="form-input" placeholder="维度名称，如：概念理解" maxlength="20" />
          <input v-model="dimForm.description" class="form-input wide" placeholder="维度说明（可选）" maxlength="60" />
          <input v-model="dimForm.weight" class="form-input narrow" type="number" placeholder="权重" />
          <button class="btn-primary" @click="saveDimension">{{ editingId ? '保存修改' : '新增维度' }}</button>
          <text v-if="editingId" class="link" @click="resetForm">取消</text>
        </view>
      </view>

      <!-- 学生画像 -->
      <view class="section">
        <view class="section-head">
          <view class="section-title-wrap">
            <text class="section-kicker">STUDENTS</text>
            <text class="section-title">学生能力画像</text>
          </view>
          <text class="section-count">共 {{ students.length }} 人</text>
        </view>
        <view v-if="students.length === 0" class="empty-tip">本教学班暂无学生，请先在“分配学生”中添加。</view>
        <view v-else class="student-grid">
          <view v-for="s in students" :key="s.studentId" class="student-card" @click="openStudent(s)">
            <view class="student-avatar">{{ String(s.studentName || '学').charAt(0) }}</view>
            <view class="student-info">
              <text class="student-name">{{ s.studentName }}</text>
              <text class="student-account">{{ s.studentAccount || '-' }}</text>
            </view>
            <text class="link">查看画像</text>
          </view>
        </view>
      </view>

      <!-- 教学资源 -->
      <view class="section">
        <view class="section-head">
          <view class="section-title-wrap">
            <text class="section-kicker">RESOURCES</text>
            <text class="section-title">本班教材与课程课件</text>
          </view>
        </view>
        <text class="section-hint">教材由教学班绑定；课件归属教学班下的课程，学生进入本班后均可查看 PDF。</text>

        <text class="resource-group">教材（{{ textbooks.length }}）</text>
        <view v-if="textbooks.length === 0" class="empty-tip">本班尚未绑定教材，请管理员在“教材管理”中绑定。</view>
        <view v-for="tb in textbooks" :key="tb.id" class="resource-row">
          <text class="resource-name">{{ tb.title }}</text>
          <text class="resource-meta">{{ tb.totalPages || 0 }} 页</text>
          <text class="link" @click="openPdf('textbook', tb.id)">预览 PDF</text>
        </view>

        <text class="resource-group">课件（{{ coursewares.length }}）</text>
        <view v-if="coursewares.length === 0" class="empty-tip">本班课程暂无已完成解析的课件。</view>
        <view v-for="cw in coursewares" :key="cw.id" class="resource-row">
          <text class="resource-name">{{ cw.title }}</text>
          <text class="resource-meta">{{ cw.courseName || '' }} · {{ cw.totalPages || 0 }} 页</text>
          <text class="link" @click="openPdf('courseware', cw.id)">预览 PDF</text>
        </view>
      </view>
    </view>

    <StudentDetailModal
      :visible="detailVisible"
      :class-id="classId"
      :class-name="className"
      :student="detailStudent"
      :teacher-id="teacherId"
      @close="detailVisible = false"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import AppLayout from '@/components/layout/AppLayout.vue'
import StudentDetailModal from '@/components/teacher/StudentDetailModal.vue'
import { useUserStore } from '@/store/user'
import {
  createAbilityDimension,
  deleteAbilityDimension,
  getAbilityDimensions,
  updateAbilityDimension,
  RECOMMENDED_DIMENSIONS,
  type AbilityDimension
} from '@/api/ability'
import { getClassStudents, type ClassStudent } from '@/api/class'
import { getTextbookPage, type TextbookInfo } from '@/api/textbook'
import { getCoursesByClass } from '@/api/course'
import { getCoursewareList, type CoursewareInfo } from '@/api/courseware'

const BOOK_API = 'http://localhost:8083'

const userStore = useUserStore()
const classId = ref<number>(0)
const className = ref('')
const teacherId = ref<number>(0)

const dimensions = ref<AbilityDimension[]>([])
const students = ref<ClassStudent[]>([])
const textbooks = ref<TextbookInfo[]>([])
const coursewares = ref<CoursewareInfo[]>([])

const editingId = ref<number | null>(null)
const dimForm = ref({ name: '', description: '', weight: '1' })

const detailVisible = ref(false)
const detailStudent = ref<{ studentId: number; studentName: string; studentAccount?: string } | null>(null)

onLoad((options?: Record<string, string>) => {
  classId.value = Number(options?.classId || 0)
  className.value = decodeURIComponent(options?.className || '')
  teacherId.value = Number(userStore.userInfo?.userId || 0)
  loadAll()
})

function goBack() {
  uni.navigateBack()
}

async function loadAll() {
  if (!classId.value) return
  uni.showLoading({ title: '加载中...' })
  await Promise.all([loadDimensions(), loadStudents(), loadTextbooks(), loadCoursewares()])
  uni.hideLoading()
}

async function loadDimensions() {
  try {
    dimensions.value = await getAbilityDimensions(classId.value)
  } catch {
    dimensions.value = []
  }
}

async function loadStudents() {
  try {
    students.value = await getClassStudents(classId.value)
  } catch {
    students.value = []
  }
}

async function loadTextbooks() {
  try {
    const res = await getTextbookPage({ classId: classId.value, page: 1, size: 50 })
    textbooks.value = res.list || []
  } catch {
    textbooks.value = []
  }
}

async function loadCoursewares() {
  try {
    const courses = await getCoursesByClass(classId.value)
    const all: CoursewareInfo[] = []
    for (const course of courses) {
      try {
        const res = await getCoursewareList({ courseId: course.id, page: 1, size: 100 })
        all.push(...(res.list || []).map((cw) => ({ ...cw, courseName: course.name })))
      } catch { /* 单门课程失败不影响其他课程 */ }
    }
    coursewares.value = all.filter((cw) => cw.processStatus === 'completed')
  } catch {
    coursewares.value = []
  }
}

function startEdit(dim: AbilityDimension) {
  editingId.value = dim.id
  dimForm.value = {
    name: dim.dimensionName,
    description: dim.description || '',
    weight: String(dim.weight ?? 1)
  }
}

function resetForm() {
  editingId.value = null
  dimForm.value = { name: '', description: '', weight: '1' }
}

async function saveDimension() {
  const name = dimForm.value.name.trim()
  if (!name) {
    uni.showToast({ title: '请填写维度名称', icon: 'none' })
    return
  }
  const weight = Number(dimForm.value.weight) || 1
  try {
    const payload = {
      classId: classId.value,
      dimensionName: name,
      weight,
      description: dimForm.value.description.trim(),
      teacherId: teacherId.value
    }
    if (editingId.value) {
      await updateAbilityDimension(editingId.value, { ...payload, id: editingId.value })
    } else {
      await createAbilityDimension({ ...payload, sortOrder: dimensions.value.length })
    }
    resetForm()
    await loadDimensions()
    uni.showToast({ title: '已保存', icon: 'none' })
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '保存失败', icon: 'none' })
  }
}

async function removeDimension(id: number) {
  uni.showModal({
    title: '确认删除',
    content: '删除后该维度的历史评分不再展示，确定删除吗？',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await deleteAbilityDimension(id)
        if (editingId.value === id) resetForm()
        await loadDimensions()
        uni.showToast({ title: '已删除', icon: 'none' })
      } catch (e) {
        uni.showToast({ title: e instanceof Error ? e.message : '删除失败', icon: 'none' })
      }
    }
  })
}

async function applyRecommended() {
  if (dimensions.value.length > 0) {
    const res = await new Promise<{ confirm: boolean }>((resolve) => {
      uni.showModal({
        title: '生成推荐维度',
        content: '当前已有维度，继续将追加 6 个推荐维度（可重复），是否继续？',
        success: (r) => resolve(r)
      })
    })
    if (!res.confirm) return
  }
  try {
    uni.showLoading({ title: '生成中...' })
    for (let i = 0; i < RECOMMENDED_DIMENSIONS.length; i++) {
      const item = RECOMMENDED_DIMENSIONS[i]
      await createAbilityDimension({
        classId: classId.value,
        dimensionName: item.name,
        dimensionCode: item.code,
        weight: item.weight,
        description: item.description,
        sortOrder: dimensions.value.length + i,
        teacherId: teacherId.value
      })
    }
    uni.hideLoading()
    await loadDimensions()
    uni.showToast({ title: '已生成', icon: 'none' })
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: e instanceof Error ? e.message : '生成失败', icon: 'none' })
  }
}

function openStudent(student: ClassStudent) {
  detailStudent.value = {
    studentId: student.studentId,
    studentName: student.studentName,
    studentAccount: student.studentAccount
  }
  detailVisible.value = true
}

function openPdf(type: 'textbook' | 'courseware', id: string | number) {
  // #ifdef H5
  const path = type === 'textbook' ? `/api/textbooks/${id}/file` : `/api/courseware/${id}/file`
  window.open(BOOK_API + path, '_blank')
  // #endif
  // #ifndef H5
  uni.showToast({ title: '请在浏览器中预览 PDF', icon: 'none' })
  // #endif
}
</script>

<style scoped>
.page-container {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
}

.header-text { display: flex; flex-direction: column; gap: 5px; }

.page-kicker {
  font-size: 9px;
  letter-spacing: 0.28em;
  color: var(--accent);
}

.page-title {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 600;
  color: var(--ink);
}

.page-sub { font-size: 11.5px; color: var(--muted); letter-spacing: 0.06em; }

.back-link {
  font-size: 12px;
  color: var(--info);
  cursor: pointer;
}

.section {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-title-wrap { display: flex; flex-direction: column; gap: 3px; }

.section-kicker {
  font-size: 9px;
  letter-spacing: 0.24em;
  color: var(--accent);
}

.section-title {
  font-family: var(--font-display);
  font-size: 17px;
  color: var(--ink);
}

.section-hint { font-size: 11.5px; line-height: 1.7; color: var(--muted); }
.section-count { font-size: 12px; color: var(--muted); }

.dim-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface-raised);
}

.dim-info { display: flex; flex-direction: column; gap: 4px; }
.dim-name { font-size: 13.5px; font-weight: 600; color: var(--ink); }
.dim-desc { font-size: 12px; color: var(--ink-2); }
.dim-meta { font-size: 11px; color: var(--muted); }
.dim-ops { display: flex; gap: 10px; }

.dim-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding-top: 6px;
}

.form-input {
  height: 38px;
  padding: 0 12px;
  font-size: 13px;
  color: var(--ink);
  background: var(--surface-raised);
  border: 1px solid var(--line);
  border-radius: 10px;
  box-sizing: border-box;
}

.form-input.wide { flex: 1; min-width: 200px; }
.form-input.narrow { width: 90px; }

.btn-primary {
  height: 38px;
  line-height: 36px;
  padding: 0 18px;
  font-size: 12.5px;
  color: #F8F3E8;
  background: var(--ink);
  border: 1px solid var(--ink);
  border-radius: 10px;
  margin: 0;
}

.link { font-size: 12px; color: var(--info); cursor: pointer; }
.link.danger { color: var(--danger); }

.empty-tip {
  padding: 18px;
  font-size: 12px;
  color: var(--muted);
  text-align: center;
  border: 1px dashed var(--line-strong);
  border-radius: 10px;
}

.student-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
}

.student-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface-raised);
  cursor: pointer;
}

.student-avatar {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent-ink);
  font-size: 14px;
  font-weight: 600;
}

.student-info { display: flex; flex-direction: column; gap: 3px; flex: 1; }
.student-name { font-size: 13px; color: var(--ink); font-weight: 600; }
.student-account { font-size: 11px; color: var(--muted); }

.resource-group {
  margin-top: 6px;
  font-size: 11px;
  letter-spacing: 0.16em;
  color: var(--muted);
}

.resource-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface-raised);
}

.resource-name { flex: 1; font-size: 13px; color: var(--ink); }
.resource-meta { font-size: 11.5px; color: var(--muted); }

@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; }
  .dim-row { flex-direction: column; align-items: flex-start; }
  .form-input.wide { min-width: 100%; }
}
</style>
