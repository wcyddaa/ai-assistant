<!-- pages/student/homework/index.vue - 学生我的作业 -->
<template>
  <AppLayout>
    <view class="page-container">
      <view class="page-header">
        <view class="header-left">
          <text class="header-kicker">MY ASSIGNMENTS</text>
          <text class="page-title">我的作业</text>
          <text class="header-sub">提交 · 批改 · 反馈</text>
        </view>
        <text class="header-count">{{ list.length }} 项</text>
      </view>

      <view v-if="loading" class="loading-state">
        <text class="loading-text">加载中...</text>
      </view>

      <view v-else-if="list.length === 0" class="empty-state">
        <view class="empty-seal">作</view>
        <text class="empty-text">暂无作业数据</text>
      </view>

      <view v-else class="card-list">
        <view v-for="item in list" :key="item.template.id" class="homework-card">
          <view class="hw-header">
            <view class="hw-title-group">
              <view class="hw-seal">作</view>
              <text class="hw-title">{{ item.template.title }}</text>
            </view>
            <text class="hw-status" :class="'status-' + item.submissionStatus">
              {{ statusLabel(item.submissionStatus) }}
            </text>
          </view>
          <view class="hw-info">
            <text class="info-text">教师: {{ item.template.teacherName }}</text>
            <text class="info-text" v-if="item.template.description">
              {{ item.template.description.substring(0, 60) }}{{ item.template.description.length > 60 ? '...' : '' }}
            </text>
          </view>
          <view v-if="item.submission" class="hw-score">
            <text v-if="item.submission.score !== null" class="score-text">分数: {{ item.submission.score }}</text>
            <text v-if="item.submission.comment" class="comment-text">评语: {{ item.submission.comment }}</text>
          </view>
          <view class="hw-actions">
            <text class="action-link" @click="openSubmit(item)">{{ item.submission ? '查看详情' : '提交作业' }}</text>
            <text v-for="(att, ai) in getAttachments(item.template)" :key="ai" class="action-link download" @click="downloadAttachmentItem(att)">下载附件</text>
          </view>
        </view>
      </view>

      <!-- 提交作业弹窗 -->
      <view v-if="submitVisible" class="popup-overlay" @click="closeSubmit">
        <view class="popup-dialog" @click.stop>
          <text class="dialog-x" @click="closeSubmit">×</text>
          <text class="dialog-kicker">ASSIGNMENT</text>
          <text class="dialog-title">{{ currentTemplate?.template.title }}</text>
          <view class="template-content" v-if="currentTemplate?.template.description">
            <text class="section-label">作业内容</text>
            <text class="content-text">{{ currentTemplate?.template.description }}</text>
          </view>
          <view class="form-group">
            <text class="section-label">你的作答</text>
            <textarea
              class="answer-textarea"
              v-model="answerText"
              placeholder="请输入你的答案..."
              :disabled="!!currentTemplate?.submission"
              :maxlength="-1"
            />
          </view>
          <!-- 附件上传 -->
          <view class="form-group" v-if="!currentTemplate?.submission">
            <text class="section-label">上传附件（可选，支持PDF/Word/图片等）</text>
            <view class="attachment-area">
              <view v-for="(f, i) in submitAttachments" :key="i" class="attachment-item">
                <text class="attachment-name">{{ f.name }}</text>
                <text class="attachment-size">{{ formatFileSize(f.size) }}</text>
                <text class="attachment-remove" @click="removeSubmitAttachment(i)">×</text>
              </view>
              <button class="btn-upload-attach" @click="handleSubmitAttachmentUpload">+ 上传附件</button>
            </view>
          </view>
          <view v-if="currentTemplate?.submission" class="submission-info">
            <text class="info-label">提交状态: {{ statusLabel(currentTemplate.submission.status) }}</text>
            <text v-if="currentTemplate.submission.submitTime" class="info-label">
              提交时间: {{ formatTime(currentTemplate.submission.submitTime) }}
            </text>
            <text v-if="currentTemplate.submission.score !== null" class="info-label">
              分数: {{ currentTemplate.submission.score }}
            </text>
            <text v-if="currentTemplate.submission.comment" class="info-label">
              评语: {{ currentTemplate.submission.comment }}
            </text>
          </view>
          <view class="dialog-actions">
            <button class="btn-cancel" @click="closeSubmit">关闭</button>
            <button
              v-if="!currentTemplate?.submission"
              class="btn-confirm"
              :disabled="!answerText.trim()"
              @click="handleSubmit"
            >提交</button>
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
import { useUserStore } from '@/store/user'
import { getStudentClasses, type ClassInfo } from '@/api/class'
import { getTemplatesByStudent, getStudentHomeworks, submitHomework, type TemplateHomework, type StudentHomework } from '@/api/homework'

interface HomeworkItem {
  template: TemplateHomework
  submission: StudentHomework | null
  submissionStatus: string
}

const userStore = useUserStore()
const list = ref<HomeworkItem[]>([])
const loading = ref(false)

const submitVisible = ref(false)
const currentTemplate = ref<HomeworkItem | null>(null)
const answerText = ref('')
const submitAttachments = ref<{ name: string; size: number; file: File }[]>([])

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: '待提交',
    submitted: '已提交',
    graded: '已批改'
  }
  return map[status] || '待提交'
}

function formatTime(time: string): string {
  if (!time) return '-'
  return time.substring(0, 16)
}

async function fetchData() {
  const studentId = userStore.userInfo?.userId
  if (!studentId) return

  loading.value = true
  try {
    // 1. 获取学生所属教学班
    const classes: ClassInfo[] = await getStudentClasses(studentId)
    if (classes.length === 0) {
      list.value = []
      return
    }
    const classIds = classes.map(c => String(c.id)).join(',')

    // 2. 获取已发布的模板作业
    const res = await getTemplatesByStudent({ classIds, pageNum: 1, pageSize: 100 })
    const templates = res.list

    if (templates.length === 0) {
      list.value = []
      return
    }

    // 3. 获取学生所有提交记录
    const submissionsRes = await getStudentHomeworks({ studentId, pageNum: 1, pageSize: 200 })
    const submissions = submissionsRes.list

    // 4. 合并数据
    const submissionMap = new Map<number, StudentHomework>()
    for (const s of submissions) {
      submissionMap.set(s.templateId, s)
    }

    list.value = templates.map(t => {
      const sub = submissionMap.get(t.id) || null
      return {
        template: t,
        submission: sub,
        submissionStatus: sub ? sub.status : 'pending'
      }
    })
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

function openSubmit(item: HomeworkItem) {
  currentTemplate.value = item
  answerText.value = item.submission?.answer || ''
  submitVisible.value = true
}

function closeSubmit() {
  submitVisible.value = false
  currentTemplate.value = null
  answerText.value = ''
  submitAttachments.value = []
}

function handleSubmitAttachmentUpload() {
  // #ifdef H5
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.jpg,.png,.jpeg'
  input.multiple = true
  input.onchange = (e: Event) => {
    const target = e.target as HTMLInputElement
    const files = target.files
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        submitAttachments.value.push({ name: file.name, size: file.size, file })
      }
    }
  }
  input.click()
  // #endif
}

function removeSubmitAttachment(index: number) {
  submitAttachments.value.splice(index, 1)
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
}

async function handleSubmit() {
  if (!answerText.value.trim() || !currentTemplate.value) return

  const studentId = userStore.userInfo?.userId
  const studentName = userStore.userInfo?.name || userStore.userInfo?.username || ''
  if (!studentId) return

  try {
    await submitHomework({
      templateId: currentTemplate.value.template.id,
      studentId,
      studentName,
      answer: answerText.value
    })
    uni.showToast({ title: '提交成功', icon: 'success' })
    closeSubmit()
    fetchData()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '提交失败'
    uni.showToast({ title: msg, icon: 'none' })
  }
}

interface AttachmentItem {
  name: string
  type: string
  content?: string       // markdown 附件（AI生成的内容）
  downloadUrl?: string   // 上传的文件（云存储下载链接）
}

function getAttachments(template: TemplateHomework): AttachmentItem[] {
  if (!template.attachments) return []
  try {
    return JSON.parse(template.attachments)
  } catch {
    return []
  }
}

function downloadAttachmentItem(att: AttachmentItem) {
  // #ifdef H5
  // 上传的文件：通过云存储下载链接获取
  if (att.downloadUrl) {
    const a = document.createElement('a')
    a.href = 'http://localhost:8084' + att.downloadUrl
    a.download = att.name
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    setTimeout(() => document.body.removeChild(a), 200)
    return
  }
  // markdown 附件：直接创建 Blob 下载
  const content = att.content || ''
  const mimeType = att.type || 'application/octet-stream'
  if (att.type !== 'text/markdown' && content.startsWith('data:')) {
    const a = document.createElement('a')
    a.href = content
    a.download = att.name
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    setTimeout(() => document.body.removeChild(a), 200)
    return
  }
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = att.name
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 200)
  // #endif
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
  width: 100%;
  box-sizing: border-box;
}

button::after {
  border: none;
}

/* ========== 页面头部 ========== */
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding: 6px 2px 16px;
  border-bottom: 1px solid var(--line);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.header-kicker {
  font-size: 10px;
  letter-spacing: 0.24em;
  color: var(--accent);
}

.page-title {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: 0.02em;
  color: var(--ink);
}

.header-sub {
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--muted);
}

.header-count {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--muted);
  padding: 4px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
}

/* ========== 状态 ========== */
.loading-state {
  padding: 56px 0;
  text-align: center;
}

.loading-text {
  font-size: 13px;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 28px;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius);
  background: rgba(255, 253, 248, 0.5);
  text-align: center;
}

.empty-seal {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 6px;
  border: 1px solid rgba(180, 83, 42, 0.2);
  background: var(--accent-soft);
  color: var(--accent-ink);
  font-family: var(--font-display);
  font-size: 15px;
}

.empty-text {
  font-size: 13px;
  line-height: 1.7;
  color: var(--muted);
}

/* ========== 作业卡片 ========== */
.card-list {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.homework-card {
  flex: 1;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 11px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow-soft);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.homework-card:hover {
  transform: translateY(-3px);
  border-color: var(--line-strong);
  box-shadow: var(--shadow-lift);
}

.hw-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}

.hw-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.hw-seal {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: 6px;
  border: 1px solid rgba(180, 83, 42, 0.18);
  background: var(--accent-soft);
  color: var(--accent-ink);
  font-family: var(--font-display);
  font-size: 14px;
}

.hw-title {
  font-family: var(--font-display);
  font-size: 15.5px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--ink);
}

.hw-status {
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 11px;
  letter-spacing: 0.06em;
  line-height: 1.5;
}

.status-pending {
  color: var(--warning);
  background: rgba(173, 116, 27, 0.1);
  border-color: rgba(173, 116, 27, 0.24);
}

.status-submitted {
  color: var(--info);
  background: rgba(53, 89, 127, 0.1);
  border-color: rgba(53, 89, 127, 0.22);
}

.status-graded {
  color: var(--success);
  background: rgba(63, 107, 82, 0.1);
  border-color: rgba(63, 107, 82, 0.22);
}

.hw-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-text {
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--ink-2);
}

.hw-score {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: rgba(235, 229, 217, 0.42);
}

.score-text {
  font-family: var(--font-display);
  font-size: 15px;
  letter-spacing: 0.02em;
  color: var(--accent-ink);
}

.comment-text {
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--muted);
}

.hw-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-top: auto;
  padding-top: 4px;
}

.action-link {
  position: relative;
  font-size: 12.5px;
  letter-spacing: 0.04em;
  color: var(--accent);
  cursor: pointer;
  transition: color 0.18s ease;
}

.action-link:hover {
  color: var(--accent-ink);
}

.action-link.download {
  color: var(--ink-2);
}

.action-link.download:hover {
  color: var(--ink);
}

/* ========== 提交弹窗 ========== */
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(23, 35, 59, 0.34);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  z-index: 999;
}

.popup-dialog {
  width: 100%;
  max-width: 520px;
  max-height: 86vh;
  overflow-y: auto;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-lift);
  box-sizing: border-box;
  animation: dialogIn 0.2s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes dialogIn {
  from { opacity: 0; transform: translateY(10px) scale(0.99); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.dialog-kicker {
  display: block;
  font-size: 10px;
  letter-spacing: 0.24em;
  color: var(--accent);
  margin-bottom: 8px;
}

.dialog-title {
  display: block;
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.02em;
  color: var(--ink);
  padding-bottom: 14px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--line);
}

.template-content {
  margin-bottom: 18px;
}

.section-label {
  display: block;
  font-size: 11px;
  letter-spacing: 0.14em;
  color: var(--muted);
  margin-bottom: 7px;
}

.content-text {
  display: block;
  padding: 11px 13px;
  border: 1px solid var(--line);
  border-left: 2px solid var(--accent);
  border-radius: 10px;
  background: rgba(235, 229, 217, 0.42);
  font-size: 12.5px;
  line-height: 1.8;
  color: var(--ink-2);
  white-space: pre-wrap;
  max-height: 150px;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 18px;
}

.answer-textarea {
  display: block;
  width: 100%;
  min-height: 150px;
  padding: 12px 13px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #FDFBF6;
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--ink);
  box-sizing: border-box;
  transition: border-color 0.18s ease, background 0.18s ease;
}

.answer-textarea:focus {
  border-color: var(--accent);
  background: var(--surface);
  outline: none;
}

.submission-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 12px 13px;
  margin-bottom: 18px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: rgba(235, 229, 217, 0.42);
}

.info-label {
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--ink-2);
}

.dialog-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

.btn-cancel {
  margin: 0;
  height: 40px;
  line-height: 40px;
  padding: 0 24px;
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  background: transparent;
  color: var(--ink-2);
  font-size: 13.5px;
  transition: all 0.18s ease;
}

.btn-cancel:hover {
  border-color: var(--ink);
  color: var(--ink);
}

.btn-confirm {
  margin: 0;
  height: 40px;
  line-height: 40px;
  padding: 0 26px;
  border: none;
  border-radius: 10px;
  background: var(--ink);
  color: #F7F2E7;
  font-size: 13.5px;
  letter-spacing: 0.06em;
  transition: background 0.18s ease, transform 0.18s ease;
}

.btn-confirm:hover {
  background: #24334F;
}

.btn-confirm[disabled] {
  opacity: 0.4;
}

/* ========== 附件 ========== */
.attachment-area {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--paper-deep);
}

.attachment-name {
  max-width: 160px;
  font-size: 12.5px;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-size {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--muted);
}

.attachment-remove {
  flex-shrink: 0;
  padding: 0 2px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1;
  color: var(--danger);
  cursor: pointer;
}

.btn-upload-attach {
  margin: 0;
  height: 32px;
  line-height: 30px;
  padding: 0 14px;
  border: 1px dashed var(--line-strong);
  border-radius: 8px;
  background: transparent;
  color: var(--ink-2);
  font-size: 12px;
  transition: all 0.18s ease;
}

.btn-upload-attach:hover {
  border-color: var(--accent);
  color: var(--accent-ink);
  background: var(--accent-soft);
}

@media (max-width: 768px) {
  .page-header {
    align-items: flex-start;
    padding-bottom: 12px;
  }
  .page-title {
    font-size: 22px;
  }
  .card-list {
    gap: 12px;
  }
  .homework-card {
    min-width: 100%;
    padding: 15px;
  }
  .hw-title {
    font-size: 14.5px;
  }
  .popup-overlay {
    padding: 12px;
  }
  .popup-dialog {
    padding: 18px 16px;
    max-height: 90vh;
  }
  .dialog-title {
    font-size: 17px;
  }
  .dialog-actions .btn-cancel,
  .dialog-actions .btn-confirm {
    flex: 1;
    padding: 0 12px;
    text-align: center;
  }
  .empty-state {
    padding: 36px 18px;
  }
}
</style>