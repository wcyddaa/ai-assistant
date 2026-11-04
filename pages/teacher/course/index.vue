<!-- pages/teacher/course/index.vue - 教师端我的课程 -->
<template>
  <AppLayout>
    <view class="page-container">
      <view class="page-header">
        <view class="header-text">
          <text class="page-kicker">COURSE LIBRARY</text>
          <text class="page-title">我的课程</text>
          <text class="page-sub">维护课程 · 组织章节 · 课件与知识图谱</text>
        </view>
        <button class="btn-add" @click="handleAdd">创建课程</button>
      </view>

      <!-- 课程卡片列表 -->
      <view class="card-list">
        <view v-for="c in list" :key="c.id" class="course-card">
          <view class="card-top">
            <view class="card-title-row">
              <text class="course-name">{{ c.name }}</text>
              <text class="status-badge" :class="'status-' + c.status">
                {{ c.status === 'approved' ? '已通过' : c.status === 'pending' ? '待审核' : '草稿' }}
              </text>
            </view>
            <text class="course-desc">{{ c.description || '暂无描述' }}</text>
          </view>
          <view class="course-info">
            <text class="info-item">课程ID: {{ formatId(c.id) }}</text>
            <text class="info-item">章节: {{ c.chapterCount ?? 0 }}节</text>
            <text class="info-item">教材: 由教学班绑定</text>
          </view>
          <view class="card-actions">
            <text class="action-link" @click="handleDetail(c)">查看详情</text>
            <text class="action-link" @click="handleEdit(c)">编辑</text>
            <text class="action-link danger" @click="handleDelete(c.id)">删除</text>
          </view>
        </view>
        <view v-if="list.length === 0 && !loading" class="empty-state">
          <text class="empty-text">暂无课程，点击右上角创建</text>
        </view>
      </view>

      <!-- 创建/编辑课程弹窗 -->
      <view v-if="formVisible" class="popup-overlay" @click="closeForm">
        <view class="form-dialog" @click.stop>
          <text class="dialog-x" @click="closeForm">×</text>
          <text class="form-title">{{ isEdit ? '编辑课程' : '创建课程' }}</text>
          <input class="form-input" v-model="form.name" placeholder="课程名称" @confirm="submitForm" />
          <input class="form-input" v-model="form.description" placeholder="课程描述" @confirm="submitForm" />
          <text v-if="!isEdit" class="form-hint">教材由教学班绑定；课程用于组织章节与课件。创建后为草稿状态，需管理员审核通过</text>
          <view class="form-actions">
            <button class="btn-cancel" @click="closeForm">取消</button>
            <button class="btn-confirm" @click="submitForm">确定</button>
          </view>
        </view>
      </view>

      <!-- 课程详情弹窗 -->
      <view v-if="detailVisible" class="popup-overlay" @click="closeDetail">
        <view class="detail-dialog" @click.stop>
          <view class="detail-header">
            <view class="detail-head-text">
              <text class="page-kicker">COURSE DETAIL</text>
              <text class="form-title">{{ detailCourse?.name }} · 课程详情</text>
            </view>
            <text class="detail-close" @click="closeDetail">×</text>
          </view>

          <view class="detail-body">
            <!-- 课件预览 -->
            <view class="preview-section">
              <view class="preview-row">
                <text class="preview-label">课件预览</text>
                <picker v-if="detailCoursewares.length > 0" mode="selector" :range="detailCoursewareLabels" @change="onCoursewarePreviewChange">
                  <view class="picker-display preview-picker">请选择课件</view>
                </picker>
                <text v-else class="preview-empty">暂无课件</text>
              </view>
            </view>

            <!-- 章节和课件列表 -->
            <view v-if="detailChapters.length > 0" class="chapter-list">
              <view v-for="ch in detailChapters" :key="ch.id" class="chapter-block">
                <view class="chapter-header">
                  <text class="chapter-title">{{ ch.title }}</text>
                  <text v-if="ch.startPage || ch.endPage" class="chapter-pages">第{{ ch.startPage || '?' }}-{{ ch.endPage || '?' }}页</text>
                </view>
                <text v-if="ch.description" class="chapter-desc">{{ ch.description }}</text>
                <!-- 该章节的课件 -->
                <view v-if="ch.coursewares && ch.coursewares.length > 0" class="courseware-list">
                  <view v-for="cw in ch.coursewares" :key="cw.id" class="courseware-item">
                    <text class="cw-name">{{ cw.title }}</text>
                    <text class="cw-info">{{ cw.fileType }} · {{ formatFileSize(cw.fileSize) }} · {{ cw.totalPages }}页</text>
                    <text v-if="cw.fileType === 'pdf'" class="action-link" @click="previewPdf(cw)">预览</text>
                  </view>
                </view>
                <text v-else class="no-courseware">暂无课件</text>
              </view>
            </view>
            <view v-else class="empty-state">
              <text class="empty-text">暂无章节</text>
            </view>

            <!-- 知识图谱：课件 + 学生提问 + 作业错误 -->
            <view class="graph-section">
              <KnowledgeGraph :graph="detailGraph">
                <template #actions>
                  <button class="btn-graph" :disabled="graphLoading" @click="generateGraph">
                    {{ graphLoading ? '生成中...' : (detailGraph && !detailGraph.empty ? '重新生成' : '生成知识图谱') }}
                  </button>
                </template>
                <template #empty>
                  <text class="graph-empty-text">上传课件并创建章节后，点击“生成知识图谱”，智能体会结合学生提问与作业错误提取知识点。</text>
                </template>
              </KnowledgeGraph>
            </view>
          </view>

          <view class="form-actions" style="margin-top: 16px">
            <button class="btn-cancel" @click="closeDetail">关闭</button>
          </view>
        </view>
      </view>

      </view>

      <!-- PDF 图片流预览弹窗 -->
      <PdfPreview
        v-if="previewVisible"
        :fileId="previewFileId"
        :baseUrl="previewBaseUrl"
        :totalPages="previewTotalPages"
        :title="previewTitle"
        @close="closePreview"
      />

    </AppLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AppLayout from '@/components/layout/AppLayout.vue'
import PdfPreview from '@/components/PdfPreview.vue'
import KnowledgeGraph from '@/components/course/KnowledgeGraph.vue'
import { useUserStore } from '@/store/user'
import { getCoursesByCreator, createCourse, updateCourse, deleteCourse, getChapters, getKnowledgeGraph, extractKnowledgeGraph, type CourseInfo, type ChapterInfo, type KnowledgeGraph as KnowledgeGraphType } from '@/api/course'
import { getCoursewareList, type CoursewareInfo } from '@/api/courseware'

interface CourseWithChapters extends CourseInfo {
  chapterCount?: number
  totalPages?: number
}

interface ChapterWithCoursewares extends ChapterInfo {
  coursewares?: CoursewareInfo[]
}

const userStore = useUserStore()
const list = ref<CourseWithChapters[]>([])
const loading = ref(false)

const formVisible = ref(false)
const isEdit = ref(false)
const form = ref<Partial<CourseInfo>>({})

// 详情弹窗
const detailVisible = ref(false)
const detailCourse = ref<CourseWithChapters | null>(null)
const detailChapters = ref<ChapterWithCoursewares[]>([])
const detailCoursewares = ref<CoursewareInfo[]>([])
const detailCoursewareLabels = ref<string[]>([])
const detailGraph = ref<KnowledgeGraphType | null>(null)
const graphLoading = ref(false)

// PDF 预览
const previewVisible = ref(false)
const previewFileId = ref('')
const previewBaseUrl = ref('')
const previewTotalPages = ref(0)
const previewTitle = ref('')

const BOOK_API_BASE = 'http://localhost:8083'

function formatId(id: number): string {
  const s = String(id)
  return s.length > 8 ? s.substring(0, 8) + '...' : s
}

function formatTime(time: string): string {
  if (!time) return '-'
  return time.substring(0, 10)
}

async function fetchData() {
  loading.value = true
  try {
    const userId = userStore.userInfo?.userId
    if (!userId) {
      list.value = []
      return
    }
    const res = await getCoursesByCreator(userId)
    const enriched = await Promise.all(
      res.list.map(async (c) => {
        try {
          const chs = await getChapters(c.id)
          return { ...c, chapterCount: chs.length }
        } catch {
          return { ...c, chapterCount: 0 }
        }
      })
    )
    list.value = enriched
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

// ==================== 创建/编辑课程 ====================

function handleAdd() {
  isEdit.value = false
  form.value = { name: '', description: '' }
  formVisible.value = true
}

function handleEdit(c: CourseWithChapters) {
  isEdit.value = true
  form.value = { ...c }
  formVisible.value = true
}

function closeForm() {
  formVisible.value = false
}

async function submitForm() {
  if (!form.value.name?.trim()) {
    uni.showToast({ title: '请输入课程名称', icon: 'none' })
    return
  }
  try {
    if (isEdit.value && form.value.id) {
      const updateData: Record<string, unknown> = {}
      if (form.value.name) updateData.name = form.value.name
      if (form.value.description !== undefined) updateData.description = form.value.description
      await updateCourse(form.value.id, updateData as Partial<CourseInfo>)
      uni.showToast({ title: '更新成功', icon: 'success' })
    } else {
      const userId = userStore.userInfo?.userId
      await createCourse({
        name: form.value.name,
        description: form.value.description || '',
        createrId: userId,
        status: 'draft'
      })
      uni.showToast({ title: '创建成功，等待管理员审核', icon: 'success' })
    }
    closeForm()
    fetchData()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '操作失败'
    uni.showToast({ title: msg, icon: 'none' })
  }
}

async function handleDelete(id: number) {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除该课程吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteCourse(id)
          uni.showToast({ title: '删除成功', icon: 'success' })
          fetchData()
        } catch {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}

// ==================== 课程详情 ====================

async function handleDetail(c: CourseWithChapters) {
  detailCourse.value = c
  detailVisible.value = true
  detailChapters.value = []
  detailCoursewares.value = []
  detailCoursewareLabels.value = []
  detailGraph.value = null
  try {
    // 加载章节
    const chapters = await getChapters(c.id)
    const enriched = await Promise.all(
      chapters.map(async (ch) => {
        try {
          const res = await getCoursewareList({ courseId: c.id, chapterId: ch.id, page: 1, size: 50 })
          const cws = res.list.filter(cw => cw.processStatus === 'completed')
          return { ...ch, coursewares: cws }
        } catch {
          return { ...ch, coursewares: [] }
        }
      })
    )
    detailChapters.value = enriched
    // 加载所有课件用于预览下拉
    try {
      const res = await getCoursewareList({ courseId: c.id, page: 1, size: 50 })
      detailCoursewares.value = res.list.filter(cw => cw.processStatus === 'completed')
      detailCoursewareLabels.value = detailCoursewares.value.map(cw => cw.title)
    } catch {
      detailCoursewares.value = []
      detailCoursewareLabels.value = []
    }
    // 加载知识图谱
    await loadGraph(c.id)
  } catch {
    detailChapters.value = []
  }
}

async function loadGraph(courseId: number) {
  try {
    detailGraph.value = await getKnowledgeGraph(courseId)
  } catch {
    detailGraph.value = null
  }
}

async function generateGraph() {
  if (!detailCourse.value) return
  graphLoading.value = true
  uni.showLoading({ title: '智能体提取中...', mask: true })
  try {
    detailGraph.value = await extractKnowledgeGraph(detailCourse.value.id)
    uni.hideLoading()
    const count = detailGraph.value?.nodes?.length || 0
    uni.showToast({ title: `已生成 ${count} 个知识点`, icon: 'success' })
  } catch (err: unknown) {
    uni.hideLoading()
    const msg = err instanceof Error ? err.message : '生成失败'
    uni.showToast({ title: msg, icon: 'none' })
    await loadGraph(detailCourse.value.id)
  } finally {
    graphLoading.value = false
  }
}

function closeDetail() {
  detailVisible.value = false
  detailCourse.value = null
  detailChapters.value = []
  detailCoursewares.value = []
  detailCoursewareLabels.value = []
  detailGraph.value = null
}

function onCoursewarePreviewChange(e: { detail: { value: number } }) {
  const cw = detailCoursewares.value[e.detail.value]
  if (cw) {
    if (cw.fileType === 'pdf') {
      openPdfPreview(cw.id, BOOK_API_BASE + '/api/courseware/' + cw.id, cw.totalPages, cw.title)
    } else {
      // #ifdef H5
      window.open(BOOK_API_BASE + '/api/courseware/' + cw.id + '/file', '_blank')
      // #endif
    }
  }
}

function previewPdf(cw: CoursewareInfo) {
  if (cw.fileType === 'pdf') {
    openPdfPreview(cw.id, BOOK_API_BASE + '/api/courseware/' + cw.id, cw.totalPages, cw.title)
  } else {
    // #ifdef H5
    window.open(BOOK_API_BASE + '/api/courseware/' + cw.id + '/file', '_blank')
    // #endif
  }
}

function openPdfPreview(fileId: string, baseUrl: string, totalPages: number, title: string) {
  previewFileId.value = fileId
  previewBaseUrl.value = baseUrl
  previewTotalPages.value = totalPages
  previewTitle.value = title
  previewVisible.value = true
}

function closePreview() {
  previewVisible.value = false
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '0B'
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
}

onShow(() => {
  fetchData()
})
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.btn-add {
  flex-shrink: 0;
  margin: 0;
  height: 38px;
  line-height: 38px;
  padding: 0 18px;
  border: none;
  border-radius: 10px;
  background: var(--ink);
  color: #F8F3E8;
  font-size: 13px;
  letter-spacing: 0.04em;
  transition: background 0.18s ease, transform 0.18s ease;
}

.btn-add:hover {
  background: #24334F;
  transform: translateY(-1px);
}

.btn-add-small {
  margin: 0;
  height: 32px;
  line-height: 32px;
  padding: 0 14px;
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  background: transparent;
  color: var(--ink-2);
  font-size: 12px;
}

/* ========== 卡片列表 ========== */
.card-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}

.course-card {
  display: flex;
  flex-direction: column;
  padding: 18px 20px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.course-card:hover {
  transform: translateY(-2px);
  border-color: var(--line-strong);
}

.card-top {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.course-name {
  flex: 1;
  min-width: 0;
  font-family: var(--font-display);
  font-size: 17px;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-desc {
  font-size: 12px;
  line-height: 1.6;
  color: var(--muted);
}

.status-badge {
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.04em;
}

.status-badge.status-approved {
  background: rgba(63, 107, 82, 0.12);
  color: var(--success);
}

.status-badge.status-pending {
  background: rgba(173, 116, 27, 0.12);
  color: var(--warning);
}

.status-badge.status-draft {
  background: var(--paper-deep);
  color: var(--muted);
}

.course-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}

.info-item {
  font-size: 12.5px;
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
}

.card-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}

.action-link {
  font-size: 12.5px;
  color: var(--accent);
  cursor: pointer;
  padding-bottom: 1px;
  border-bottom: 1px solid transparent;
  transition: color 0.16s ease, border-color 0.16s ease;
}

.action-link:hover {
  color: var(--accent-ink);
  border-bottom-color: var(--accent);
}

.action-link.danger {
  color: var(--danger);
}

.action-link.danger:hover {
  border-bottom-color: var(--danger);
}

/* ========== 空状态 ========== */
.empty-state {
  grid-column: 1 / -1;
  padding: 46px 20px;
  text-align: center;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius);
}

.empty-text {
  font-size: 12.5px;
  letter-spacing: 0.04em;
  color: var(--muted);
}

/* ========== 弹窗基础 ========== */
.popup-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(23, 35, 59, 0.34);
}

.form-dialog {
  width: 100%;
  max-width: 380px;
  padding: 26px 24px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lift);
}

.form-title {
  display: block;
  margin-bottom: 18px;
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--ink);
}

.form-input {
  width: 100%;
  height: 42px;
  margin-bottom: 12px;
  padding: 0 12px;
  box-sizing: border-box;
  font-size: 13.5px;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 10px;
  transition: border-color 0.18s ease;
}

.form-input:focus {
  border-color: var(--accent);
  outline: none;
}

.form-hint {
  display: block;
  margin-bottom: 14px;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--warning);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel {
  margin: 0;
  height: 40px;
  line-height: 38px;
  padding: 0 22px;
  box-sizing: border-box;
  font-size: 13px;
  color: var(--ink-2);
  background: transparent;
  border: 1px solid var(--line-strong);
  border-radius: 10px;
}

.btn-cancel:hover {
  color: var(--ink);
  border-color: var(--ink-2);
}

.btn-confirm {
  margin: 0;
  height: 40px;
  line-height: 38px;
  padding: 0 22px;
  box-sizing: border-box;
  font-size: 13px;
  color: #F8F3E8;
  background: var(--ink);
  border: 1px solid var(--ink);
  border-radius: 10px;
}

.btn-confirm:hover {
  background: #24334F;
}

/* ========== 课程详情弹窗 ========== */
.detail-dialog {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 580px;
  max-height: 78vh;
  padding: 24px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lift);
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);
  /* 标题与关闭按钮固定在弹窗顶部，内容滚动时仍可见 */
  position: sticky;
  top: 0;
  z-index: 5;
  background: var(--surface);
}

.detail-head-text {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.detail-header .form-title {
  margin-bottom: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-close {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
  color: var(--muted);
  cursor: pointer;
  border-radius: 8px;
  transition: color 0.16s ease, background 0.16s ease;
}

.detail-close:hover {
  color: var(--ink);
  background: var(--paper-deep);
}

.detail-body {
  flex: 1;
  max-height: 56vh;
  overflow-y: auto;
  padding: 16px 2px 4px;
}

.preview-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  margin-bottom: 14px;
  background: #F9F5ED;
  border: 1px solid var(--line);
  border-radius: 12px;
}

.preview-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-label {
  flex-shrink: 0;
  width: 60px;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--muted);
}

.preview-picker {
  flex: 1;
  max-width: 300px;
  height: 34px;
  line-height: 32px;
  padding: 0 10px;
  font-size: 12.5px;
  color: var(--ink-2);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 10px;
  box-sizing: border-box;
}

.preview-empty {
  font-size: 12.5px;
  color: var(--muted);
}

.graph-section {
  margin-top: 16px;
}

.btn-graph {
  margin: 0;
  height: 34px;
  line-height: 34px;
  padding: 0 16px;
  border: none;
  border-radius: 9px;
  background: var(--ink);
  color: #F7F2E7;
  font-size: 12px;
  letter-spacing: 0.05em;
  transition: background 0.18s ease;
}

.btn-graph:hover {
  background: #24334F;
}

.btn-graph[disabled] {
  opacity: 0.6;
}

.graph-empty-text {
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--muted);
}

.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chapter-block {
  padding: 14px 16px;
  background: var(--surface-raised);
  border: 1px solid var(--line);
  border-left: 3px solid var(--line-strong);
  border-radius: 10px;
  transition: border-color 0.18s ease;
}

.chapter-block:hover {
  border-left-color: var(--accent);
}

.chapter-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 4px;
}

.chapter-title {
  font-family: var(--font-display);
  font-size: 15px;
  color: var(--ink);
}

.chapter-pages {
  flex-shrink: 0;
  padding: 2px 8px;
  font-size: 11px;
  color: var(--ink-2);
  background: var(--paper-deep);
  border-radius: 999px;
  font-variant-numeric: tabular-nums;
}

.chapter-desc {
  display: block;
  margin-bottom: 8px;
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--muted);
}

.courseware-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.courseware-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 8px;
}

.cw-name {
  flex: 1;
  min-width: 0;
  font-size: 12.5px;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cw-info {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.no-courseware {
  padding: 4px 0;
  font-size: 12px;
  color: var(--muted);
}

/* ========== 移动端 ========== */
@media (max-width: 768px) {
  .page-container {
    gap: 12px;
    padding: 0;
  }
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding-bottom: 12px;
  }
  .page-title {
    font-size: 20px;
  }
  .btn-add {
    width: 100%;
    text-align: center;
  }
  .card-list {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .course-card {
    padding: 16px;
  }
  .popup-overlay {
    padding: 12px;
  }
  .form-dialog {
    max-width: 100%;
    padding: 20px 16px;
  }
  .detail-dialog {
    max-width: 100%;
    max-height: 86vh;
    padding: 18px 14px;
  }
  .detail-body {
    max-height: 62vh;
  }
  .form-actions {
    flex-direction: column-reverse;
  }
  .form-actions .btn-cancel,
  .form-actions .btn-confirm {
    width: 100%;
  }
  .preview-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }
  .preview-picker {
    max-width: 100%;
    width: 100%;
  }
  .courseware-item {
    flex-wrap: wrap;
  }
}
</style>
