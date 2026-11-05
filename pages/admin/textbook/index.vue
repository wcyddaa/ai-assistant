<!-- pages/admin/textbook/index.vue - 教材管理 -->
<template>
  <AppLayout>
    <view class="page-container">
      <view class="page-header">
        <view class="header-left">
          <text class="header-kicker">TEXTBOOK ARCHIVE</text>
          <text class="page-title-sm">教材管理</text>
          <text class="header-sub">教材文件 · 页面与切片</text>
        </view>
        <view class="header-actions">
          <button class="btn-upload" @click="handleUpload">+ 上传教材</button>
        </view>
      </view>

      <!-- 统计卡片 -->
      <view class="stats-row">
        <view class="stat-card">
          <text class="stat-num">{{ stats.textbookCount }}</text>
          <text class="stat-label">教材总数</text>
        </view>
        <view class="stat-card">
          <text class="stat-num">{{ stats.totalPages }}</text>
          <text class="stat-label">页面总数</text>
        </view>
        <view class="stat-card">
          <text class="stat-num">{{ stats.chunkCount }}</text>
          <text class="stat-label">切片总数</text>
        </view>
      </view>

      <!-- 搜索栏 -->
      <view class="search-bar">
        <input
          class="search-input"
          v-model="keyword"
          placeholder="搜索教材名称"
          @confirm="handleSearch"
        />
        <input
          class="search-input category-input"
          v-model="categoryFilter"
          placeholder="分类筛选"
          @confirm="handleSearch"
        />
        <button class="btn-search" @click="handleSearch">查询</button>
        <button class="btn-reset" @click="handleReset">重置</button>
      </view>

      <!-- 表格 -->
      <view class="table-wrapper">
        <view class="table-header">
          <text class="th" style="width:250px">教材ID</text>
          <text class="th" style="flex:1">教材名称</text>
          <text class="th" style="width:120px">所属教学班</text>
          <text class="th" style="width:60px">作者</text>
          <text class="th" style="width:60px">分类</text>
          <text class="th" style="width:60px">类型</text>
          <text class="th" style="width:50px">页数</text>
          <text class="th" style="width:110px">上传时间</text>
          <text class="th" style="width:170px">操作</text>
        </view>
        <view v-for="t in list" :key="t.id" class="table-row">
          <text class="td mono-cell id-cell" style="width:250px" @click="copyId(t.id)">{{ t.id }}</text>
          <text class="td" style="flex:1">{{ t.title }}</text>
          <text class="td" style="width:120px">{{ t.className || '未绑定' }}</text>
          <text class="td" style="width:60px">{{ t.author || '-' }}</text>
          <text class="td" style="width:60px">{{ t.category || '-' }}</text>
          <text class="td" style="width:60px">{{ t.fileType || '-' }}</text>
          <text class="td" style="width:50px">{{ t.totalPages || 0 }}</text>
          <text class="td cell-sub" style="width:110px">{{ formatTime(t.createTime) }}</text>
          <view class="td action-cell" style="width:170px; gap:6px; display:flex">
            <text class="action-link" @click="handleRename(t)">改名称</text>
            <text class="action-link" @click="handleBind(t)">绑定教学班</text>
            <text class="action-link danger" @click="handleDelete(t.id)">删除</text>
          </view>
        </view>
        <view v-if="list.length === 0" class="empty-row">
          <text class="empty-text">暂无数据</text>
          <text class="empty-caption">NO RECORDS</text>
        </view>
      </view>

      <!-- 分页 -->
      <view v-if="totalPages > 0" class="pagination">
        <text class="page-total">共 {{ total }} 条记录</text>
        <view class="pagination-controls">
          <button class="page-btn" :disabled="pageNum <= 1" @click="goPage(1)">首页</button>
          <button class="page-btn" :disabled="pageNum <= 1" @click="goPage(pageNum - 1)">上一页</button>
          <text class="page-info">{{ pageNum }} / {{ totalPages }}</text>
          <button class="page-btn" :disabled="pageNum >= totalPages" @click="goPage(pageNum + 1)">下一页</button>
          <button class="page-btn" :disabled="pageNum >= totalPages" @click="goPage(totalPages)">末页</button>
        </view>
        <view class="page-jump">
          <text>跳至</text>
          <input class="page-jump-input" v-model="jumpPage" type="number" @confirm="handleJump" />
          <text>页</text>
          <button class="btn-jump" @click="handleJump">GO</button>
        </view>
      </view>

      <!-- 上传弹窗 -->
      <view v-if="uploadVisible" class="popup-overlay" @click="closeUpload">
        <view class="popup-dialog" @click.stop>
          <text class="dialog-x" @click="closeUpload">×</text>
          <text class="dialog-title">上传教材</text>

          <view class="form-group">
            <text class="form-label">选择文件</text>
            <view class="file-type-row">
              <view
                v-for="ft in fileTypes"
                :key="ft.value"
                class="file-type-item"
                :class="{ active: selectedFileType === ft.value }"
                @click="selectedFileType = ft.value"
              >
                <text>{{ ft.label }}</text>
              </view>
            </view>
            <view class="file-picker" @click="pickFile">
              <text v-if="selectedFile" class="file-name">{{ selectedFile.name }}</text>
              <text v-else class="file-placeholder">点击选择文件 ({{ selectedFileType }})</text>
            </view>
          </view>

          <view class="form-group">
            <text class="form-label">所属教学班</text>
            <picker :range="classOptions" range-key="name" @change="onClassChange">
              <view class="file-picker">
                <text v-if="uploadClassId" class="file-name">{{ uploadClassName }}</text>
                <text v-else class="file-placeholder">请选择教学班（学生按教学班查看教材）</text>
              </view>
            </picker>
          </view>

          <view class="form-group">
            <text class="form-label">教材名称</text>
            <input class="form-input" v-model="uploadTitle" placeholder="请输入教材名称（可选）" @confirm="confirmUpload" />
          </view>
          <view class="form-group">
            <text class="form-label">分类</text>
            <input class="form-input" v-model="uploadCategory" placeholder="请输入分类（可选）" @confirm="confirmUpload" />
          </view>
          <view class="form-group">
            <text class="form-label">作者</text>
            <input class="form-input" v-model="uploadAuthor" placeholder="请输入作者（可选）" @confirm="confirmUpload" />
          </view>

          <view class="dialog-actions">
            <button class="btn-cancel" @click="closeUpload">取消</button>
            <button class="btn-confirm" :disabled="!selectedFile || uploading" @click="confirmUpload">
              {{ uploading ? '上传中...' : '确认上传' }}
            </button>
          </view>
        </view>
      </view>

      <!-- 绑定教学班弹窗（多对多，可多选） -->
      <view v-if="bindVisible" class="popup-overlay" @click="bindVisible = false">
        <view class="popup-dialog" @click.stop>
          <text class="dialog-x" @click="bindVisible = false">×</text>
          <text class="dialog-title">绑定教学班</text>
          <text class="bind-subject">教材：{{ bindTarget?.title }}</text>
          <view class="class-check-list">
            <view v-for="c in classes" :key="c.id" class="class-check-item" @click="toggleBindClass(c.id)">
              <view class="check-box" :class="{ checked: bindSelected.includes(c.id) }">
                <text v-if="bindSelected.includes(c.id)" class="check-mark">✓</text>
              </view>
              <text class="class-check-name">{{ c.name }}</text>
            </view>
            <text v-if="classes.length === 0" class="bind-empty">暂无可选教学班</text>
          </view>
          <view class="dialog-actions">
            <button class="btn-cancel" @click="bindVisible = false">取消</button>
            <button class="btn-confirm" @click="saveBind">保存绑定</button>
          </view>
        </view>
      </view>

      <!-- 进度条弹窗 -->
      <view v-if="progressVisible" class="popup-overlay">
        <view class="progress-dialog">
          <text class="progress-title">{{ progressTask?.type === 'upload' ? '教材解析进度' : '教材删除进度' }}</text>
          <text class="progress-subtitle">{{ progressTask?.title || '' }}</text>

          <view class="progress-bar-wrapper">
            <view class="progress-bar-bg">
              <view class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></view>
            </view>
            <text class="progress-text">{{ progressPercent }}%</text>
          </view>

          <view class="progress-info">
            <text class="progress-step">{{ progressTask?.currentStep || '处理中...' }}</text>
            <text class="progress-count" v-if="progressTask && progressTask.totalSteps > 0">
              {{ progressTask.completedSteps }} / {{ progressTask.totalSteps }} 页
            </text>
          </view>

          <view class="progress-stages">
            <view class="stage-item" :class="{ active: progressPercent > 0, done: progressPercent >= 10 }">
              <view class="stage-dot"></view>
              <text class="stage-label">云端存储</text>
            </view>
            <view class="stage-line" :class="{ active: progressPercent >= 10 }"></view>
            <view class="stage-item" :class="{ active: progressPercent >= 10, done: progressPercent >= 100 }">
              <view class="stage-dot"></view>
              <text class="stage-label">Elasticsearch</text>
            </view>
          </view>

          <view v-if="progressTask?.status === 'failed'" class="progress-error">
            <text>失败: {{ progressTask?.error }}</text>
          </view>
        </view>
      </view>
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow, onUnload } from '@dcloudio/uni-app'
import AppLayout from '@/components/layout/AppLayout.vue'
import {
  getTextbookPage,
  deleteTextbook,
  uploadTextbook,
  getTextbookStats,
  getTextbookProgress,
  bindTextbookClass,
  unbindTextbookClass,
  updateTextbookTitle,
  type TextbookInfo,
  type TextbookStats,
  type TaskProgress
} from '@/api/textbook'
import { getClassPage, type ClassInfo } from '@/api/class'

interface FileItem {
  path: string
  name: string
  file?: File
}

const list = ref<TextbookInfo[]>([])
const keyword = ref('')
const categoryFilter = ref('')
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const totalPages = ref(0)
const jumpPage = ref('')

const stats = ref<TextbookStats>({ textbookCount: 0, chunkCount: 0, totalPages: 0, searchCount: 0 })

const uploadVisible = ref(false)
const uploading = ref(false)
const selectedFile = ref<FileItem | null>(null)
const selectedFileType = ref('.pdf')
const uploadTitle = ref('')
const uploadCategory = ref('')
const uploadAuthor = ref('')
const uploadClassId = ref<number | null>(null)
const uploadClassName = ref('')

/** 教学班列表（教材按教学班绑定，学生按教学班查看） */
const classes = ref<ClassInfo[]>([])
const classOptions = computed(() => classes.value)

// 进度条相关
const progressVisible = ref(false)
const progressTask = ref<TaskProgress | null>(null)
const progressPercent = ref(0)
let progressTimer: ReturnType<typeof setInterval> | null = null

const fileTypes = [
  { label: 'PDF', value: '.pdf' },
  { label: 'Word', value: '.doc,.docx' },
  { label: 'PPT', value: '.ppt,.pptx' },
  { label: 'Excel', value: '.xls,.xlsx' },
  { label: 'TXT', value: '.txt' },
  { label: '全部', value: '' }
]

/** 教材 ID 完整展示，点击复制，便于课程/作业引用 */
function copyId(id: string) {
  if (!id) return
  uni.setClipboardData({
    data: id,
    success: () => uni.showToast({ title: '教材ID已复制', icon: 'none' })
  })
}

async function loadClasses() {
  if (classes.value.length > 0) return
  try {
    const res = await getClassPage({ pageNum: 1, pageSize: 100 })
    classes.value = res.list || []
  } catch { /* 教学班接口不可用时不阻塞上传 */ }
}

function onClassChange(event: any) {
  const item = classes.value[Number(event?.detail?.value)]
  if (!item) return
  uploadClassId.value = item.id
  uploadClassName.value = item.name
}

/** 绑定弹窗：多对多，勾选多个教学班 */
const bindVisible = ref(false)
const bindTarget = ref<TextbookInfo | null>(null)
const bindSelected = ref<number[]>([])

async function handleBind(t: TextbookInfo) {
  await loadClasses()
  if (classes.value.length === 0) {
    uni.showToast({ title: '暂无教学班可绑定', icon: 'none' })
    return
  }
  bindTarget.value = t
  const current = t.classIds && t.classIds.length > 0 ? t.classIds : (t.classId ? [t.classId] : [])
  bindSelected.value = [...current]
  bindVisible.value = true
}

function toggleBindClass(id: number) {
  const index = bindSelected.value.indexOf(id)
  if (index >= 0) {
    bindSelected.value.splice(index, 1)
  } else {
    bindSelected.value.push(id)
  }
}

async function saveBind() {
  const target = bindTarget.value
  if (!target) return
  const current = target.classIds && target.classIds.length > 0 ? target.classIds : (target.classId ? [target.classId] : [])
  const toAdd = bindSelected.value.filter((id) => !current.includes(id))
  const toRemove = current.filter((id) => !bindSelected.value.includes(id))
  try {
    for (const id of toAdd) {
      const cls = classes.value.find((c) => c.id === id)
      await bindTextbookClass(target.id, id, cls?.name)
    }
    for (const id of toRemove) {
      await unbindTextbookClass(target.id, id)
    }
    uni.showToast({ title: '绑定已保存', icon: 'none' })
    bindVisible.value = false
    fetchData()
  } catch {
    uni.showToast({ title: '保存绑定失败', icon: 'none' })
  }
}

/** 修改教材名称 */
function handleRename(t: TextbookInfo) {
  uni.showModal({
    title: '修改教材名称',
    editable: true,
    content: t.title,
    placeholderText: '请输入新的教材名称',
    success: async (res) => {
      if (!res.confirm) return
      const title = (res.content || '').trim()
      if (!title) {
        uni.showToast({ title: '名称不能为空', icon: 'none' })
        return
      }
      try {
        await updateTextbookTitle(t.id, title)
        uni.showToast({ title: '名称已更新', icon: 'none' })
        fetchData()
      } catch {
        uni.showToast({ title: '修改名称失败', icon: 'none' })
      }
    }
  })
}

function formatTime(time: string): string {
  if (!time) return '-'
  return time.substring(0, 10)
}

async function fetchData() {
  try {
    const res = await getTextbookPage({
      keyword: keyword.value || undefined,
      category: categoryFilter.value || undefined,
      page: pageNum.value,
      size: pageSize.value
    })
    list.value = res.list
    total.value = res.total
    totalPages.value = res.totalPages
    jumpPage.value = String(pageNum.value)
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

async function fetchStats() {
  try {
    stats.value = await getTextbookStats()
  } catch { /* ignore */ }
}

function handleSearch() {
  pageNum.value = 1
  fetchData()
}

function handleReset() {
  keyword.value = ''
  categoryFilter.value = ''
  pageNum.value = 1
  fetchData()
}

function goPage(p: number) {
  if (p < 1 || p > totalPages.value) return
  pageNum.value = p
  fetchData()
}

function handleJump() {
  const p = parseInt(jumpPage.value)
  if (isNaN(p) || p < 1 || p > totalPages.value) {
    uni.showToast({ title: '请输入有效页码', icon: 'none' })
    return
  }
  goPage(p)
}

function handleUpload() {
  uploadVisible.value = true
  selectedFile.value = null
  uploadTitle.value = ''
  uploadCategory.value = ''
  uploadAuthor.value = ''
  uploadClassId.value = null
  uploadClassName.value = ''
  loadClasses()
}

function closeUpload() {
  uploadVisible.value = false
}

function pickFile() {
  const ext = selectedFileType.value
  // #ifdef H5
  const input = document.createElement('input')
  input.type = 'file'
  if (ext) {
    input.accept = ext
  }
  input.onchange = (e: Event) => {
    const target = e.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
      const file = target.files[0]
      selectedFile.value = {
        path: URL.createObjectURL(file),
        name: file.name,
        file: file
      }
    }
  }
  input.click()
  // #endif
  // #ifndef H5
  uni.chooseFile({
    count: 1,
    extension: ext ? ext.split(',') : undefined,
    success: (res) => {
      selectedFile.value = {
        path: res.tempFiles[0].path,
        name: res.tempFiles[0].name
      }
    }
  })
  // #endif
}

async function confirmUpload() {
  if (!selectedFile.value) return
  if (!uploadClassId.value) {
    uni.showToast({ title: '请先选择所属教学班', icon: 'none' })
    return
  }
  uploading.value = true
  try {
    const fileName = selectedFile.value.name
    const title = uploadTitle.value || fileName.replace(/\.[^.]+$/, '')
    const result = await uploadTextbook(
      selectedFile.value.path,
      title,
      uploadCategory.value,
      uploadAuthor.value,
      selectedFile.value.file,
      uploadClassId.value,
      uploadClassName.value
    )
    uni.showToast({ title: '上传成功，正在后台解析...', icon: 'success' })
    closeUpload()
    fetchData()
    fetchStats()
    // 开始轮询上传进度
    if (result.taskId) {
      startPolling(result.taskId, 'upload')
    }
  } catch {
    uni.showToast({ title: '上传失败', icon: 'none' })
  } finally {
    uploading.value = false
  }
}

/** 开始轮询进度 */
function startPolling(taskId: string, type: string) {
  progressVisible.value = true
  progressTask.value = {
    taskId,
    type,
    textbookId: '',
    title: type === 'upload' ? (uploadTitle.value || '教材') : '',
    totalSteps: 0,
    completedSteps: 0,
    currentStep: '正在连接...',
    status: 'processing',
    error: ''
  }
  progressPercent.value = 0

  // 清除旧定时器
  if (progressTimer) clearInterval(progressTimer)

  progressTimer = setInterval(async () => {
    try {
      const p = await getTextbookProgress(taskId)
      progressTask.value = p
      if (p.totalSteps > 0) {
        progressPercent.value = Math.round((p.completedSteps / p.totalSteps) * 100)
      }
      if (p.status === 'completed') {
        clearInterval(progressTimer!)
        progressTimer = null
        progressPercent.value = 100
        uni.showToast({ title: type === 'upload' ? '教材解析完成' : '教材删除完成', icon: 'success' })
        fetchData()
        fetchStats()
        // 延迟关闭进度条
        setTimeout(() => { progressVisible.value = false }, 2000)
      } else if (p.status === 'failed') {
        clearInterval(progressTimer!)
        progressTimer = null
        uni.showToast({ title: '操作失败: ' + (p.error || '未知错误'), icon: 'none' })
        setTimeout(() => { progressVisible.value = false }, 3000)
      }
    } catch {
      // 进度查询失败，可能是任务已完成并清理
      clearInterval(progressTimer!)
      progressTimer = null
      progressVisible.value = false
    }
  }, 500)
}

async function handleDelete(id: string) {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除该教材吗？删除后将同时清除云端文件和Elasticsearch切片。',
    success: async (res) => {
      if (res.confirm) {
        try {
          const result = await deleteTextbook(id)
          uni.showToast({ title: '删除已启动，正在后台处理...', icon: 'success' })
          // 开始轮询删除进度
          if (result.taskId) {
            progressTask.value = {
              taskId: result.taskId,
              type: 'delete',
              textbookId: result.textbookId,
              title: result.title,
              totalSteps: 0,
              completedSteps: 0,
              currentStep: '正在删除...',
              status: 'processing',
              error: ''
            }
            startPolling(result.taskId, 'delete')
          }
        } catch {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}

// 清理定时器
onUnload(() => {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
})

onShow(() => {
  fetchData()
  fetchStats()
})
</script>

<style scoped>
/* =========================================================
   教材管理 · 教育档案室
   ========================================================= */
.page-container {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ========== 页面头部 ========== */
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.header-kicker {
  font-size: 9px;
  letter-spacing: 0.28em;
  color: var(--accent);
}

.page-title-sm {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0.03em;
  color: var(--ink);
}

.header-sub {
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--muted);
}

/* ========== 按钮 ========== */
.btn-upload,
.btn-search,
.btn-reset,
.btn-cancel,
.btn-confirm,
.btn-jump {
  height: 38px;
  line-height: 36px;
  padding: 0 16px;
  border-radius: 10px;
  font-size: 12.5px;
  letter-spacing: 0.04em;
  box-sizing: border-box;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.18s ease;
}

.btn-upload { background: var(--ink); color: #F8F3E8; }
.btn-upload:hover { background: #24334F; transform: translateY(-1px); }

.btn-search { background: var(--ink); color: #F8F3E8; }
.btn-search:hover { background: #24334F; }

.btn-reset {
  background: transparent;
  color: var(--ink-2);
  border-color: var(--line);
}
.btn-reset:hover { border-color: var(--line-strong); background: var(--surface-raised); }

/* ========== 统计带 ========== */
.stats-row {
  display: flex;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
}

.stat-card {
  flex: 1;
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-start;
  gap: 8px;
  padding: 18px 22px;
  border-right: 1px solid var(--line);
}

.stat-card:last-child { border-right: none; }

.stat-num {
  font-family: var(--font-display);
  font-size: 28px;
  line-height: 1;
  letter-spacing: -0.01em;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 10.5px;
  letter-spacing: 0.14em;
  color: var(--muted);
}

/* ========== 搜索栏 ========== */
.search-bar {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 14px 16px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
}

.search-input {
  flex: 1;
  height: 38px;
  padding: 0 12px;
  font-size: 13px;
  color: var(--ink);
  background: var(--surface-raised);
  border: 1px solid var(--line);
  border-radius: 10px;
  box-sizing: border-box;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.search-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(180, 83, 42, 0.10);
}

.category-input {
  max-width: 140px;
  flex: none;
}

/* ========== 表格 ========== */
.table-wrapper {
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
  background: var(--surface);
  border-bottom: 1px solid var(--line);
}

.th {
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.14em;
  color: var(--muted);
}

.table-row {
  display: flex;
  align-items: center;
  padding: 13px 18px;
  font-size: 13px;
  color: var(--ink-2);
  background: var(--surface-raised);
  border-bottom: 1px solid var(--line);
  transition: background 0.18s ease, box-shadow 0.18s ease;
}

.table-row:hover {
  background: #FFFCF5;
  box-shadow: inset 0 0 0 1px var(--line-strong);
}

.table-row:last-child { border-bottom: none; }

.th,
.td { display: flex; align-items: center; }

.mono-cell {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.02em;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 教材ID 完整展示，过长时换行而不是截断 */
.id-cell {
  white-space: normal;
  word-break: break-all;
  line-height: 1.4;
  cursor: pointer;
  user-select: all;
}

.id-cell:hover { color: var(--accent-ink); }

.cell-sub {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.02em;
  color: var(--muted);
}

.action-link {
  color: var(--info);
  font-size: 12px;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: color 0.16s ease;
}

.action-link:hover { color: var(--accent-ink); }
.action-link.danger { color: var(--danger); }

/* ========== 空状态 ========== */
.empty-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin: 18px;
  padding: 42px 16px;
  border: 1px dashed var(--line-strong);
  border-radius: 12px;
}

.empty-text {
  font-size: 13px;
  letter-spacing: 0.04em;
  color: var(--ink-2);
}

.empty-caption {
  font-size: 9px;
  letter-spacing: 0.24em;
  color: var(--muted);
}

/* ========== 分页 ========== */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 14px 18px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
}

.page-total {
  font-family: var(--font-display);
  font-size: 12.5px;
  letter-spacing: 0.04em;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.page-btn {
  height: 32px;
  line-height: 30px;
  padding: 0 12px;
  font-size: 12px;
  color: var(--ink-2);
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 8px;
  transition: all 0.16s ease;
}

.page-btn:hover:not([disabled]) {
  border-color: var(--accent);
  color: var(--accent-ink);
}

.page-btn[disabled] {
  opacity: 0.35;
  cursor: not-allowed;
}

.page-info {
  padding: 0 4px;
  font-family: var(--font-display);
  font-size: 13px;
  color: var(--ink);
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
}

.page-jump {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  letter-spacing: 0.04em;
  color: var(--muted);
}

.page-jump-input {
  width: 48px;
  height: 30px;
  text-align: center;
  font-size: 12px;
  color: var(--ink);
  background: var(--surface-raised);
  border: 1px solid var(--line);
  border-radius: 8px;
  transition: border-color 0.16s ease;
}

.page-jump-input:focus { border-color: var(--accent); }

.btn-jump {
  height: 30px;
  line-height: 28px;
  padding: 0 12px;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: #F8F3E8;
  background: var(--ink);
  border: none;
  border-radius: 8px;
}

/* ========== 弹窗 ========== */
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20px;
  background: rgba(23, 35, 59, 0.42);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.popup-dialog,
.progress-dialog {
  width: 90%;
  max-width: 460px;
  max-height: 82vh;
  overflow-y: auto;
  padding: 26px 24px;
  background: var(--surface);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-lg);
  box-shadow: 0 24px 60px -30px rgba(23, 35, 59, 0.6);
  animation: dialogIn 0.18s ease both;
}

@keyframes dialogIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.dialog-title {
  display: block;
  padding-bottom: 14px;
  margin-bottom: 18px;
  font-family: var(--font-display);
  font-size: 19px;
  letter-spacing: 0.03em;
  color: var(--ink);
  text-align: center;
  border-bottom: 1px solid var(--line);
}

.form-group { margin-bottom: 14px; }

.bind-subject {
  display: block;
  margin-bottom: 12px;
  font-size: 12.5px;
  color: var(--ink-2);
}

.class-check-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
}

.class-check-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface-raised);
  cursor: pointer;
}

.check-box {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line-strong);
  border-radius: 5px;
  background: var(--surface);
}

.check-box.checked {
  border-color: var(--accent);
  background: var(--accent);
}

.check-mark { font-size: 11px; color: #F8F3E8; }

.class-check-name { font-size: 13px; color: var(--ink); }

.bind-empty { font-size: 12px; color: var(--muted); padding: 10px 0; }

.form-label {
  display: block;
  margin-bottom: 7px;
  font-size: 10.5px;
  letter-spacing: 0.14em;
  color: var(--muted);
}

.form-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  font-size: 13.5px;
  color: var(--ink);
  background: var(--surface-raised);
  border: 1px solid var(--line);
  border-radius: 10px;
  box-sizing: border-box;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.form-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(180, 83, 42, 0.10);
}

.file-type-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.file-type-item {
  padding: 5px 13px;
  font-size: 11.5px;
  letter-spacing: 0.06em;
  color: var(--ink-2);
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.file-type-item:hover {
  border-color: var(--line-strong);
  background: var(--surface-raised);
}

.file-type-item.active {
  color: var(--accent-ink);
  background: var(--accent-soft);
  border-color: var(--accent);
}

.file-picker {
  width: 100%;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  cursor: pointer;
  background: transparent;
  border: 1px dashed var(--line-strong);
  border-radius: 10px;
  transition: border-color 0.18s ease, background 0.18s ease;
}

.file-picker:hover {
  border-color: var(--accent);
  background: rgba(180, 83, 42, 0.04);
}

.file-name {
  font-size: 12.5px;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-placeholder {
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--muted);
}

.dialog-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.btn-cancel {
  background: transparent;
  color: var(--ink-2);
  border: 1px solid var(--line-strong);
}
.btn-cancel:hover { background: var(--surface-raised); border-color: var(--accent); color: var(--accent-ink); }

.btn-confirm {
  background: var(--ink);
  color: #F8F3E8;
  border: 1px solid var(--ink);
}
.btn-confirm:hover { background: #24334F; }
.btn-confirm[disabled] { opacity: 0.4; cursor: not-allowed; }

/* ========== 进度弹窗 ========== */
.progress-dialog {
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.progress-title {
  font-family: var(--font-display);
  font-size: 19px;
  letter-spacing: 0.03em;
  color: var(--ink);
}

.progress-subtitle {
  max-width: 100%;
  font-size: 12px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.progress-bar-bg {
  flex: 1;
  height: 6px;
  background: var(--paper-deep);
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.progress-text {
  min-width: 42px;
  text-align: right;
  font-family: var(--font-display);
  font-size: 14px;
  letter-spacing: 0.02em;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
}

.progress-step {
  font-size: 12px;
  color: var(--ink-2);
}

.progress-count {
  font-size: 11.5px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.progress-stages {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.stage-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  opacity: 0.4;
}

.stage-item.active { opacity: 1; }

.stage-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid var(--line-strong);
  background: var(--surface);
}

.stage-item.active .stage-dot {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.stage-item.done .stage-dot {
  border-color: var(--success);
  background: var(--success);
}

.stage-label {
  font-size: 10.5px;
  letter-spacing: 0.06em;
  color: var(--muted);
}

.stage-line {
  width: 60px;
  height: 1px;
  margin: 0 8px 18px;
  background: var(--line);
}

.stage-line.active { background: var(--success); }

.progress-error {
  width: 100%;
  padding: 10px 12px;
  background: #F5E4E0;
  border: 1px solid rgba(163, 59, 46, 0.24);
  border-radius: 10px;
}

.progress-error text {
  font-size: 12px;
  line-height: 1.7;
  color: var(--danger);
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .page-container { gap: 12px; }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    padding-bottom: 14px;
  }

  .page-title-sm { font-size: 20px; }

  .header-actions { width: 100%; }
  .btn-upload { width: 100%; }

  .stats-row { flex-direction: column; }

  .stat-card {
    border-right: none;
    border-bottom: 1px solid var(--line);
    padding: 14px 16px;
  }

  .stat-card:last-child { border-bottom: none; }
  .stat-num { font-size: 24px; }

  .search-bar { flex-wrap: wrap; padding: 12px; }

  .search-input { flex-basis: 100%; }
  .category-input { max-width: none; }
  .btn-search,
  .btn-reset { flex: 1; }

  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .table-header,
  .table-row { min-width: 1060px; }

  .pagination {
    flex-direction: column;
    align-items: stretch;
    padding: 12px;
  }

  .pagination-controls { justify-content: space-between; }
  .page-jump { justify-content: flex-end; }

  .popup-dialog,
  .progress-dialog { padding: 22px 18px; }
}
</style>