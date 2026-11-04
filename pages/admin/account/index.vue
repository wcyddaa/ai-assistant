<!-- pages/admin/account/index.vue - 账号管理 -->
<template>
  <AppLayout>
    <view class="page-container">
      <view class="page-header">
        <view class="header-left">
          <text class="header-kicker">ACCOUNT LEDGER</text>
          <text class="page-title-sm">账号管理</text>
          <text class="header-sub">教师与管理员账号 · 权限状态</text>
        </view>
        <view class="header-actions">
          <button class="btn-import" @click="handleBatchImport">批量导入</button>
          <button class="btn-add" @click="handleAdd">+ 新建账号</button>
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
          :value="typeIndex"
          :range="typeOptions"
          range-key="label"
          @change="handleTypeChange"
        >
          <view class="picker-display">{{ typeLabel }}</view>
        </picker>
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
          <text class="th" style="width:120px">手机号</text>
          <text class="th" style="width:80px">角色</text>
          <text class="th" style="width:60px">状态</text>
          <text class="th" style="width:100px">创建时间</text>
          <text class="th" style="width:100px">更新时间</text>
          <text class="th" style="width:120px">操作</text>
        </view>
        <view v-for="a in list" :key="a.id" class="table-row">
          <text class="td" style="width:60px">{{ a.id }}</text>
          <text class="td" style="width:80px">{{ a.name || '-' }}</text>
          <text class="td" style="flex:1">{{ a.username }}</text>
          <text class="td" style="width:120px">{{ a.number }}</text>
          <text class="td role-cell" style="width:80px">{{ typeMap[a.type] || '未知' }}</text>
          <view class="td" style="width:60px">
            <text class="status-pill" :class="a.status === 1 ? 'pill-success' : 'pill-danger'">
              {{ a.status === 1 ? '正常' : '禁用' }}
            </text>
          </view>
          <text class="td cell-sub" style="width:100px">{{ formatTime(a.createTime) }}</text>
          <text class="td cell-sub" style="width:100px">{{ formatTime(a.updateTime) }}</text>
          <view class="td action-cell" style="width:140px; gap:8px; display:flex">
            <text class="action-link" @click="handleEdit(a)">编辑</text>
            <text
              class="action-link"
              :class="a.status === 1 ? 'danger' : 'success'"
              @click="handleToggleStatus(a)"
            >{{ a.status === 1 ? '禁用' : '启用' }}</text>
            <text class="action-link danger" @click="handleDelete(a.id)">删除</text>
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
        <text class="form-title">{{ isEdit ? '编辑账号' : '新建账号' }}</text>
        <input class="form-input" v-model="form.username" placeholder="用户名" @confirm="submitForm" />
        <input class="form-input" v-model="form.name" placeholder="姓名" @confirm="submitForm" />
        <input class="form-input" v-model="form.number" placeholder="手机号" @confirm="submitForm" />
        <input class="form-input" v-model="form.password" type="password" placeholder="密码（留空则不修改）" @confirm="submitForm" />
        <picker
          class="form-picker"
          :value="formTypeIndex"
          :range="typeOptions.slice(1)"
          range-key="label"
          @change="handleFormTypeChange"
        >
          <view class="picker-display form-picker-display">{{ formTypeLabel }}</view>
        </picker>
        <picker
          v-if="formTypeIndex === 2"
          class="form-picker"
          :value="formClassIndex"
          :range="classPickerOptions"
          range-key="name"
          @change="handleFormClassChange"
        >
          <view class="picker-display form-picker-display">{{ formClassLabel || '请选择行政班' }}</view>
        </picker>
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
        <text class="form-title">批量导入账号</text>
        <text class="import-hint">每行一个账号，格式：用户名,姓名,手机号,密码,角色(1管理员/2老师/3学生)</text>
        <textarea
          class="import-textarea"
          v-model="importText"
          placeholder="例：&#10;admin001,管理员,13800000001,123456,1&#10;teacher001,张老师,13800000002,123456,2&#10;student001,张三,13800000003,123456,3"
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
import {
  getUserPage, addUser, updateUser, deleteUser,
  batchImportUsers, disableUser, enableUser,
  type User, type UserPageQuery
} from '@/api/user'
import { getAdminClasses, type AdminClassInfo } from '@/api/admin-class'

const list = ref<User[]>([])
const keyword = ref('')
const typeFilter = ref<number | undefined>(undefined)
const statusFilter = ref<number | undefined>(undefined)
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const totalPages = ref(0)
const jumpPage = ref('')

const typeMap: Record<number, string> = { 1: '管理员', 2: '教师', 3: '学生' }

// 身份筛选
const typeOptions = [
  { label: '全部角色', value: undefined },
  { label: '管理员', value: 1 },
  { label: '教师', value: 2 },
  { label: '学生', value: 3 }
]
const typeIndex = ref(0)
const typeLabel = computed(() => typeOptions[typeIndex.value].label)

function handleTypeChange(e: { detail: { value: number } }) {
  typeIndex.value = e.detail.value
  typeFilter.value = typeOptions[e.detail.value].value
  pageNum.value = 1
  fetchData()
}

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
  pageNum.value = 1
  fetchData()
}

// 表单
const formVisible = ref(false)
const importVisible = ref(false)
const isEdit = ref(false)
const form = ref<Partial<User>>({})
const formTypeIndex = ref(0)
const formTypeLabel = computed(() => typeOptions.slice(1)[formTypeIndex.value]?.label || '管理员')
const importText = ref('')

// 行政班选择
const adminClasses = ref<AdminClassInfo[]>([])
const formClassIndex = ref(-1)
const formClassLabel = computed(() => {
  if (formClassIndex.value < 0) return ''
  return adminClasses.value[formClassIndex.value]?.name || ''
})
const classPickerOptions = computed(() => adminClasses.value)

async function fetchAdminClasses() {
  try {
    adminClasses.value = await getAdminClasses()
  } catch {
    adminClasses.value = []
  }
}

function handleFormClassChange(e: { detail: { value: number } }) {
  formClassIndex.value = e.detail.value
  if (e.detail.value >= 0) {
    form.value.classId = adminClasses.value[e.detail.value]?.id
  }
}

function handleFormTypeChange(e: { detail: { value: number } }) {
  formTypeIndex.value = e.detail.value
  form.value.type = e.detail.value + 1
}

function formatTime(time: string): string {
  if (!time) return '-'
  return time.substring(0, 10)
}

async function fetchData() {
  try {
    const params: UserPageQuery = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
      type: typeFilter.value,
      status: statusFilter.value
    }
    const res = await getUserPage(params)
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
  typeFilter.value = undefined
  typeIndex.value = 0
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
  formTypeIndex.value = 0
  formVisible.value = true
}

function handleEdit(a: User) {
  isEdit.value = true
  form.value = { ...a, password: '' }
  formTypeIndex.value = Math.max(0, (a.type || 1) - 1)
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
  try {
    if (isEdit.value) {
      await updateUser(form.value)
      uni.showToast({ title: '更新成功', icon: 'success' })
    } else {
      const userType = formTypeIndex.value + 1
      await addUser({ ...form.value, type: userType, status: 1 })
      uni.showToast({ title: '添加成功', icon: 'success' })
    }
    closeForm()
    fetchData()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '操作失败'
    uni.showToast({ title: msg, icon: 'none' })
  }
}

async function handleToggleStatus(a: User) {
  const action = a.status === 1 ? '禁用' : '启用'
  try {
    if (a.status === 1) {
      await disableUser(a.id)
    } else {
      await enableUser(a.id)
    }
    uni.showToast({ title: `${action}成功`, icon: 'success' })
    fetchData()
  } catch {
    uni.showToast({ title: `${action}失败`, icon: 'none' })
  }
}

async function handleDelete(id: number) {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除该账号吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteUser(id)
          uni.showToast({ title: '删除成功', icon: 'success' })
          fetchData()
        } catch {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
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
    uni.showToast({ title: '请输入账号信息', icon: 'none' })
    return
  }
  const lines = text.split('\n').filter((l) => l.trim())
  const users: Partial<User>[] = []
  for (const line of lines) {
    const parts = line.split(',').map((p) => p.trim())
    if (parts.length >= 3) {
      users.push({
        username: parts[0],
        name: parts[1] || '',
        number: parts[2],
        password: parts[3] || '123456',
        type: parseInt(parts[4]) || 3,
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
    uni.showToast({ title: `成功导入 ${count} 个账号`, icon: 'success' })
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
   账号管理 · 教育档案室
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
  flex-wrap: wrap;
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
  min-width: 180px;
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

.role-cell {
  font-size: 12px;
  letter-spacing: 0.08em;
  color: var(--ink-2);
}

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
  width: 360px;
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

.import-dialog { width: 440px; }

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

.form-picker { margin-bottom: 12px; }

.form-picker-display {
  width: 100%;
  height: 42px;
  line-height: 40px;
  text-align: left;
  box-sizing: border-box;
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

  .search-bar { padding: 12px; }

  .search-input { flex-basis: 100%; min-width: 0; }
  .filter-picker { flex: 1; }
  .picker-display { width: 100%; min-width: 0; }

  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .table-header,
  .table-row { min-width: 980px; }

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