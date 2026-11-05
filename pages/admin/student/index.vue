<!-- pages/admin/student/index.vue - 学生管理 -->
<template>
  <AppLayout>
    <view class="page-container">
      <view class="page-header">
        <view class="header-left">
          <text class="header-kicker">STUDENT REGISTER</text>
          <text class="page-title-sm">学生管理</text>
          <text class="header-sub">学生档案 · 账号状态维护</text>
        </view>
        <view class="header-actions">
          <button class="btn-import" @click="handleBatchImport">批量导入</button>
          <button class="btn-add" @click="handleAdd">+ 添加学生</button>
        </view>
      </view>

      <!-- 搜索栏 -->
      <view class="search-bar">
        <input
          class="search-input"
          v-model="keyword"
          placeholder="搜索用户名/姓名/手机号"
          @confirm="handleSearch"
        />
        <picker
          class="filter-picker"
          :value="statusIndex"
          :range="statusOptions"
          range-key="label"
          @change="handleStatusChange"
        >
          <view class="picker-display">{{ statusLabel }}</view>
        </picker>
        <button class="btn-search" @click="handleSearch">查询</button>
        <button class="btn-reset" @click="handleReset">重置</button>
      </view>

      <!-- 表格 -->
      <view class="table-wrapper">
        <view class="table-header">
          <text class="th" style="width:60px">ID</text>
          <text class="th" style="width:80px">姓名</text>
          <text class="th" style="flex:1">用户名</text>
          <text class="th" style="width:130px">手机号</text>
          <text class="th" style="width:60px">状态</text>
          <text class="th" style="width:100px">创建时间</text>
          <text class="th" style="width:100px">更新时间</text>
          <text class="th" style="width:120px">操作</text>
        </view>
        <view v-for="s in list" :key="s.id" class="table-row">
          <text class="td" style="width:60px">{{ s.id }}</text>
          <text class="td" style="width:80px">{{ s.name || '-' }}</text>
          <text class="td" style="flex:1">{{ s.username }}</text>
          <text class="td" style="width:130px">{{ s.number }}</text>
          <view class="td" style="width:60px">
            <text class="status-pill" :class="s.status === 1 ? 'pill-success' : 'pill-danger'">
              {{ s.status === 1 ? '正常' : '禁用' }}
            </text>
          </view>
          <text class="td cell-sub" style="width:100px">{{ formatTime(s.createTime) }}</text>
          <text class="td cell-sub" style="width:100px">{{ formatTime(s.updateTime) }}</text>
          <view class="td action-cell" style="width:120px; gap:8px; display:flex">
            <text class="action-link" @click="handleEdit(s)">编辑</text>
            <text
              class="action-link"
              :class="s.status === 1 ? 'danger' : 'success'"
              @click="handleToggleStatus(s)"
            >{{ s.status === 1 ? '禁用' : '启用' }}</text>
          </view>
        </view>
        <view v-if="list.length === 0" class="empty-row">
          <text class="empty-text">暂无数据</text>
          <text class="empty-caption">NO RECORDS</text>
        </view>
      </view>

      <!-- 分页 -->
      <view class="pagination">
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
    </view>

    <!-- 添加/编辑弹窗 -->
    <view v-if="formVisible" class="popup-overlay" @click="closeForm">
      <view class="form-dialog" @click.stop>
        <text class="dialog-x" @click="closeForm">×</text>
        <text class="form-title">{{ isEdit ? '编辑学生' : '添加学生' }}</text>
        <input class="form-input" v-model="form.username" placeholder="用户名（学号）" @confirm="submitForm" />
        <input class="form-input" v-model="form.name" placeholder="姓名" @confirm="submitForm" />
        <input class="form-input" v-model="form.number" placeholder="手机号" @confirm="submitForm" />
        <input class="form-input" v-model="form.password" type="password" placeholder="密码（留空则不修改）" @confirm="submitForm" />
        <view class="form-actions">
          <button class="btn-cancel" @click="closeForm">取消</button>
          <button class="btn-confirm" @click="submitForm">确定</button>
        </view>
      </view>
    </view>

    <!-- 批量导入弹窗 -->
    <view v-if="importVisible" class="popup-overlay" @click="closeImport">
      <view class="form-dialog import-dialog" @click.stop>
        <text class="dialog-x" @click="closeImport">×</text>
        <text class="form-title">批量导入学生</text>
        <text class="import-hint">每行一个学生，格式：用户名,姓名,手机号,密码</text>
        <textarea
          class="import-textarea"
          v-model="importText"
          placeholder="例：&#10;student001,张三,13800000001,123456&#10;student002,李四,13800000002,123456"
        />
        <view class="form-actions">
          <button class="btn-cancel" @click="closeImport">取消</button>
          <button class="btn-confirm" @click="submitImport">导入</button>
        </view>
      </view>
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AppLayout from '@/components/layout/AppLayout.vue'
import { getStudentPage, addUser, updateUser, batchImportUsers, disableUser, enableUser, type User } from '@/api/user'

const list = ref<User[]>([])
const keyword = ref('')
const statusFilter = ref<number | undefined>(undefined)
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const totalPages = ref(0)
const jumpPage = ref('')

// 状态筛选
const statusOptions = [
  { label: '全部状态', value: undefined },
  { label: '正常', value: 1 },
  { label: '禁用', value: 0 }
]
const statusIndex = ref(0)
const statusLabel = computed(() => statusOptions[statusIndex.value].label)

function handleStatusChange(e: { detail: { value: number } }) {
  statusIndex.value = e.detail.value
  statusFilter.value = statusOptions[e.detail.value].value
}

// 表单
const formVisible = ref(false)
const importVisible = ref(false)
const isEdit = ref(false)
const form = ref<Partial<User>>({})
const importText = ref('')

function formatTime(time: string): string {
  if (!time) return '-'
  return time.substring(0, 10)
}

async function fetchData() {
  try {
    const res = await getStudentPage({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
      status: statusFilter.value
    })
    list.value = res.list
    total.value = res.total
    totalPages.value = res.totalPages
    jumpPage.value = String(pageNum.value)
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

function handleSearch() {
  pageNum.value = 1
  fetchData()
}

function handleReset() {
  keyword.value = ''
  statusFilter.value = undefined
  statusIndex.value = 0
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

function handleAdd() {
  isEdit.value = false
  form.value = { username: '', name: '', number: '', password: '' }
  formVisible.value = true
}

function handleEdit(s: User) {
  isEdit.value = true
  form.value = { ...s, password: '' }
  formVisible.value = true
}

function closeForm() {
  formVisible.value = false
}

async function submitForm() {
  if (!form.value.username?.trim()) {
    uni.showToast({ title: '请输入用户名', icon: 'none' })
    return
  }
  if (!isEdit.value && !form.value.password?.trim()) {
    uni.showToast({ title: '请输入初始密码', icon: 'none' })
    return
  }
  try {
    if (isEdit.value) {
      await updateUser(form.value)
      uni.showToast({ title: '更新成功', icon: 'success' })
    } else {
      await addUser({ ...form.value, type: 3, status: 1 })
      uni.showToast({ title: '添加成功', icon: 'success' })
    }
    closeForm()
    fetchData()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '操作失败'
    uni.showToast({ title: msg, icon: 'none' })
  }
}

async function handleToggleStatus(s: User) {
  const action = s.status === 1 ? '禁用' : '启用'
  try {
    if (s.status === 1) {
      await disableUser(s.id)
    } else {
      await enableUser(s.id)
    }
    uni.showToast({ title: `${action}成功`, icon: 'success' })
    fetchData()
  } catch {
    uni.showToast({ title: `${action}失败`, icon: 'none' })
  }
}

function handleBatchImport() {
  importText.value = ''
  importVisible.value = true
}

function closeImport() {
  importVisible.value = false
}

async function submitImport() {
  const text = importText.value.trim()
  if (!text) {
    uni.showToast({ title: '请输入学生信息', icon: 'none' })
    return
  }
  const lines = text.split('\n').filter((l) => l.trim())
  const users: Partial<User>[] = []
  for (const line of lines) {
    const parts = line.split(',').map((p) => p.trim())
    if (parts.length >= 2) {
      users.push({
        username: parts[0],
        name: parts[1] || '',
        number: parts[2] || '',
        password: parts[3] || '123456',
        type: 3,
        status: 1
      })
    }
  }
  if (users.length === 0) {
    uni.showToast({ title: '未解析到有效数据', icon: 'none' })
    return
  }
  try {
    const count = await batchImportUsers(users)
    uni.showToast({ title: `成功导入 ${count} 个学生`, icon: 'success' })
    closeImport()
    fetchData()
  } catch {
    uni.showToast({ title: '导入失败', icon: 'none' })
  }
}

onShow(() => {
  fetchData()
})
</script>

<style scoped>
/* =========================================================
   学生管理 · 教育档案室
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ========== 按钮 ========== */
.btn-add,
.btn-import,
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

.btn-import {
  background: transparent;
  color: var(--ink-2);
  border-color: var(--line-strong);
}
.btn-import:hover {
  border-color: var(--accent);
  color: var(--accent-ink);
  background: var(--accent-soft);
}

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

.filter-picker { flex-shrink: 0; }

.picker-display {
  height: 38px;
  line-height: 38px;
  padding: 0 12px;
  min-width: 104px;
  text-align: center;
  font-size: 12.5px;
  color: var(--ink-2);
  background: var(--surface-raised);
  border: 1px solid var(--line);
  border-radius: 10px;
  box-sizing: border-box;
  transition: border-color 0.18s ease;
}

.picker-display:hover { border-color: var(--line-strong); }

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
.pill-danger { background: #F5E4E0; color: var(--danger); }

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
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.form-dialog {
  width: 340px;
  max-width: 100%;
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

.import-dialog { width: 420px; }

.form-title {
  display: block;
  padding-bottom: 14px;
  margin-bottom: 18px;
  font-family: var(--font-display);
  font-size: 19px;
  letter-spacing: 0.04em;
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

.import-hint {
  display: block;
  margin-bottom: 10px;
  font-size: 11px;
  line-height: 1.7;
  letter-spacing: 0.02em;
  color: var(--muted);
}

.import-textarea {
  width: 100%;
  height: 180px;
  padding: 12px;
  margin-bottom: 14px;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--ink);
  background: var(--surface-raised);
  border: 1px solid var(--line);
  border-radius: 10px;
  box-sizing: border-box;
  transition: border-color 0.18s ease;
}

.import-textarea:focus { border-color: var(--accent); }

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
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
  .header-actions .btn-import,
  .header-actions .btn-add { flex: 1; }

  .search-bar {
    flex-wrap: wrap;
    padding: 12px;
  }

  .search-input { flex-basis: 100%; }
  .filter-picker { flex: 1; }
  .picker-display { width: 100%; }

  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .table-header,
  .table-row { min-width: 900px; }

  .pagination {
    flex-direction: column;
    align-items: stretch;
    padding: 12px;
  }

  .pagination-controls { justify-content: space-between; }
  .page-jump { justify-content: flex-end; }

  .form-dialog { padding: 22px 18px; }
  .import-dialog { width: 100%; }
}
</style>