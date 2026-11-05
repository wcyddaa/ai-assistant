<!-- pages/teacher/chapter/list.vue - 章节管理 -->
<template>
  <AppLayout>
    <view class="page-container">
      <view class="page-header">
        <view class="header-text">
          <text class="page-kicker">CHAPTER INDEX</text>
          <text class="page-title">章节管理</text>
          <text class="page-sub">组织课件章节 · 关联教材页码</text>
        </view>
        <button class="btn-add" @click="openCreate">创建章节</button>
      </view>

      <view v-if="loading" class="loading-state">
        <text class="loading-text">加载中...</text>
      </view>

      <view v-else-if="chapterList.length === 0" class="empty-state">
        <view class="empty-seal">章</view>
        <text class="empty-text">暂无章节，点击右上角创建</text>
      </view>

      <view v-else class="table-container">
        <!-- 表头 -->
        <view class="table-header">
          <text class="th th-name">章节名</text>
          <text class="th th-desc">章节描述</text>
          <text class="th th-course">所属课程</text>
          <text class="th th-count">课件数</text>
          <text class="th th-actions">操作</text>
        </view>

        <!-- 数据行 -->
        <view v-for="ch in pagedList" :key="ch.id" class="table-row">
          <text class="td td-name">{{ ch.title }}</text>
          <text class="td td-desc">{{ ch.description || '-' }}</text>
          <text class="td td-course">{{ ch.courseName }}</text>
          <text class="td td-count">{{ getCoursewareTotalPages(ch) }}</text>
          <view class="td td-actions">
            <text class="action-btn" @click="openDetail(ch)">查看详情</text>
            <text class="action-btn" @click="openEdit(ch)">编辑</text>
            <text class="action-btn danger" @click="handleDelete(ch)">删除</text>
          </view>
        </view>

        <!-- 分页 -->
        <view class="pagination">
          <view class="page-size-row">
            <text class="page-size-label">每页</text>
            <picker
              class="page-size-picker"
              :value="pageSizeIndex"
              :range="pageSizeOptions"
              @change="handlePageSizeChange"
            >
              <text class="page-size-value">{{ pageSize }}</text>
            </picker>
            <text class="page-size-label">条</text>
          </view>
          <view class="page-nav">
            <text class="page-btn" :class="{ disabled: currentPage <= 1 }" @click="goPage(currentPage - 1)">上一页</text>
            <text class="page-info">{{ currentPage }} / {{ totalPages }}</text>
            <text class="page-btn" :class="{ disabled: currentPage >= totalPages }" @click="goPage(currentPage + 1)">下一页</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ==================== 创建章节弹窗 ==================== -->
    <view v-if="createVisible" class="modal-overlay" @click="closeCreate">
      <view class="modal-dialog" @click.stop>
        <view class="modal-header">
          <text class="modal-title">创建章节</text>
          <text class="modal-close" @click="closeCreate">✕</text>
        </view>
        <view class="modal-body">
          <view class="form-group">
            <text class="form-label">关联课程ID <text class="required">*</text></text>
            <input
              class="form-input"
              v-model="createForm.courseId"
              type="number"
              placeholder="请输入课程ID"
            />
            <text v-if="courseIdError" class="form-error">{{ courseIdError }}</text>
          </view>
          <view class="form-group">
            <text class="form-label">章节标题 <text class="required">*</text></text>
            <input class="form-input" v-model="createForm.title" placeholder="请输入章节标题" />
          </view>
          <view class="form-group">
            <text class="form-label">章节内容 <text class="required">*</text></text>
            <textarea class="form-textarea" v-model="createForm.content" placeholder="请输入章节内容" :maxlength="-1" />
          </view>
          <view class="form-group">
            <text class="form-label">上传课件（可选）</text>
            <view class="upload-row">
              <button class="btn-upload" @click="handleCreateFileSelect">选择文件</button>
              <text v-if="createForm.uploadFiles.length === 0" class="upload-hint">未选择文件</text>
            </view>
            <view v-if="createForm.uploadFiles.length > 0" class="upload-file-list">
              <view v-for="(f, idx) in createForm.uploadFiles" :key="idx" class="upload-file-item">
                <text class="upload-file-name">{{ f.name }}</text>
                <text class="upload-file-remove" @click="createForm.uploadFiles.splice(idx, 1)">✕</text>
              </view>
            </view>
            <text class="upload-hint">课件整份上传，直接归属本章节与课程；学生进入教学班后可查看</text>
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn-cancel" @click="closeCreate">取消</button>
          <button class="btn-confirm" @click="handleCreate">确认创建</button>
        </view>
      </view>
    </view>

    <!-- ==================== 查看详情弹窗 ==================== -->
    <view v-if="detailVisible" class="modal-overlay" @click="closeDetail">
      <view class="modal-dialog" @click.stop>
        <view class="modal-header">
          <text class="modal-title">章节详情</text>
          <text class="modal-close" @click="closeDetail">✕</text>
        </view>
        <view class="modal-body detail-body">
          <view class="detail-section">
            <text class="detail-label">章节名</text>
            <text class="detail-value">{{ detailChapter?.title }}</text>
          </view>
          <view class="detail-section">
            <text class="detail-label">章节内容</text>
            <text class="detail-value detail-content">{{ detailChapter?.description || '无' }}</text>
          </view>
          <view class="detail-divider">
            <text class="divider-text">教学资源</text>
          </view>
          <view class="detail-section">
            <text class="detail-label">教材</text>
            <text class="detail-value">由教学班绑定，学生进入教学班后可预览</text>
          </view>
          <view class="detail-section">
            <text class="detail-label">课件</text>
            <view v-if="detailCoursewares.length === 0" class="detail-value">无</view>
            <view v-else class="detail-cw-list">
              <view v-for="cw in detailCoursewares" :key="cw.id" class="detail-cw-item">
                <view class="cw-file-icon">文</view>
                <text class="cw-file-name">{{ cw.title }}.{{ cw.fileType }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- ==================== 编辑章节弹窗 ==================== -->
    <view v-if="editVisible" class="modal-overlay" @click="closeEdit">
      <view class="modal-dialog" @click.stop>
        <view class="modal-header">
          <text class="required-badge">*</text>
          <text class="modal-title">编辑章节</text>
          <text class="modal-close" @click="closeEdit">✕</text>
        </view>
        <view class="modal-body">
          <view class="form-group">
            <text class="form-label">章节名 <text class="required">*</text></text>
            <input class="form-input" v-model="editForm.title" placeholder="请输入章节名" />
          </view>
          <view class="form-group">
            <text class="form-label">章节描述 <text class="required">*</text></text>
            <textarea class="form-textarea" v-model="editForm.description" placeholder="请输入章节描述" :maxlength="-1" />
          </view>
          <view class="form-group">
            <text class="form-label">所属课程 <text class="required">*</text></text>
            <picker
              class="form-picker"
              :value="editCourseIndex"
              :range="coursePickerRange"
              @change="handleEditCourseChange"
            >
              <view class="picker-display">
                <text :class="editCourseIndex >= 0 ? 'picker-text' : 'picker-placeholder'">
                  {{ editCourseIndex >= 0 ? coursePickerRange[editCourseIndex] : '请选择课程' }}
                </text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
          <view class="form-group">
            <text class="form-label">上传课件（可选）</text>
            <view class="upload-row">
              <button class="btn-upload" @click="handleEditFileSelect">选择文件</button>
              <text v-if="editForm.uploadFiles.length === 0" class="upload-hint">未选择文件</text>
            </view>
            <view v-if="editForm.uploadFiles.length > 0" class="upload-file-list">
              <view v-for="(f, idx) in editForm.uploadFiles" :key="idx" class="upload-file-item">
                <text class="upload-file-name">{{ f.name }}</text>
                <text class="upload-file-remove" @click="editForm.uploadFiles.splice(idx, 1)">✕</text>
              </view>
            </view>
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn-cancel" @click="closeEdit">取消</button>
          <button class="btn-confirm" @click="handleEditSubmit">确认保存</button>
        </view>
      </view>
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useUserStore } from '@/store/user'
import { getCoursesByCreator, getChapters, addChapters, updateChapter, deleteChapter, type CourseInfo, type ChapterInfo } from '@/api/course'
import { getCoursewareList, uploadCourseware, deleteCourseware, type CoursewareInfo } from '@/api/courseware'

interface ChapterWithMeta extends ChapterInfo {
  courseName: string
  textbookTitle: string
  coursewares: CoursewareInfo[]
}

const userStore = useUserStore()
const chapterList = ref<ChapterWithMeta[]>([])
const loading = ref(false)
const teacherCourses = ref<CourseInfo[]>([])

// ==================== 分页 ====================

const pageSizeOptions = [10, 20, 50]
const pageSize = ref(10)
const pageSizeIndex = ref(0)
const currentPage = ref(1)

const totalPages = computed(() => Math.max(1, Math.ceil(chapterList.value.length / pageSize.value)))

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return chapterList.value.slice(start, start + pageSize.value)
})

function goPage(page: number) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

function getCoursewareTotalPages(ch: ChapterWithMeta): number {
  return ch.coursewares.reduce((sum, cw) => sum + (cw.totalPages || 0), 0)
}

function handlePageSizeChange(e: { detail: { value: number } }) {
  pageSizeIndex.value = e.detail.value
  pageSize.value = pageSizeOptions[e.detail.value]
  currentPage.value = 1
}

// ==================== 创建章节 ====================

const createVisible = ref(false)
const courseIdError = ref('')
const createForm = ref({
  courseId: '',
  title: '',
  content: '',
  uploadFiles: [] as File[]
})

function openCreate() {
  createForm.value = { courseId: '', title: '', content: '', uploadFiles: [] }
  courseIdError.value = ''
  createVisible.value = true
}

function closeCreate() {
  createVisible.value = false
  courseIdError.value = ''
}

function handleCreateFileSelect() {
  // #ifdef H5
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.accept = '.pdf,.ppt,.pptx,.doc,.docx,.txt'
  input.onchange = (e: Event) => {
    const target = e.target as HTMLInputElement
    const files = target.files
    if (files && files.length > 0) {
      createForm.value.uploadFiles = [...createForm.value.uploadFiles, ...Array.from(files)]
    }
  }
  input.click()
  // #endif
}

async function handleCreate() {
  courseIdError.value = ''

  if (!createForm.value.courseId.trim()) {
    uni.showToast({ title: '请输入关联课程ID', icon: 'none' })
    return
  }
  const courseId = Number(createForm.value.courseId)
  if (isNaN(courseId)) {
    uni.showToast({ title: '课程ID必须为数字', icon: 'none' })
    return
  }

  const course = teacherCourses.value.find(c => c.id === courseId)
  if (!course) {
    courseIdError.value = '该课程不存在或不属于您，请检查课程ID'
    return
  }

  if (!createForm.value.title.trim()) {
    uni.showToast({ title: '请输入章节标题', icon: 'none' })
    return
  }
  if (!createForm.value.content.trim()) {
    uni.showToast({ title: '请输入章节内容', icon: 'none' })
    return
  }

  uni.showLoading({ title: '创建中...' })
  try {
    const chapterData: Partial<ChapterInfo> = {
      title: createForm.value.title.trim(),
      description: createForm.value.content.trim(),
      sortOrder: 1
    }

    await addChapters(courseId, [chapterData])

    let newChapterId: number | undefined
    try {
      const chapters = await getChapters(courseId)
      newChapterId = chapters.find(ch => ch.title === chapterData.title)?.id
    } catch {
      newChapterId = undefined
    }

    if (createForm.value.uploadFiles.length > 0) {
      const userId = userStore.userInfo?.userId || 0
      const userName = userStore.userInfo?.name || userStore.userInfo?.username || ''
      for (const file of createForm.value.uploadFiles) {
        await uploadCourseware(file, courseId, course.name, userId, userName, undefined, newChapterId)
      }
    }

    uni.showToast({ title: '创建成功', icon: 'success' })
    closeCreate()
    await fetchData()
  } catch {
    uni.hideLoading()
    uni.showToast({ title: '创建失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

// ==================== 查看详情 ====================

const detailVisible = ref(false)
const detailChapter = ref<ChapterWithMeta | null>(null)
const detailCoursewares = ref<CoursewareInfo[]>([])

function openDetail(ch: ChapterWithMeta) {
  detailChapter.value = ch
  detailCoursewares.value = ch.coursewares
  detailVisible.value = true
}

function closeDetail() {
  detailVisible.value = false
  detailChapter.value = null
}

// ==================== 编辑章节 ====================

const editVisible = ref(false)
const editChapterId = ref<number>(0)
const editCourseId = ref<number>(0)
const editCourseIndex = ref(-1)
const editForm = ref({
  title: '',
  description: '',
  uploadFiles: [] as File[]
})

const coursePickerRange = computed(() => teacherCourses.value.map(c => c.name))

function openEdit(ch: ChapterWithMeta) {
  editChapterId.value = ch.id
  editCourseId.value = ch.courseId
  editForm.value = {
    title: ch.title,
    description: ch.description || '',
    uploadFiles: []
  }
  editCourseIndex.value = teacherCourses.value.findIndex(c => c.id === ch.courseId)
  editVisible.value = true
}

function closeEdit() {
  editVisible.value = false
}

function handleEditCourseChange(e: { detail: { value: number } }) {
  editCourseIndex.value = e.detail.value
  const course = teacherCourses.value[e.detail.value]
  if (course) {
    editCourseId.value = course.id
  }
}

function handleEditFileSelect() {
  // #ifdef H5
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.accept = '.pdf,.ppt,.pptx,.doc,.docx,.txt'
  input.onchange = (e: Event) => {
    const target = e.target as HTMLInputElement
    const files = target.files
    if (files && files.length > 0) {
      editForm.value.uploadFiles = [...editForm.value.uploadFiles, ...Array.from(files)]
    }
  }
  input.click()
  // #endif
}

async function handleEditSubmit() {
  if (!editForm.value.title.trim()) {
    uni.showToast({ title: '请输入章节名', icon: 'none' })
    return
  }
  if (!editForm.value.description.trim()) {
    uni.showToast({ title: '请输入章节描述', icon: 'none' })
    return
  }
  if (editCourseIndex.value < 0) {
    uni.showToast({ title: '请选择所属课程', icon: 'none' })
    return
  }

  uni.showLoading({ title: '保存中...' })
  try {
    const updateData: Partial<ChapterInfo> = {
      title: editForm.value.title.trim(),
      description: editForm.value.description.trim()
    }

    await updateChapter(editCourseId.value, editChapterId.value, updateData)

    if (editForm.value.uploadFiles.length > 0) {
      const course = teacherCourses.value[editCourseIndex.value]
      const userId = userStore.userInfo?.userId || 0
      const userName = userStore.userInfo?.name || userStore.userInfo?.username || ''
      for (const file of editForm.value.uploadFiles) {
        await uploadCourseware(file, editCourseId.value, course.name, userId, userName, undefined, editChapterId.value)
      }
    }

    uni.showToast({ title: '保存成功', icon: 'success' })
    closeEdit()
    await fetchData()
  } catch {
    uni.hideLoading()
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

// ==================== 删除章节 ====================

async function handleDelete(ch: ChapterWithMeta) {
  const res = await new Promise<{ confirm: boolean }>((resolve) => {
    uni.showModal({
      title: '确认删除',
      content: `确定要删除章节「${ch.title}」吗？`,
      success: (r) => resolve(r)
    })
  })
  if (!res.confirm) return

  try {
    await deleteChapter(ch.courseId, ch.id)
    uni.showToast({ title: '删除成功', icon: 'success' })
    await fetchData()
  } catch {
    uni.showToast({ title: '删除失败', icon: 'none' })
  }
}

// ==================== 数据加载 ====================

async function fetchData() {
  const teacherId = userStore.userInfo?.userId
  if (!teacherId) {
    chapterList.value = []
    return
  }

  loading.value = true
  try {
    const coursesRes = await getCoursesByCreator(teacherId)
    teacherCourses.value = coursesRes.list

    const result: ChapterWithMeta[] = []
    for (const course of coursesRes.list) {
      try {
        const [chapters, cwRes] = await Promise.all([
          getChapters(course.id),
          getCoursewareList({ courseId: course.id, page: 1, size: 100 }).catch(() => ({ list: [] as CoursewareInfo[], total: 0, page: 1, size: 100, totalPages: 0 }))
        ])
        for (const ch of chapters) {
          result.push({
            ...ch,
            courseName: course.name,
            textbookTitle: '由教学班绑定',
            coursewares: cwRes.list.filter(cw => cw.chapterId === ch.id)
          })
        }
      } catch {
        // 跳过异常课程
      }
    }
    chapterList.value = result
    currentPage.value = 1
  } catch {
    chapterList.value = []
  } finally {
    loading.value = false
  }
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

/* ========== 加载 / 空状态 ========== */
.loading-state {
  padding: 56px 20px;
  text-align: center;
}

.loading-text {
  font-size: 11px;
  letter-spacing: 0.16em;
  color: var(--muted);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 64px 20px;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius);
}

.empty-seal {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 19px;
  color: var(--accent-ink);
  background: var(--accent-soft);
  border-radius: 6px;
}

.empty-text {
  font-size: 12.5px;
  letter-spacing: 0.04em;
  color: var(--muted);
}

/* ========== 表格 ========== */
.table-container {
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
  padding: 14px 18px;
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
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.th {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.12em;
  color: var(--muted);
}

.td {
  color: var(--ink-2);
}

.td-name {
  font-family: var(--font-display);
  font-size: 14px;
  color: var(--ink);
}

.td-count {
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.th-name,
.td-name {
  width: 16%;
}

.th-desc,
.td-desc {
  width: 28%;
}

.th-course,
.td-course {
  width: 16%;
}

.th-count,
.td-count {
  width: 8%;
  text-align: center;
}

.th-actions,
.td-actions {
  width: 32%;
  text-align: right;
}

.td-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.action-btn {
  padding: 4px 10px;
  font-size: 12px;
  color: var(--accent);
  white-space: nowrap;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 8px;
  transition: background 0.16s ease, border-color 0.16s ease;
}

.action-btn:hover {
  background: var(--accent-soft);
  border-color: var(--line);
}

.action-btn.danger {
  color: var(--danger);
}

.action-btn.danger:hover {
  background: rgba(163, 59, 46, 0.08);
  border-color: rgba(163, 59, 46, 0.18);
}

/* ========== 分页 ========== */
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 18px;
  border-top: 1px solid var(--line);
  background: var(--surface);
}

.page-size-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.page-size-label {
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 0.06em;
}

.page-size-picker {
  cursor: pointer;
}

.page-size-value {
  padding: 3px 10px;
  font-size: 12px;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 10px;
  font-variant-numeric: tabular-nums;
}

.page-nav {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-btn {
  padding: 5px 12px;
  font-size: 12px;
  color: var(--ink-2);
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 8px;
  transition: all 0.16s ease;
}

.page-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.page-btn.disabled {
  color: var(--muted);
  cursor: default;
  border-color: var(--line);
  opacity: 0.6;
}

.page-btn.disabled:hover {
  color: var(--muted);
  border-color: var(--line);
}

.page-info {
  font-size: 12px;
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
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
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 520px;
  max-height: 86vh;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lift);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 22px 24px 14px;
  border-bottom: 1px solid var(--line);
}

.modal-title {
  flex: 1;
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--ink);
}

.modal-close {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
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
  flex: 1;
  padding: 18px 24px;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 24px 20px;
  border-top: 1px solid var(--line);
}

.required-badge {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
}

/* ========== 表单 ========== */
.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 7px;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--muted);
}

.required {
  color: var(--accent);
}

.form-error {
  display: block;
  margin-top: 6px;
  font-size: 11.5px;
  color: var(--danger);
}

.form-input {
  width: 100%;
  height: 40px;
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

.form-textarea {
  width: 100%;
  min-height: 100px;
  padding: 10px 12px;
  box-sizing: border-box;
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 10px;
  resize: vertical;
  transition: border-color 0.18s ease;
}

.form-textarea:focus {
  border-color: var(--accent);
  outline: none;
}

.page-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-input {
  flex: 1;
}

.page-sep {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--muted);
}

.upload-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-upload {
  flex-shrink: 0;
  margin: 0;
  height: 32px;
  line-height: 30px;
  padding: 0 14px;
  font-size: 12px;
  color: var(--ink-2);
  background: transparent;
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  transition: all 0.16s ease;
}

.btn-upload:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.upload-hint {
  font-size: 11.5px;
  color: var(--muted);
}

.upload-file-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 150px;
  margin-top: 8px;
  overflow-y: auto;
}

.upload-file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  font-size: 12px;
  background: #F9F5ED;
  border: 1px solid var(--line);
  border-radius: 8px;
}

.upload-file-name {
  flex: 1;
  color: var(--ink-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-file-remove {
  flex-shrink: 0;
  margin-left: 8px;
  font-size: 12px;
  color: var(--danger);
  cursor: pointer;
}

.form-picker {
  width: 100%;
}

.picker-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 12px;
  box-sizing: border-box;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 10px;
}

.picker-text {
  font-size: 13.5px;
  color: var(--ink);
}

.picker-placeholder {
  font-size: 13.5px;
  color: var(--muted);
}

.picker-arrow {
  font-size: 10px;
  color: var(--muted);
}

/* ========== 详情弹窗 ========== */
.detail-body {
  padding: 18px 24px 24px;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-label {
  display: block;
  margin-bottom: 5px;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--muted);
}

.detail-value {
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--ink);
}

.detail-content {
  white-space: pre-wrap;
}

.detail-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0 16px;
}

.detail-divider::before,
.detail-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--line);
}

.divider-text {
  font-size: 11px;
  letter-spacing: 0.16em;
  color: var(--muted);
}

.detail-cw-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-cw-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--surface-raised);
  border: 1px solid var(--line);
  border-radius: 8px;
}

.cw-file-icon {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 11px;
  color: var(--accent-ink);
  background: var(--accent-soft);
  border-radius: 4px;
}

.cw-file-name {
  font-size: 12.5px;
  color: var(--ink-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ========== 按钮 ========== */
.btn-cancel {
  margin: 0;
  height: 38px;
  line-height: 36px;
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
  height: 38px;
  line-height: 36px;
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

.btn-confirm[disabled] {
  opacity: 0.45;
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
  .empty-state {
    padding: 44px 16px;
  }
  .table-header {
    display: none;
  }
  .table-row {
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 4px 10px;
    padding: 14px 16px;
  }
  .th-name,
  .td-name {
    width: 100%;
  }
  .th-desc,
  .td-desc {
    width: 100%;
    white-space: normal;
    color: var(--muted);
  }
  .th-course,
  .td-course {
    width: auto;
    flex: 1;
    font-size: 12px;
  }
  .th-count,
  .td-count {
    width: auto;
    text-align: left;
    font-size: 12px;
  }
  .th-actions,
  .td-actions {
    width: 100%;
    margin-top: 6px;
    padding-top: 8px;
    border-top: 1px solid var(--line);
    justify-content: flex-start;
  }
  .pagination {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 16px;
  }
  .modal-overlay {
    padding: 12px;
  }
  .modal-dialog {
    max-height: 88vh;
  }
  .modal-header {
    padding: 18px 16px 12px;
  }
  .modal-body {
    padding: 16px;
  }
  .modal-footer {
    padding: 12px 16px 16px;
  }
  .modal-footer .btn-cancel,
  .modal-footer .btn-confirm {
    flex: 1;
  }
  .detail-body {
    padding: 16px;
  }
}
</style>
