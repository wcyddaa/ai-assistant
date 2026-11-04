<!-- pages/teacher/homework/list.vue - 作业管理列表 -->
<template>
  <AppLayout>
    <view class="page-container">
      <view class="page-header">
        <view class="header-text">
          <text class="page-kicker">ASSIGNMENT DESK</text>
          <text class="page-title">作业管理</text>
          <text class="page-sub">生成 · 发布 · 批改全流程</text>
        </view>
        <button class="btn-add" @click="goCreate">创建作业</button>
      </view>

      <view class="card-list">
        <view v-for="h in list" :key="h.id" class="homework-card">
          <!-- 第一行：作业名称 + 状态 -->
          <view class="card-row row-title">
            <text class="hw-title">{{ h.title }}</text>
            <text class="status-badge" :class="'status-' + h.status">
              {{ h.status === 'published' ? '已发布' : '草稿' }}
            </text>
          </view>
          <!-- 第二行：教师 | 总人数 | 提交 | 已批改 -->
          <view class="card-row row-info">
            <view class="info-item">
              <text class="info-label">教师</text>
              <text class="info-value">{{ h.teacherName }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">总人数</text>
              <text class="info-value">{{ h.totalStudents ?? '-' }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">提交</text>
              <text class="info-value">{{ h.submittedCount ?? '-' }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">已批改</text>
              <text class="info-value">{{ h.gradedCount ?? '-' }}</text>
            </view>
          </view>
          <!-- 第三行：操作按钮 -->
          <view class="card-row row-actions">
            <text class="action-link" @click="goEdit(h)">编辑</text>
            <text v-if="h.status === 'draft'" class="action-link success" @click="handlePublish(h.id)">发布</text>
            <text class="action-link" @click="goDetail(h)">查看详情</text>
            <text class="action-link danger" @click="handleDelete(h.id)">删除</text>
          </view>
        </view>
        <view v-if="list.length === 0 && !loading" class="empty-state">
          <text class="empty-text">暂无作业数据</text>
        </view>
      </view>

      <!-- 分页 -->
      <view v-if="totalPages > 0" class="pagination">
        <text class="page-total">共 {{ total }} 条</text>
        <view class="pagination-controls">
          <button class="page-btn" :disabled="pageNum <= 1" @click="goPage(1)">首页</button>
          <button class="page-btn" :disabled="pageNum <= 1" @click="goPage(pageNum - 1)">上一页</button>
          <text class="page-info">{{ pageNum }} / {{ totalPages }}</text>
          <button class="page-btn" :disabled="pageNum >= totalPages" @click="goPage(pageNum + 1)">下一页</button>
          <button class="page-btn" :disabled="pageNum >= totalPages" @click="goPage(totalPages)">末页</button>
        </view>
      </view>
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useUserStore } from '@/store/user'
import { getTemplatesByTeacher, deleteTemplate, publishTemplate, type TemplateHomework } from '@/api/homework'

const userStore = useUserStore()
const list = ref<TemplateHomework[]>([])
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const totalPages = ref(0)

async function fetchData() {
  loading.value = true
  try {
    const teacherId = userStore.userInfo?.userId
    if (!teacherId) return
    const res = await getTemplatesByTeacher({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      teacherId
    })
    list.value = res.list
    total.value = res.total
    totalPages.value = res.totalPages
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

function goPage(p: number) {
  if (p < 1 || p > totalPages.value) return
  pageNum.value = p
  fetchData()
}

function goCreate() {
  uni.navigateTo({ url: '/pages/teacher/homework/generate' })
}

function goEdit(h: TemplateHomework) {
  uni.navigateTo({ url: `/pages/teacher/homework/generate?id=${h.id}` })
}

function goDetail(h: TemplateHomework) {
  uni.navigateTo({ url: `/pages/teacher/homework/detail?templateId=${h.id}&title=${encodeURIComponent(h.title)}` })
}

async function handlePublish(id: number) {
  uni.showModal({
    title: '确认发布',
    content: '发布后学生将可以看到该作业，确定要发布吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await publishTemplate(id)
          uni.showToast({ title: '发布成功', icon: 'success' })
          fetchData()
        } catch {
          uni.showToast({ title: '发布失败', icon: 'none' })
        }
      }
    }
  })
}

async function handleDelete(id: number) {
  uni.showModal({
    title: '确认删除',
    content: '删除后不可恢复，确定要删除吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteTemplate(id)
          uni.showToast({ title: '删除成功', icon: 'success' })
          fetchData()
        } catch {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
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

/* ========== 作业卡片 ========== */
.card-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.homework-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.homework-card:hover {
  transform: translateY(-2px);
  border-color: var(--line-strong);
}

.card-row {
  display: flex;
  align-items: center;
}

.row-title {
  gap: 10px;
}

.row-info {
  gap: 0;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}

.row-actions {
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}

/* 作业名称 */
.hw-title {
  flex: 1;
  min-width: 0;
  font-family: var(--font-display);
  font-size: 16px;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 状态标签 */
.status-badge {
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.status-badge.status-published {
  background: rgba(63, 107, 82, 0.12);
  color: var(--success);
}

.status-badge.status-draft {
  background: var(--paper-deep);
  color: var(--muted);
}

/* 信息项 */
.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
  padding: 0 16px;
  border-right: 1px solid var(--line);
}

.info-item:first-child {
  padding-left: 0;
}

.info-item:last-child {
  padding-right: 0;
  border-right: none;
}

.info-label {
  font-size: 10.5px;
  letter-spacing: 0.1em;
  color: var(--muted);
}

.info-value {
  font-size: 13px;
  color: var(--ink-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-item .info-value {
  font-variant-numeric: tabular-nums;
}

.info-item:not(:first-child) .info-value {
  font-family: var(--font-display);
  font-size: 15px;
  color: var(--ink);
}

/* 操作按钮 */
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

.action-link.success {
  color: var(--success);
}

.action-link.success:hover {
  border-bottom-color: var(--success);
}

/* ========== 空状态 ========== */
.empty-state {
  padding: 52px 20px;
  text-align: center;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius);
}

.empty-text {
  font-size: 12.5px;
  letter-spacing: 0.04em;
  color: var(--muted);
}

/* ========== 分页 ========== */
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 14px 18px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
}

.page-total {
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-btn {
  margin: 0;
  height: 30px;
  line-height: 28px;
  padding: 0 12px;
  font-size: 12px;
  color: var(--ink-2);
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 8px;
  transition: all 0.16s ease;
}

.page-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.page-btn[disabled] {
  opacity: 0.45;
  color: var(--muted);
  border-color: var(--line);
}

.page-info {
  font-size: 12px;
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
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
  .homework-card {
    padding: 14px 16px;
    gap: 10px;
  }
  .hw-title {
    font-size: 15px;
    white-space: normal;
    line-height: 1.5;
  }
  .row-info {
    flex-wrap: wrap;
    gap: 10px 0;
  }
  .info-item {
    flex: 1 1 50%;
    padding: 0 10px;
    border-right: none;
  }
  .info-item:nth-child(odd) {
    padding-left: 0;
  }
  .row-actions {
    gap: 12px;
    flex-wrap: wrap;
  }
  .pagination {
    flex-direction: column;
    align-items: flex-start;
    padding: 12px 14px;
  }
  .pagination-controls {
    flex-wrap: wrap;
  }
  .page-btn {
    padding: 0 10px;
    font-size: 11.5px;
  }
}
</style>
