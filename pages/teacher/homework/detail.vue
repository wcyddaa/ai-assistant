<!-- pages/teacher/homework/detail.vue - 作业详情与提交状态 -->
<template>
  <AppLayout>
    <view class="page-container">
      <view class="page-header">
        <view class="header-text">
          <text class="page-kicker">ASSIGNMENT RECORD</text>
          <text class="page-title">{{ title }}</text>
          <text class="page-sub">作业内容 · 学生提交 · 批改记录</text>
        </view>
      </view>

      <!-- 作业内容 -->
      <view class="content-card">
        <text class="section-title">作业内容</text>
        <text class="content-text">{{ desc || '暂无内容' }}</text>
        <view v-if="attachmentList.length > 0" class="attachment-row">
          <text class="section-title" style="margin-top:12px">附件资料</text>
          <view v-for="(att, i) in attachmentList" :key="i" class="attachment-item" @click="downloadAttachmentItem(att)">
            <text class="download-link">{{ att.name }}</text>
          </view>
        </view>
      </view>

      <!-- 学生提交列表 -->
      <view class="submissions-card">
        <text class="section-title">学生提交 ({{ submissions.length }}人)</text>
        <view v-if="submissions.length === 0" class="empty-state">
          <text class="empty-text">暂无学生提交</text>
        </view>
        <view v-for="s in submissions" :key="s.id" class="submission-row">
          <view class="submission-info">
            <text class="student-name">{{ s.studentName }}</text>
            <text class="submission-status" :class="'status-' + s.status">
              {{ s.status === 'submitted' ? '已提交' : s.status === 'graded' ? '已批改' : '待提交' }}
            </text>
          </view>
          <view class="submission-time" v-if="s.submitTime">
            <text class="time-text">提交时间 {{ formatTime(s.submitTime) }}</text>
          </view>
          <view class="submission-answer" v-if="s.answer">
            <text class="answer-label">作答内容:</text>
            <text class="answer-text">{{ s.answer.substring(0, 200) }}{{ s.answer.length > 200 ? '...' : '' }}</text>
          </view>
          <view class="submission-grade" v-if="s.status === 'graded'">
            <text class="grade-text">分数: {{ s.score ?? '-' }}</text>
            <text class="grade-text" v-if="s.comment">评语: {{ s.comment }}</text>
          </view>
          <view class="submission-actions" v-if="s.status === 'submitted'">
            <text class="action-link" @click="openGrade(s)">批改</text>
          </view>
        </view>
      </view>

      <!-- 批改弹窗 -->
      <view v-if="gradeVisible" class="popup-overlay">
        <view class="popup-dialog">
          <text class="dialog-x" @click="closeGrade">×</text>
          <view class="dialog-header">
            <text class="form-title">批改作业 - {{ gradeTarget?.studentName }}</text>
          </view>
          <view class="dialog-body">
            <text class="grade-answer-label">作答内容</text>
            <view class="grade-answer-box">
              <text class="grade-answer">{{ gradeTarget?.answer }}</text>
            </view>
            <view class="form-group">
              <text class="form-label">分数</text>
              <input class="form-input" v-model="gradeScore" type="number" placeholder="请输入分数" @confirm="submitGrade" />
            </view>
            <view class="form-group">
              <text class="form-label">评语</text>
              <textarea class="form-textarea" v-model="gradeComment" placeholder="请输入评语" />
            </view>
          </view>
          <view class="dialog-footer">
            <button class="btn-cancel" @click="closeGrade">取消</button>
            <button class="btn-confirm" @click="submitGrade">确认批改</button>
          </view>
        </view>
      </view>
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import AppLayout from '@/components/layout/AppLayout.vue'
import { getTemplate, getSubmissions, gradeHomework, type StudentHomework } from '@/api/homework'

interface AttachmentItem {
  name: string
  type: string
  content?: string       // markdown 附件（AI生成的内容）
  downloadUrl?: string   // 上传的文件（云存储下载链接）
}

const templateId = ref(0)
const title = ref('')
const desc = ref('')
const attachmentsJson = ref('')
const submissions = ref<StudentHomework[]>([])

const attachmentList = computed<AttachmentItem[]>(() => {
  if (!attachmentsJson.value) return []
  try {
    const parsed = JSON.parse(attachmentsJson.value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
})

const gradeVisible = ref(false)
const gradeTarget = ref<StudentHomework | null>(null)
const gradeScore = ref('')
const gradeComment = ref('')

function formatTime(time: string): string {
  if (!time) return '-'
  return time.substring(0, 16)
}

async function fetchData() {
  try {
    const hw = await getTemplate(templateId.value)
    title.value = hw.title
    desc.value = hw.description || ''
    attachmentsJson.value = hw.attachments || ''
    submissions.value = await getSubmissions(templateId.value)
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

function openGrade(s: StudentHomework) {
  gradeTarget.value = s
  gradeScore.value = s.score ? String(s.score) : ''
  gradeComment.value = s.comment || ''
  gradeVisible.value = true
}

function closeGrade() {
  gradeVisible.value = false
  gradeTarget.value = null
}

async function submitGrade() {
  if (!gradeTarget.value) return
  try {
    const score = gradeScore.value ? Number(gradeScore.value) : null
    await gradeHomework(gradeTarget.value.id, score, gradeComment.value)
    uni.showToast({ title: '批改成功', icon: 'success' })
    closeGrade()
    fetchData()
  } catch {
    uni.showToast({ title: '批改失败', icon: 'none' })
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

onLoad((options: Record<string, string> | undefined) => {
  if (options) {
    templateId.value = Number(options.templateId)
    title.value = decodeURIComponent(options.title || '')
    fetchData()
  }
})
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 760px;
  margin: 0 auto;
  padding: 2px;
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
  min-width: 0;
}

.page-kicker {
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
}

.page-title {
  font-family: var(--font-display);
  font-size: 22px;
  line-height: 1.35;
  color: var(--ink);
  word-break: break-all;
}

.page-sub {
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--muted);
}

/* ========== 卡片 ========== */
.content-card,
.submissions-card {
  padding: 20px 22px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
}

.section-title {
  display: block;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line);
  font-family: var(--font-display);
  font-size: 16px;
  color: var(--ink);
}

.content-text {
  font-size: 13.5px;
  line-height: 1.85;
  color: var(--ink-2);
  white-space: pre-wrap;
}

/* ========== 附件 ========== */
.attachment-row {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

.attachment-row .section-title {
  margin-top: 0 !important;
  border-bottom: none;
  padding-bottom: 0;
  font-size: 13px;
}

.attachment-item {
  padding: 8px 12px;
  margin-top: 6px;
  background: var(--surface-raised);
  border: 1px solid var(--line);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.16s ease, background 0.16s ease;
}

.attachment-item:hover {
  border-color: var(--line-strong);
  background: #FFFCF6;
}

.download-link {
  font-size: 12.5px;
  color: var(--accent);
  cursor: pointer;
}

/* ========== 提交列表 ========== */
.submission-row {
  padding: 14px 0;
  border-bottom: 1px solid var(--line);
  transition: background 0.16s ease;
}

.submission-row:last-child {
  border-bottom: none;
  padding-bottom: 2px;
}

.submission-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.student-name {
  font-family: var(--font-display);
  font-size: 15px;
  color: var(--ink);
}

.submission-status {
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.04em;
}

.submission-status.status-submitted {
  background: rgba(173, 116, 27, 0.12);
  color: var(--warning);
}

.submission-status.status-graded {
  background: rgba(63, 107, 82, 0.12);
  color: var(--success);
}

.submission-status.status-pending {
  background: var(--paper-deep);
  color: var(--muted);
}

.submission-time {
  margin-bottom: 6px;
}

.time-text {
  font-size: 11px;
  letter-spacing: 0.02em;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.submission-answer {
  margin-bottom: 6px;
  padding: 10px 12px;
  background: #F9F5ED;
  border-left: 2px solid var(--line-strong);
  border-radius: 0 8px 8px 0;
}

.answer-label {
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.answer-text {
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--ink-2);
}

.submission-grade {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 6px;
}

.grade-text {
  font-size: 12.5px;
  color: var(--success);
  font-variant-numeric: tabular-nums;
}

.submission-actions {
  margin-top: 8px;
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

/* ========== 空状态 ========== */
.empty-state {
  padding: 40px 16px;
  text-align: center;
  border: 1px dashed var(--line-strong);
  border-radius: 10px;
}

.empty-text {
  font-size: 12.5px;
  letter-spacing: 0.04em;
  color: var(--muted);
}

/* ========== 批改弹窗 ========== */
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

.popup-dialog {
  width: 100%;
  max-width: 440px;
  max-height: 82vh;
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lift);
}

.dialog-header {
  padding: 22px 24px 14px;
  border-bottom: 1px solid var(--line);
}

.form-title {
  display: block;
  font-family: var(--font-display);
  font-size: 17px;
  color: var(--ink);
}

.dialog-body {
  padding: 16px 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 24px 20px;
  border-top: 1px solid var(--line);
}

.grade-answer-label {
  display: block;
  margin-bottom: 6px;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--muted);
}

.grade-answer-box {
  max-height: 170px;
  padding: 12px;
  margin-bottom: 16px;
  overflow-y: auto;
  background: #F9F5ED;
  border: 1px solid var(--line);
  border-radius: 10px;
}

.grade-answer {
  display: block;
  font-size: 12.5px;
  line-height: 1.75;
  color: var(--ink-2);
  white-space: pre-wrap;
}

.form-group {
  margin-bottom: 14px;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--muted);
}

.form-input {
  width: 100%;
  height: 38px;
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
  height: 86px;
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

/* ========== 按钮 ========== */
.btn-cancel {
  margin: 0;
  height: 40px;
  line-height: 38px;
  padding: 0 24px;
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
  padding: 0 24px;
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

/* ========== 移动端 ========== */
@media (max-width: 768px) {
  .page-container {
    gap: 12px;
    padding: 0;
  }
  .page-header {
    padding-bottom: 12px;
  }
  .page-title {
    font-size: 18px;
  }
  .content-card,
  .submissions-card {
    padding: 16px 16px;
  }
  .section-title {
    font-size: 15px;
  }
  .popup-overlay {
    padding: 12px;
  }
  .popup-dialog {
    max-height: 88vh;
  }
  .dialog-header {
    padding: 18px 16px 12px;
  }
  .dialog-body {
    padding: 14px 16px;
  }
  .dialog-footer {
    padding: 12px 16px 16px;
  }
  .dialog-footer .btn-cancel,
  .dialog-footer .btn-confirm {
    flex: 1;
  }
}
</style>
