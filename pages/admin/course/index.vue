<!-- pages/admin/course/index.vue - 课程管理 -->
<template>
  <AppLayout>
    <view class="page-container">
      <view class="page-header">
        <view class="header-left">
          <text class="header-kicker">COURSE CATALOGUE</text>
          <text class="page-title-sm">课程管理</text>
          <text class="header-sub">课程 · 教材 · 教学班关联</text>
        </view>
        <button class="btn-add" @click="handleAdd">+ 创建课程</button>
      </view>

      <!-- 搜索栏 -->
      <view class="search-bar">
        <input
          class="search-input"
          v-model="keyword"
          placeholder="搜索课程名称"
          @confirm="handleSearch"
        />
        <button class="btn-search" @click="handleSearch">查询</button>
        <button class="btn-reset" @click="handleReset">重置</button>
      </view>

      <!-- 表格 -->
      <view class="table-wrapper">
        <view class="table-header">
          <text class="th" style="width:60px">ID</text>
          <text class="th" style="flex:1">课程名称</text>
          <text class="th" style="width:120px">负责人</text>
          <text class="th" style="width:70px">状态</text>
          <text class="th" style="width:100px">创建时间</text>
          <text class="th" style="width:100px">更新时间</text>
          <text class="th" style="width:140px">操作</text>
        </view>
        <view v-for="c in list" :key="c.id" class="table-row">
          <text class="td" style="width:60px">{{ c.id }}</text>
          <text class="td" style="flex:1">{{ c.name }}</text>
          <text class="td" style="width:120px">{{ getCreaterName(c.createrId) }}</text>
          <view class="td" style="width:70px">
            <text class="status-pill" :class="c.status === 'approved' ? 'pill-success' : c.status === 'pending' ? 'pill-warning' : 'pill-neutral'">
              {{ c.status === 'approved' ? '已通过' : c.status === 'pending' ? '待审核' : '草稿' }}
            </text>
          </view>
          <text class="td cell-sub" style="width:100px">{{ formatTime(c.createTime) }}</text>
          <text class="td cell-sub" style="width:100px">{{ formatTime(c.updateTime) }}</text>
          <view class="td action-cell" style="width:140px; gap:8px; display:flex">
            <text class="action-link" @click="handleDetail(c)">详情</text>
            <text v-if="c.status === 'pending' || c.status === 'draft'" class="action-link success" @click="handleApprove(c.id)">通过</text>
            <text class="action-link" @click="handleEdit(c)">编辑</text>
            <text class="action-link danger" @click="handleDelete(c.id)">删除</text>
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

      <!-- 创建/编辑弹窗 -->
      <view v-if="formVisible" class="popup-overlay" @click="closeForm">
        <view class="form-dialog" @click.stop>
          <text class="dialog-x" @click="closeForm">×</text>
          <text class="form-title">{{ isEdit ? '编辑课程' : '创建课程' }}</text>
          <input class="form-input" v-model="form.name" placeholder="课程名称" @confirm="submitForm" />
          <input class="form-input" v-model="form.description" placeholder="课程描述" @confirm="submitForm" />
          <input v-if="isEdit" class="form-input" v-model="form.createrId" type="number" placeholder="负责人ID（可选）" @confirm="submitForm" />
          <view class="form-actions">
            <button class="btn-cancel" @click="closeForm">取消</button>
            <button class="btn-confirm" @click="submitForm">确定</button>
          </view>
        </view>
      </view>

      <!-- 课程详情弹窗 -->
      <view v-if="detailVisible" class="popup-overlay" @click="closeDetail">
        <view class="detail-dialog" @click.stop>
          <text class="dialog-x" @click="closeDetail">×</text>
          <text class="form-title">课程详情</text>
          <view class="detail-section">
            <text class="detail-label">课程名称</text>
            <text class="detail-value">{{ detailCourse?.name }}</text>
          </view>
          <view class="detail-section">
            <text class="detail-label">课程描述</text>
            <text class="detail-value">{{ detailCourse?.description || '-' }}</text>
          </view>
          <view class="detail-section">
            <text class="detail-label">负责人</text>
            <text class="detail-value">{{ getCreaterName(detailCourse?.createrId ?? null) }}</text>
          </view>
          <view class="detail-section">
            <text class="detail-label">状态</text>
            <view class="detail-value">
              <text class="status-pill" :class="detailCourse?.status === 'approved' ? 'pill-success' : detailCourse?.status === 'pending' ? 'pill-warning' : 'pill-neutral'">
                {{ detailCourse?.status === 'approved' ? '已通过' : detailCourse?.status === 'pending' ? '待审核' : '草稿' }}
              </text>
            </view>
          </view>
          <view class="detail-section">
            <text class="detail-label">绑定教学班</text>
            <view class="detail-tags">
              <text v-for="cl in detailClasses" :key="cl.id" class="detail-tag">{{ cl.className }}</text>
              <text v-if="detailClasses.length === 0" class="detail-value">暂无</text>
            </view>
          </view>
          <!-- 分配教学班 -->
          <view class="detail-section add-class-section">
            <text class="detail-label">添加教学班</text>
            <view class="add-student-row">
              <input class="form-input" v-model="addClassIdInput" placeholder="输入教学班ID" type="number" style="flex:1; margin-bottom:0" />
              <button class="btn-confirm" @click="handleAddClass" style="padding:8px 14px; font-size:12px">添加</button>
            </view>
          </view>
          <view class="form-actions">
            <button class="btn-cancel" @click="closeDetail">关闭</button>
          </view>
        </view>
      </view>
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AppLayout from '@/components/layout/AppLayout.vue'
import { getCoursePage, createCourse, updateCourse, deleteCourse, approveCourse, preCheckDeleteCourse, getCourseClasses, addCourseClass, removeCourseClass, type CourseInfo, type CourseClass } from '@/api/course'
import { getClassPage, type ClassInfo } from '@/api/class'
import { getUserById } from '@/api/user'

const list = ref<CourseInfo[]>([])
const createrNames = ref<Record<number, string>>({})
const keyword = ref('')
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const totalPages = ref(0)
const jumpPage = ref('')

const formVisible = ref(false)
const isEdit = ref(false)
const form = ref<Partial<CourseInfo>>({})

const detailVisible = ref(false)
const detailCourse = ref<CourseInfo | null>(null)
const detailClasses = ref<CourseClass[]>([])
const addClassIdInput = ref('')

function formatTime(time: string): string {
  if (!time) return '-'
  return time.substring(0, 10)
}

async function fetchData() {
  try {
    const res = await getCoursePage({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined
    })
    list.value = res.list
    total.value = res.total
    totalPages.value = res.totalPages
    jumpPage.value = String(pageNum.value)
    // 加载负责人姓名
    loadCreaterNames(res.list)
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

async function loadCreaterNames(courses: CourseInfo[]) {
  const ids = [...new Set(courses.map(c => c.createrId).filter((id): id is number => id != null))]
  for (const id of ids) {
    if (createrNames.value[id]) continue
    try {
      const user = await getUserById(id)
      createrNames.value[id] = user.name || user.username
    } catch {
      createrNames.value[id] = String(id)
    }
  }
}

function getCreaterName(createrId: number | null): string {
  if (createrId == null) return '-'
  return createrNames.value[createrId] || String(createrId)
}

function handleSearch() {
  pageNum.value = 1
  fetchData()
}

function handleReset() {
  keyword.value = ''
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

async function handleApprove(id: number) {
  try {
    await approveCourse(id)
    uni.showToast({ title: '审核通过', icon: 'success' })
    fetchData()
  } catch {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

function handleAdd() {
  isEdit.value = false
  form.value = { name: '', description: '' }
  formVisible.value = true
}

function handleEdit(c: CourseInfo) {
  isEdit.value = true
  form.value = { ...c }
  formVisible.value = true
}

function closeForm() {
  formVisible.value = false
}

async function handleDetail(c: CourseInfo) {
  detailCourse.value = c
  detailVisible.value = true
  addClassIdInput.value = ''
  try {
    detailClasses.value = await getCourseClasses(c.id)
  } catch {
    detailClasses.value = []
  }
}

function closeDetail() {
  detailVisible.value = false
  detailCourse.value = null
  detailClasses.value = []
}

async function handleAddClass() {
  const classId = parseInt(addClassIdInput.value)
  if (isNaN(classId)) {
    uni.showToast({ title: '请输入有效教学班ID', icon: 'none' })
    return
  }
  if (!detailCourse.value) return
  try {
    // 从教学班列表获取名称
    let className = String(classId)
    try {
      const res = await getClassPage({ pageNum: 1, pageSize: 200 })
      const found = res.list.find((cl: ClassInfo) => cl.id === classId)
      if (found) className = found.name
    } catch {
      // ignore
    }
    await addCourseClass(detailCourse.value.id, classId, className)
    uni.showToast({ title: '添加成功', icon: 'success' })
    addClassIdInput.value = ''
    detailClasses.value = await getCourseClasses(detailCourse.value.id)
  } catch {
    uni.showToast({ title: '添加失败', icon: 'none' })
  }
}

async function handleRemoveClass(classId: number) {
  if (!detailCourse.value) return
  try {
    await removeCourseClass(detailCourse.value.id, classId)
    uni.showToast({ title: '移除成功', icon: 'success' })
    detailClasses.value = await getCourseClasses(detailCourse.value.id)
  } catch {
    uni.showToast({ title: '移除失败', icon: 'none' })
  }
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
      if (form.value.createrId !== undefined) updateData.createrId = form.value.createrId
      await updateCourse(form.value.id, updateData as Partial<CourseInfo>)
      uni.showToast({ title: '更新成功', icon: 'success' })
    } else {
      await createCourse({
        name: form.value.name,
        description: form.value.description || ''
      })
      uni.showToast({ title: '创建成功', icon: 'success' })
    }
    closeForm()
    fetchData()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '操作失败'
    uni.showToast({ title: msg, icon: 'none' })
  }
}

async function handleDelete(id: number) {
  try {
    const check = await preCheckDeleteCourse(id)
    if (!check.canDelete) {
      const msg = check.blockers.join('\n')
      uni.showModal({
        title: '无法删除',
        content: `「${check.courseName}」${msg}`,
        showCancel: false
      })
      return
    }
    uni.showModal({
      title: '确认删除',
      content: `确定要删除课程「${check.courseName}」吗？相关的${check.chapterCount}个章节将被清除。`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteCourse(id)
            uni.showToast({ title: '删除成功', icon: 'success' })
            fetchData()
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : '删除失败'
            uni.showToast({ title: msg, icon: 'none' })
          }
        }
      }
    })
  } catch {
    uni.showToast({ title: '检查失败，请重试', icon: 'none' })
  }
}

onShow(() => {
  fetchData()
})
</script>

<style scoped>
/* =========================================================
   课程管理 · 教育档案室
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
.btn-add,
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

.btn-add { background: var(--ink); color: #F8F3E8; }
.btn-add:hover { background: #24334F; transform: translateY(-1px); }

.btn-search { background: var(--ink); color: #F8F3E8; }
.btn-search:hover { background: #24334F; }

.btn-reset {
  background: transparent;
  color: var(--ink-2);
  border-color: var(--line);
}
.btn-reset:hover { border-color: var(--line-strong); background: var(--surface-raised); }

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

.cell-sub {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.02em;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.status-pill::before {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.72;
}

.pill-success { background: #E7EFE8; color: var(--success); }
.pill-warning { background: #F7ECD9; color: var(--warning); }
.pill-neutral { background: var(--paper-deep); color: var(--muted); }

.action-link {
  color: var(--info);
  font-size: 12px;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: color 0.16s ease;
}

.action-link:hover { color: var(--accent-ink); }
.action-link.danger { color: var(--danger); }
.action-link.success { color: var(--success); }

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

.form-dialog,
.detail-dialog {
  width: 380px;
  max-width: 100%;
  max-height: 80vh;
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

.form-title {
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

.form-input {
  width: 100%;
  height: 42px;
  padding: 0 12px;
  margin-bottom: 12px;
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

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 16px;
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

/* ========== 详情弹窗 ========== */
.detail-section {
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px dashed var(--line);
}

.detail-section:last-of-type { border-bottom: none; margin-bottom: 4px; }

.detail-label {
  display: block;
  margin-bottom: 5px;
  font-size: 10.5px;
  letter-spacing: 0.14em;
  color: var(--muted);
}

.detail-value {
  display: block;
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--ink-2);
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}

.detail-tag {
  padding: 3px 10px;
  font-size: 11.5px;
  letter-spacing: 0.04em;
  color: var(--accent-ink);
  background: var(--accent-soft);
  border-radius: 999px;
}

.add-class-section {
  padding-top: 14px;
  border-top: 1px solid var(--line);
  border-bottom: none;
}

.add-student-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 4px;
}

.add-student-row .form-input {
  margin-bottom: 0;
}

.add-student-row .btn-confirm {
  height: 42px;
  line-height: 40px;
  padding: 0 16px;
  font-size: 12px;
  flex-shrink: 0;
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

  .btn-add { width: 100%; }

  .search-bar { flex-wrap: wrap; padding: 12px; }
  .search-input { flex-basis: 100%; }
  .btn-search,
  .btn-reset { flex: 1; }

  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .table-header,
  .table-row { min-width: 950px; }

  .pagination {
    flex-direction: column;
    align-items: stretch;
    padding: 12px;
  }

  .pagination-controls { justify-content: space-between; }
  .page-jump { justify-content: flex-end; }

  .form-dialog,
  .detail-dialog {
    width: 100%;
    padding: 22px 18px;
  }

  .form-title { font-size: 17px; }
}
</style>