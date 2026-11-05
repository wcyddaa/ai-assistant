<!-- pages/teacher/homework/generate.vue - 创建/编辑作业 -->
<template>
  <AppLayout>
    <view class="page-container">
      <view class="page-header">
        <view class="header-text">
          <text class="page-kicker">ASSIGNMENT BUILDER</text>
          <text class="page-title">{{ isEdit ? '编辑作业' : '创建作业' }}</text>
          <text class="page-sub">选择教学班与章节 · AI 生成内容 · 发布给学生</text>
        </view>
      </view>

      <view class="form-card">
        <!-- 作业名称 -->
        <view class="form-group">
          <text class="form-label">作业名称 <text class="required">*</text></text>
          <input class="form-input" v-model="form.title" placeholder="请输入作业名称" @confirm="saveDraft" />
        </view>

        <!-- 教学班选择 -->
        <view class="form-group">
          <text class="form-label">所属教学班</text>
          <picker :range="classLabels" @change="onClassChange">
            <view class="picker-display">{{ form.classId ? classLabel : '请选择教学班' }}</view>
          </picker>
        </view>

        <!-- 课程选择（根据教学班加载） -->
        <view class="form-group" v-if="form.classId">
          <text class="form-label">所属课程</text>
          <picker :range="courseLabels" @change="onCourseChange">
            <view class="picker-display">{{ form.courseId ? courseLabel : '请选择课程' }}</view>
          </picker>
        </view>

        <!-- 章节选择（多选） -->
        <view class="form-group" v-if="form.courseId && chapterList.length > 0">
          <text class="form-label">对应章节（可选，多选）</text>
          <view class="chapter-checkbox-list">
            <view v-for="ch in chapterList" :key="ch.id" class="chapter-checkbox-item" @click="toggleChapter(ch.id)">
              <view class="checkbox-box" :class="{ checked: form.selectedChapterIds[ch.id] }">
                <text v-if="form.selectedChapterIds[ch.id]" class="check-mark">✓</text>
              </view>
              <text class="checkbox-label">{{ ch.title }}</text>
            </view>
          </view>
        </view>

        <!-- 课件参考信息 -->
        <view class="form-group" v-if="coursewareList.length > 0">
          <text class="form-label">课件参考（AI生成时将检索以下课件内容）</text>
          <view class="courseware-tags">
            <text v-for="cw in coursewareList" :key="cw.id" class="courseware-tag">{{ cw.title }}</text>
          </view>
        </view>

        <!-- 作业内容 -->
        <view class="form-group">
          <text class="form-label">作业内容</text>
          <textarea
            class="form-textarea"
            v-model="form.description"
            placeholder="请输入作业内容，也可以使用 AI 智能体生成"
            :maxlength="-1"
          />
          <view class="btn-ai-row">
            <button class="btn-ai" @click="aiGenerate">AI 生成作业内容</button>
            <button class="btn-ai btn-pdf" @click="exportPdf" :disabled="!hasMarkdownAttachment">导出为 PDF</button>
          </view>
          <view v-if="aiWarning" class="ai-warning">
            <text class="ai-warning-text">{{ aiWarning }}</text>
          </view>
        </view>

        <!-- 附件上传 -->
        <view class="form-group">
          <text class="form-label">附件资料（支持Markdown/PDF/Word/PPT/图片等）</text>
          <view class="attachment-area">
            <view v-for="(att, i) in homeworkAttachments" :key="i" class="attachment-item" :class="{ 'md-attachment': att.type === 'text/markdown' }" @click="downloadAttachmentItem(att)">
              <text class="attachment-name">{{ att.name }}</text>
              <text class="attachment-size">{{ formatAttSize(att) }}</text>
              <text class="attachment-remove" @click.stop="removeAttachmentItem(i)">×</text>
            </view>
            <button class="btn-upload-attach" @click="handleAttachmentUpload">+ 上传附件</button>
          </view>
        </view>

        <!-- 状态提示 -->
        <view class="form-tip">
          <text v-if="form.status === 'draft'" class="tip-text draft">当前为草稿状态，填写完整后可发布</text>
          <text v-else class="tip-text published">已发布，学生可见</text>
        </view>

        <!-- 操作按钮 -->
        <view class="form-actions">
          <button class="btn-save" @click="saveDraft">保存草稿</button>
          <button class="btn-publish" @click="handlePublish" :disabled="!canPublish">
            {{ isEdit && form.status === 'published' ? '更新' : '发布' }}
          </button>
        </view>
      </view>
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useUserStore } from '@/store/user'
import { createTemplate, updateTemplate, publishTemplate, getTemplate, type TemplateHomework } from '@/api/homework'
import { getClassesByTeacher, type ClassInfo } from '@/api/class'
import { getCoursesByClass, getChapters, type CourseInfo, type ChapterInfo } from '@/api/course'
import { getCoursewareList, type CoursewareInfo } from '@/api/courseware'
import { marked } from 'marked'

interface AttachmentItem {
  name: string
  type: string
  content?: string       // markdown 附件使用（AI生成的内容）
  downloadUrl?: string   // 上传的文件使用（云存储下载地址）
}

const userStore = useUserStore()
const isEdit = ref(false)
const classList = ref<ClassInfo[]>([])
const courseList = ref<CourseInfo[]>([])
const chapterList = ref<ChapterInfo[]>([])
const coursewareList = ref<CoursewareInfo[]>([])
const homeworkAttachments = ref<AttachmentItem[]>([])

const hasMarkdownAttachment = computed(() => {
  return homeworkAttachments.value.some(a => a.type === 'text/markdown')
})

const form = ref({
  id: null as number | null,
  title: '',
  classId: null as number | null,
  courseId: null as number | null,
  chapterIds: [] as number[],
  selectedChapterIds: {} as Record<number, boolean>,
  description: '',
  status: 'draft'
})

/** 检索未命中时的提示（不阻断生成） */
const aiWarning = ref('')

const classLabels = computed(() => classList.value.map(c => c.name))
const classLabel = computed(() => {
  const c = classList.value.find(c => c.id === form.value.classId)
  return c ? c.name : ''
})

const courseLabels = computed(() => courseList.value.map(c => c.name))
const courseLabel = computed(() => {
  const c = courseList.value.find(c => c.id === form.value.courseId)
  return c ? c.name : ''
})

const selectedChapterLabels = computed(() => {
  return chapterList.value.filter(ch => form.value.selectedChapterIds[ch.id]).map(ch => ch.title)
})

const selectedChapterIds = computed(() => {
  return Object.keys(form.value.selectedChapterIds)
    .filter(k => form.value.selectedChapterIds[Number(k)])
    .map(Number)
})

const canPublish = computed(() => {
  return form.value.title.trim() && form.value.classId && form.value.description.trim()
})

function onClassChange(e: { detail: { value: number } }) {
  const c = classList.value[e.detail.value]
  if (c) {
    form.value.classId = c.id
    form.value.courseId = null
    form.value.selectedChapterIds = {}
    chapterList.value = []
    coursewareList.value = []
    loadCourses(c.id)
  }
}

function onCourseChange(e: { detail: { value: number } }) {
  const c = courseList.value[e.detail.value]
  if (c) {
    form.value.courseId = c.id
    form.value.selectedChapterIds = {}
    loadChapters(c.id)
    loadCoursewares(c.id)
  }
}

function toggleChapter(chapterId: number) {
  form.value.selectedChapterIds[chapterId] = !form.value.selectedChapterIds[chapterId]
}

async function loadClasses() {
  try {
    const teacherId = userStore.userInfo?.userId
    if (!teacherId) return
    const res = await getClassesByTeacher(teacherId)
    classList.value = res.list
  } catch { /* ignore */ }
}

async function loadCourses(classId: number) {
  try {
    const res = await getCoursesByClass(classId)
    courseList.value = res
  } catch {
    courseList.value = []
  }
}

async function loadChapters(courseId: number) {
  try {
    chapterList.value = await getChapters(courseId)
  } catch {
    chapterList.value = []
  }
}

async function loadCoursewares(courseId: number) {
  try {
    const res = await getCoursewareList({ courseId, page: 1, size: 50 })
    coursewareList.value = res.list.filter(cw => cw.processStatus === 'completed')
  } catch {
    coursewareList.value = []
  }
}

async function saveDraft() {
  if (!form.value.title.trim()) {
    uni.showToast({ title: '请输入作业名称', icon: 'none' })
    return
  }
  try {
    const teacherId = userStore.userInfo?.userId
    const teacherName = userStore.userInfo?.name || userStore.userInfo?.username || ''
    const data: Partial<TemplateHomework> = {
      title: form.value.title,
      classId: form.value.classId || undefined,
      courseId: form.value.courseId || undefined,
      chapterId: selectedChapterIds.length > 0 ? selectedChapterIds[0] : undefined,
      description: form.value.description,
      attachments: homeworkAttachments.value.length > 0 ? JSON.stringify(homeworkAttachments.value) : undefined,
      teacherId,
      teacherName,
      status: 'draft'
    }
    if (isEdit.value && form.value.id) {
      await updateTemplate(form.value.id, data)
      uni.showToast({ title: '保存成功', icon: 'success' })
    } else {
      const created = await createTemplate(data)
      form.value.id = created.id
      isEdit.value = true
      uni.showToast({ title: '保存成功', icon: 'success' })
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '保存失败'
    uni.showToast({ title: msg, icon: 'none' })
  }
}

async function handlePublish() {
  if (!canPublish.value) {
    uni.showToast({ title: '请填写作业名称、教学班和内容', icon: 'none' })
    return
  }
  try {
    // 先保存
    await saveDraft()
    if (form.value.id) {
      await publishTemplate(form.value.id)
      form.value.status = 'published'
      uni.showToast({ title: '发布成功', icon: 'success' })
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '发布失败'
    uni.showToast({ title: msg, icon: 'none' })
  }
}

async function aiGenerate() {
  if (!form.value.title.trim()) {
    uni.showToast({ title: '请先输入作业名称', icon: 'none' })
    return
  }
  uni.showLoading({ title: 'AI 生成中...' })
  try {
    let message = `请根据以下信息生成作业：\n作业名称：${form.value.title}`
    if (form.value.classId) {
      message += `\n教学班：${classLabel.value}`
    }
    if (form.value.courseId) {
      message += `\n课程：${courseLabel.value}`
    }
    if (selectedChapterIds.value.length > 0) {
      message += `\n指定章节：${selectedChapterLabels.value.join('、')}`
    }
    // 课件信息
    if (coursewareList.value.length > 0) {
      message += `\n可用课件：`
      for (const cw of coursewareList.value) {
        message += `\n  - ${cw.title}（${cw.totalPages}页）`
      }
    }
    if (form.value.description) {
      message += `\n补充说明：${form.value.description}`
    }

    const { generateHomeworkAI } = await import('@/api/homework')
    // 教材一律由教学班绑定：后端按 class_id 取本班教材做检索
    const result = await generateHomeworkAI(message, null, form.value.classId)
    aiWarning.value = result.warning || ''
    form.value.description = result.content
    // 将 markdown 加入统一附件列表
    const existingMdIndex = homeworkAttachments.value.findIndex(a => a.name === '作业附件.md')
    if (existingMdIndex >= 0) {
      homeworkAttachments.value[existingMdIndex] = { name: '作业附件.md', type: 'text/markdown', content: result.markdown }
    } else {
      homeworkAttachments.value.push({ name: '作业附件.md', type: 'text/markdown', content: result.markdown })
    }
    uni.hideLoading()
    if (result.warning) {
      uni.showToast({ title: result.warning, icon: 'none', duration: 4000 })
    } else {
      uni.showToast({ title: 'AI 内容已生成', icon: 'success' })
    }
  } catch {
    uni.hideLoading()
    uni.showToast({ title: 'AI 生成失败，请稍后重试', icon: 'none' })
  }
}

function formatAttSize(att: AttachmentItem): string {
  if (att.content) {
    const bytes = new Blob([att.content]).size
    if (bytes < 1024) return bytes + 'B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
  }
  if (att.downloadUrl) {
    // 上传的文件，显示文件类型
    const ext = att.name.split('.').pop()?.toUpperCase() || 'FILE'
    return ext
  }
  return ''
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
    setTimeout(() => {
      document.body.removeChild(a)
    }, 200)
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

function removeAttachmentItem(index: number) {
  homeworkAttachments.value.splice(index, 1)
}

async function exportPdf() {
  const mdAtt = homeworkAttachments.value.find(a => a.type === 'text/markdown')
  if (!mdAtt || !mdAtt.content) return
  // #ifdef H5
  uni.showLoading({ title: '导出 PDF 中...' })
  try {
    const htmlContent = await marked.parse(mdAtt.content)
    const fullHtml = buildPdfHtml(form.value.title, htmlContent)
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      uni.hideLoading()
      uni.showToast({ title: '请允许弹窗后重试', icon: 'none' })
      return
    }
    printWindow.document.write(fullHtml)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
    uni.hideLoading()
    uni.showToast({ title: 'PDF 导出成功', icon: 'success' })
  } catch {
    uni.hideLoading()
    uni.showToast({ title: 'PDF 导出失败', icon: 'none' })
  }
  // #endif
}

function buildPdfHtml(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: "Microsoft YaHei", "SimSun", sans-serif; font-size: 14px; line-height: 1.8; color: #333; padding: 10px; }
    h1 { font-size: 20px; text-align: center; color: #1a1a2e; margin: 16px 0 10px; }
    h2 { font-size: 17px; color: #1a1a2e; border-bottom: 1px solid #eee; padding-bottom: 4px; margin: 14px 0 8px; }
    h3 { font-size: 15px; color: #333; margin: 10px 0 6px; }
    blockquote { background: #f5f7fa; padding: 6px 10px; margin: 6px 0; border-left: 3px solid #1a1a2e; color: #666; font-size: 13px; }
    hr { border: none; border-top: 1px solid #eee; margin: 10px 0; }
    ul, ol { padding-left: 20px; margin: 4px 0; }
    li { margin: 2px 0; }
    strong { color: #1a1a2e; }
    p { margin: 4px 0; }
    code { background: #f0f0f0; padding: 1px 4px; border-radius: 3px; font-size: 13px; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 6px; overflow-x: auto; font-size: 13px; }
    table { border-collapse: collapse; width: 100%; margin: 8px 0; }
    th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>${content}</body>
</html>`
}

function handleAttachmentUpload() {
  // #ifdef H5
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.jpg,.png,.jpeg,.md'
  input.multiple = true
  input.onchange = (e: Event) => {
    const target = e.target as HTMLInputElement
    const files = target.files
    if (!files) return

    const homeworkId = form.value.id || 0
    uni.showLoading({ title: '上传中...' })
    let completed = 0
    const total = files.length

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      // markdown 文件仍用 readAsText 读取内容
      if (file.name.endsWith('.md')) {
        const reader = new FileReader()
        reader.onload = (re) => {
          homeworkAttachments.value.push({
            name: file.name,
            type: 'text/markdown',
            content: re.target?.result as string
          })
          completed++
          if (completed >= total) {
            uni.hideLoading()
          }
        }
        reader.readAsText(file)
        continue
      }
      // 其他文件通过 FormData 上传到后端 → 云存储
      const formData = new FormData()
      formData.append('file', file)
      const xhr = new XMLHttpRequest()
      xhr.open('POST', 'http://localhost:8084/api/homework/attachments/upload?homeworkId=' + homeworkId)
      xhr.setRequestHeader('Authorization', uni.getStorageSync('token') || '')
      xhr.onload = () => {
        completed++
        if (xhr.status === 200) {
          try {
            const res = JSON.parse(xhr.responseText)
            if (res.code === 200 && res.data) {
              homeworkAttachments.value.push({
                name: res.data.fileName,
                type: res.data.fileType,
                downloadUrl: res.data.downloadUrl
              })
            }
          } catch { /* ignore */ }
        }
        if (completed >= total) {
          uni.hideLoading()
          uni.showToast({ title: '上传完成', icon: 'success' })
        }
      }
      xhr.onerror = () => {
        completed++
        if (completed >= total) {
          uni.hideLoading()
        }
      }
      xhr.send(formData)
    }
  }
  input.click()
  // #endif
}

onLoad(async (options: Record<string, string> | undefined) => {
  await loadClasses()
  if (options && options.id) {
    isEdit.value = true
    try {
      const hw = await getTemplate(Number(options.id))
      form.value = {
        id: hw.id,
        title: hw.title,
        classId: hw.classId,
        courseId: hw.courseId,
        chapterIds: [],
        selectedChapterIds: {},
        startPage: hw.startPage,
        endPage: hw.endPage,
        description: hw.description || '',
        status: hw.status
      }
      if (hw.chapterId) {
        form.value.selectedChapterIds[hw.chapterId] = true
      }
      // 恢复附件列表
      if (hw.attachments) {
        try {
          homeworkAttachments.value = JSON.parse(hw.attachments)
        } catch { /* ignore parse error */ }
      }
      if (hw.classId) {
        await loadCourses(hw.classId)
      }
      if (hw.courseId) {
        await loadChapters(hw.courseId)
        await loadCoursewares(hw.courseId)
      }
    } catch {
      uni.showToast({ title: '加载作业失败', icon: 'none' })
    }
  }
})
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 720px;
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
}

.page-kicker {
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
}

.page-title {
  font-family: var(--font-display);
  font-size: 23px;
  line-height: 1.2;
  letter-spacing: 0.02em;
  color: var(--ink);
}

.page-sub {
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--muted);
}

/* ========== 表单卡片 ========== */
.form-card {
  padding: 24px 26px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
}

.form-group {
  margin-bottom: 18px;
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

.form-input {
  width: 100%;
  height: 42px;
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
  min-height: 200px;
  padding: 12px;
  box-sizing: border-box;
  font-size: 13.5px;
  line-height: 1.8;
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

.picker-display {
  width: 100%;
  height: 42px;
  padding: 0 12px;
  box-sizing: border-box;
  font-size: 13.5px;
  line-height: 40px;
  color: var(--ink-2);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 10px;
}

/* ========== AI 操作 ========== */
.btn-ai-row {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.ai-warning {
  margin-top: 10px;
  padding: 10px 12px;
  background: #FDF6E7;
  border: 1px solid rgba(186, 132, 30, 0.28);
  border-radius: 10px;
}

.ai-warning-text {
  font-size: 12px;
  line-height: 1.6;
  color: #8a5b12;
}

.btn-ai {
  flex: 1;
  margin: 0;
  height: 36px;
  line-height: 34px;
  padding: 0 14px;
  font-size: 12.5px;
  color: var(--accent);
  background: transparent;
  border: 1px solid var(--accent);
  border-radius: 10px;
  transition: all 0.18s ease;
}

.btn-ai:hover {
  color: var(--accent-ink);
  background: var(--accent-soft);
}

.btn-pdf {
  color: var(--ink-2);
  border-color: var(--line-strong);
}

.btn-pdf:hover {
  color: var(--ink);
  background: var(--paper-deep);
}

.btn-pdf[disabled] {
  opacity: 0.4;
}

/* ========== 状态提示 ========== */
.form-tip {
  margin: 18px 0;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

.tip-text {
  display: inline-block;
  padding: 5px 12px;
  font-size: 11.5px;
  letter-spacing: 0.04em;
  border-radius: 999px;
}

.tip-text.draft {
  color: var(--warning);
  background: rgba(173, 116, 27, 0.10);
}

.tip-text.published {
  color: var(--success);
  background: rgba(63, 107, 82, 0.10);
}

/* ========== 底部操作 ========== */
.form-actions {
  display: flex;
  gap: 12px;
}

.btn-save {
  flex: 1;
  margin: 0;
  height: 42px;
  line-height: 40px;
  padding: 0 16px;
  font-size: 13.5px;
  color: var(--ink-2);
  background: transparent;
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  transition: all 0.18s ease;
}

.btn-save:hover {
  color: var(--ink);
  border-color: var(--ink-2);
}

.btn-publish {
  flex: 1;
  margin: 0;
  height: 42px;
  line-height: 40px;
  padding: 0 16px;
  font-size: 13.5px;
  letter-spacing: 0.04em;
  color: #F8F3E8;
  background: var(--ink);
  border: 1px solid var(--ink);
  border-radius: 10px;
  transition: background 0.18s ease;
}

.btn-publish:hover {
  background: #24334F;
}

.btn-publish[disabled] {
  opacity: 0.4;
}

/* ========== 教材页数 ========== */
.page-range-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-input {
  flex: 1;
}

.page-separator {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--muted);
}

/* ========== 章节多选 ========== */
.chapter-checkbox-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chapter-checkbox-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-bottom: 1px solid var(--line);
  cursor: pointer;
  transition: background 0.16s ease;
}

.chapter-checkbox-item:last-child {
  border-bottom: none;
}

.chapter-checkbox-item:hover {
  background: #FDF8F0;
}

.checkbox-box {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line-strong);
  border-radius: 4px;
  background: var(--surface);
  transition: all 0.16s ease;
}

.checkbox-box.checked {
  background: var(--ink);
  border-color: var(--ink);
}

.check-mark {
  font-size: 11px;
  font-weight: 600;
  color: #F8F3E8;
}

.checkbox-label {
  font-size: 13px;
  color: var(--ink);
}

.checkbox-pages {
  font-size: 11px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

/* ========== 课件标签 ========== */
.courseware-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.courseware-tag {
  padding: 4px 10px;
  font-size: 11.5px;
  color: var(--ink-2);
  background: #F9F5ED;
  border: 1px solid var(--line);
  border-radius: 999px;
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
  padding: 7px 12px;
  background: var(--surface-raised);
  border: 1px solid var(--line);
  border-radius: 8px;
}

.md-attachment {
  background: var(--accent-soft);
  border-color: rgba(180, 83, 42, 0.28);
  cursor: pointer;
}

.attachment-name {
  max-width: 180px;
  font-size: 12.5px;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-size {
  flex-shrink: 0;
  font-size: 10.5px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.attachment-remove {
  flex-shrink: 0;
  padding: 0 2px;
  font-size: 13px;
  color: var(--danger);
  cursor: pointer;
}

.btn-upload-attach {
  margin: 0;
  height: 34px;
  line-height: 32px;
  padding: 0 14px;
  font-size: 12px;
  color: var(--ink-2);
  background: transparent;
  border: 1px dashed var(--line-strong);
  border-radius: 10px;
  transition: all 0.16s ease;
}

.btn-upload-attach:hover {
  color: var(--accent);
  border-color: var(--accent);
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
    font-size: 19px;
  }
  .form-card {
    padding: 18px 16px;
  }
  .btn-ai-row {
    flex-direction: column;
  }
  .btn-ai {
    width: 100%;
  }
  .form-actions {
    flex-direction: column-reverse;
  }
  .btn-save,
  .btn-publish {
    width: 100%;
  }
  .attachment-name {
    max-width: 130px;
  }
}
</style>
