<!-- pages/student/course/index.vue - 学生端：教学班 → 课程 → 章节 → 课件 / 知识图谱 -->
<template>
  <AppLayout>
    <view class="page-container">
      <view class="page-header">
        <view class="header-left">
          <text class="header-kicker">MY COURSES</text>
          <text class="page-title">我的课程</text>
          <text class="header-sub">教学班 · 课程 · 章节 · 课件与知识图谱</text>
        </view>
        <button class="btn-select" @click="openSelectModal">选课</button>
      </view>

      <!-- 教学班选择 -->
      <view v-if="classList.length" class="class-strip">
        <view
          v-for="cls in classList"
          :key="cls.id"
          :class="['class-chip', { 'is-active': activeClassId === cls.id }]"
          @click="selectClass(cls.id)"
        >
          <text class="class-chip-name">{{ cls.name }}</text>
          <text class="class-chip-sub">{{ cls.teacherNames || cls.teacherName || '未分配教师' }}</text>
        </view>
      </view>

      <view v-if="!classList.length && !loading" class="empty-state">
        <view class="empty-seal">课</view>
        <text class="empty-text">暂未加入任何教学班，点击右上角“选课”</text>
      </view>

      <template v-else-if="activeClassId">
        <!-- 教学班教材 -->
        <view class="panel">
          <view class="panel-head">
            <view class="panel-title-row">
              <view class="panel-index">01</view>
              <text class="panel-title">教学班教材</text>
            </view>
            <text class="panel-hint">教材由教学班绑定，全班共享</text>
          </view>
          <view v-if="classTextbooks.length" class="textbook-list">
            <view v-for="tb in classTextbooks" :key="tb.id" class="textbook-item">
              <view class="textbook-main">
                <text class="textbook-title">{{ tb.title || '未命名教材' }}</text>
                <text class="textbook-meta">{{ tb.author || '作者未填写' }} · {{ tb.totalPages }} 页</text>
              </view>
              <text class="link-action" @click="previewTextbook(tb)">预览</text>
            </view>
          </view>
          <text v-else class="panel-empty">该教学班暂未绑定教材</text>
        </view>

        <!-- 课程与章节 -->
        <view class="panel">
          <view class="panel-head">
            <view class="panel-title-row">
              <view class="panel-index">02</view>
              <text class="panel-title">教学班课程</text>
            </view>
            <text class="panel-hint">点击课程进入章节</text>
          </view>

          <view v-if="courses.length" class="course-tabs">
            <view
              v-for="course in courses"
              :key="course.id"
              :class="['course-tab', { 'is-active': activeCourseId === course.id }]"
              @click="selectCourse(course)"
            >
              <text class="course-tab-name">{{ course.name }}</text>
              <text class="course-tab-desc">{{ course.description || '查看章节与课件' }}</text>
            </view>
          </view>
          <text v-else class="panel-empty">该教学班暂未绑定课程</text>

          <view v-if="activeCourseId" class="chapter-area">
            <view class="chapter-head">
              <text class="chapter-head-title">课程章节</text>
              <text class="chapter-head-sub">{{ chapters.length }} 个章节</text>
            </view>
            <view v-if="chapters.length" class="chapter-list">
              <view
                v-for="(ch, index) in chapters"
                :key="ch.id"
                :class="['chapter-row', { 'is-active': activeChapterId === ch.id }]"
                @click="selectChapter(ch.id)"
              >
                <view class="chapter-order">{{ (index + 1).toString().padStart(2, '0') }}</view>
                <view class="chapter-text">
                  <text class="chapter-title">{{ ch.title }}</text>
                  <text class="chapter-desc">{{ ch.description || '暂无章节说明' }}</text>
                </view>
                <text class="chapter-count">{{ coursewaresOfChapter(ch.id).length }} 课件</text>
              </view>
            </view>
            <text v-else class="panel-empty">该课程暂未创建章节</text>

            <!-- 章节课件 -->
            <view v-if="activeChapterId" class="chapter-detail">
              <view class="detail-head">
                <text class="detail-title">{{ activeChapter?.title }} · 课件</text>
                <text class="detail-sub">课件绑定课程章节，可直接预览</text>
              </view>
              <view v-if="activeChapterCoursewares.length" class="courseware-list">
                <view v-for="cw in activeChapterCoursewares" :key="cw.id" class="courseware-item">
                  <view class="courseware-icon">{{ fileBadge(cw.fileType) }}</view>
                  <view class="courseware-main">
                    <text class="courseware-title">{{ cw.title }}</text>
                    <text class="courseware-meta">{{ cw.fileType.toUpperCase() }} · {{ cw.totalPages }} 页</text>
                  </view>
                  <text class="link-action" @click="previewCourseware(cw)">预览</text>
                </view>
              </view>
              <text v-else class="panel-empty">本章暂未上传课件</text>
            </view>

            <!-- 知识图谱 -->
            <view class="graph-area">
              <KnowledgeGraph :graph="graph">
                <template #empty>
                  <text class="panel-empty">知识图谱由教师生成后，将在此展示课程全部知识点与关联。</text>
                </template>
              </KnowledgeGraph>
            </view>
          </view>
        </view>
      </template>
    </view>

    <!-- ==================== 选教学班弹窗 ==================== -->
    <view v-if="selectVisible" class="modal-overlay" @click="closeSelectModal">
      <view class="modal-dialog" @click.stop>
        <view class="modal-header">
          <text class="modal-title">选教学班</text>
          <text class="modal-close" @click="closeSelectModal">✕</text>
        </view>

        <view class="modal-search">
          <input
            class="search-input"
            v-model="searchKeyword"
            placeholder="搜索教学班名称"
            @confirm="handleSearch"
          />
          <button class="btn-search" @click="handleSearch">搜索</button>
        </view>

        <view class="modal-body">
          <view v-if="selectLoading" class="loading-state">
            <text class="loading-text">加载中...</text>
          </view>
          <view v-else-if="allClasses.length === 0" class="empty-state">
            <text class="empty-text">暂无教学班</text>
          </view>
          <view v-else class="class-list">
            <view v-for="c in allClasses" :key="c.id" class="class-row">
              <text class="col-name">{{ c.name }}</text>
              <text class="col-id">{{ c.id }}</text>
              <text class="col-teacher">{{ c.teacherName || '未分配' }}</text>
              <button
                class="btn-enroll"
                :class="{ 'btn-drop': joinedIds.includes(c.id) }"
                @click="toggleJoin(c)"
              >{{ joinedIds.includes(c.id) ? '退课' : '选课' }}</button>
            </view>
          </view>
        </view>

        <view class="modal-footer-pagination">
          <text class="page-info">{{ selectPage }} / {{ selectTotalPages }}</text>
          <view class="page-nav">
            <text class="page-btn" :class="{ disabled: selectPage <= 1 }" @click="goSelectPage(selectPage - 1)">上一页</text>
            <text class="page-btn" :class="{ disabled: selectPage >= selectTotalPages }" @click="goSelectPage(selectPage + 1)">下一页</text>
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
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AppLayout from '@/components/layout/AppLayout.vue'
import PdfPreview from '@/components/PdfPreview.vue'
import KnowledgeGraph from '@/components/course/KnowledgeGraph.vue'
import { useUserStore } from '@/store/user'
import { getStudentClasses, getClassPage, enrollClass, removeClassStudent, type ClassInfo } from '@/api/class'
import { getCoursesByClass, getChapters, getKnowledgeGraph, type CourseInfo, type ChapterInfo, type KnowledgeGraph as KnowledgeGraphType } from '@/api/course'
import { getCoursewareList, type CoursewareInfo } from '@/api/courseware'
import { getTextbookPage, type TextbookInfo } from '@/api/textbook'

const BOOK_API_BASE = 'http://localhost:8083'

const userStore = useUserStore()
const loading = ref(false)
const classList = ref<ClassInfo[]>([])
const activeClassId = ref<number | null>(null)
const classTextbooks = ref<TextbookInfo[]>([])

const courses = ref<CourseInfo[]>([])
const activeCourseId = ref<number | null>(null)
const chapters = ref<ChapterInfo[]>([])
const activeChapterId = ref<number | null>(null)
const allCoursewares = ref<CoursewareInfo[]>([])
const graph = ref<KnowledgeGraphType | null>(null)

const activeChapter = computed(() => chapters.value.find(ch => ch.id === activeChapterId.value) || null)
const activeChapterCoursewares = computed(() =>
  allCoursewares.value.filter(cw => cw.chapterId === activeChapterId.value)
)

function coursewaresOfChapter(chapterId: number) {
  return allCoursewares.value.filter(cw => cw.chapterId === chapterId)
}

// ==================== 加载教学班与课程 ====================

async function fetchClasses() {
  const userId = userStore.userInfo?.userId
  if (!userId) {
    classList.value = []
    return
  }
  loading.value = true
  try {
    const list = await getStudentClasses(userId)
    classList.value = list || []
    if (!activeClassId.value || !classList.value.some(c => c.id === activeClassId.value)) {
      activeClassId.value = classList.value[0]?.id ?? null
    }
    if (activeClassId.value) {
      await loadClassDetail(activeClassId.value)
    }
  } catch {
    classList.value = []
  } finally {
    loading.value = false
  }
}

async function loadClassDetail(classId: number) {
  classTextbooks.value = []
  courses.value = []
  activeCourseId.value = null
  chapters.value = []
  activeChapterId.value = null
  allCoursewares.value = []
  graph.value = null

  const [textbookResult, courseResult] = await Promise.allSettled([
    getTextbookPage({ classId, page: 1, size: 20 }),
    getCoursesByClass(classId)
  ])
  if (textbookResult.status === 'fulfilled') {
    classTextbooks.value = textbookResult.value.list || []
  }
  if (courseResult.status === 'fulfilled') {
    courses.value = courseResult.value || []
    if (courses.value.length) {
      await selectCourse(courses.value[0])
    }
  }
}

async function selectClass(classId: number) {
  if (activeClassId.value === classId) return
  activeClassId.value = classId
  await loadClassDetail(classId)
}

async function selectCourse(course: CourseInfo) {
  if (activeCourseId.value === course.id) return
  activeCourseId.value = course.id
  activeChapterId.value = null
  chapters.value = []
  allCoursewares.value = []
  graph.value = null
  try {
    const [chapterList, coursewarePage] = await Promise.all([
      getChapters(course.id),
      getCoursewareList({ courseId: course.id, page: 1, size: 100 })
    ])
    chapters.value = chapterList || []
    allCoursewares.value = (coursewarePage.list || []).filter(cw => cw.processStatus === 'completed')
    if (chapters.value.length) {
      activeChapterId.value = chapters.value[0].id
    }
  } catch {
    /* 保持空态 */
  }
  try {
    graph.value = await getKnowledgeGraph(course.id)
  } catch {
    graph.value = null
  }
}

function selectChapter(chapterId: number) {
  activeChapterId.value = chapterId
}

// ==================== 预览 ====================

const previewVisible = ref(false)
const previewFileId = ref('')
const previewBaseUrl = ref('')
const previewTotalPages = ref(0)
const previewTitle = ref('')

function previewTextbook(tb: TextbookInfo) {
  if (tb.fileType === 'pdf' || tb.totalPages > 0) {
    openPdfPreview(tb.id, BOOK_API_BASE + '/api/textbooks/' + tb.id, tb.totalPages, tb.title || '教材预览')
    return
  }
  // #ifdef H5
  window.open(BOOK_API_BASE + '/api/textbooks/' + tb.id + '/file', '_blank')
  // #endif
}

function previewCourseware(cw: CoursewareInfo) {
  if (cw.fileType === 'pdf') {
    openPdfPreview(cw.id, BOOK_API_BASE + '/api/courseware/' + cw.id, cw.totalPages, cw.title)
    return
  }
  // #ifdef H5
  window.open(BOOK_API_BASE + '/api/courseware/' + cw.id + '/file', '_blank')
  // #endif
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

function fileBadge(fileType: string) {
  const type = (fileType || '').toLowerCase()
  if (type === 'pdf') return 'PDF'
  if (type === 'ppt' || type === 'pptx') return 'PPT'
  if (type === 'doc' || type === 'docx') return 'DOC'
  return 'FILE'
}

// ==================== 选教学班弹窗 ====================

const selectVisible = ref(false)
const selectLoading = ref(false)
const searchKeyword = ref('')
const allClasses = ref<ClassInfo[]>([])
const joinedIds = ref<number[]>([])
const selectPage = ref(1)
const selectTotalPages = ref(1)
const pageSize = 10

async function openSelectModal() {
  selectVisible.value = true
  selectPage.value = 1
  searchKeyword.value = ''
  await Promise.all([fetchAllClasses(), fetchJoinedIds()])
}

function closeSelectModal() {
  selectVisible.value = false
}

async function fetchAllClasses() {
  selectLoading.value = true
  try {
    const res = await getClassPage({
      pageNum: selectPage.value,
      pageSize: pageSize,
      keyword: searchKeyword.value || undefined,
      status: 'approved'
    })
    allClasses.value = res.list
    selectTotalPages.value = res.totalPages
  } catch {
    allClasses.value = []
  } finally {
    selectLoading.value = false
  }
}

async function fetchJoinedIds() {
  const userId = userStore.userInfo?.userId
  if (!userId) return
  try {
    const classes = await getStudentClasses(userId)
    joinedIds.value = classes.map((c: ClassInfo) => c.id)
  } catch {
    joinedIds.value = []
  }
}

async function handleSearch() {
  selectPage.value = 1
  await fetchAllClasses()
}

function goSelectPage(page: number) {
  if (page < 1 || page > selectTotalPages.value) return
  selectPage.value = page
  fetchAllClasses()
}

async function toggleJoin(cls: ClassInfo) {
  const userId = userStore.userInfo?.userId
  if (!userId) return
  const userName = userStore.userInfo?.name || userStore.userInfo?.username || ''

  uni.showLoading({ title: '处理中...' })
  try {
    if (joinedIds.value.includes(cls.id)) {
      await removeClassStudent(cls.id, userId)
      joinedIds.value = joinedIds.value.filter((id: number) => id !== cls.id)
      uni.hideLoading()
      uni.showToast({ title: '退课成功', icon: 'success' })
    } else {
      await enrollClass(cls.id, userId, userName)
      joinedIds.value = [...joinedIds.value, cls.id]
      uni.hideLoading()
      uni.showToast({ title: '选课成功', icon: 'success' })
    }
    userStore.refreshClassIds(true)
    await fetchClasses()
  } catch (err: unknown) {
    uni.hideLoading()
    const msg = err instanceof Error ? err.message : '操作失败'
    uni.showToast({ title: msg, icon: 'none' })
  }
}

onShow(() => {
  fetchClasses()
})
</script>

<style scoped>
/* ========== 页面骨架 ========== */
.page-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-sizing: border-box;
}

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

button::after {
  border: none;
}

.btn-select {
  margin: 0;
  height: 38px;
  line-height: 38px;
  padding: 0 22px;
  border: none;
  border-radius: 10px;
  background: var(--ink);
  color: #F7F2E7;
  font-size: 13px;
  letter-spacing: 0.06em;
  box-shadow: 0 14px 26px -18px rgba(23, 35, 59, 0.7);
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-select:hover {
  background: #24334F;
  transform: translateY(-1px);
  box-shadow: 0 16px 30px -18px rgba(23, 35, 59, 0.8);
}

/* ========== 教学班选择 ========== */
.class-strip {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 2px 2px 6px;
}

.class-chip {
  flex: 0 0 auto;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
  cursor: pointer;
  transition: all 0.18s ease;
}

.class-chip:hover {
  border-color: var(--line-strong);
}

.class-chip.is-active {
  border-color: var(--ink);
  background: var(--ink);
}

.class-chip-name {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}

.class-chip.is-active .class-chip-name {
  color: #F7F2E7;
}

.class-chip-sub {
  font-size: 11px;
  color: var(--muted);
}

.class-chip.is-active .class-chip-sub {
  color: rgba(247, 242, 231, 0.7);
}

/* ========== 面板 ========== */
.panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow-soft);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}

.panel-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid rgba(180, 83, 42, 0.18);
  background: var(--accent-soft);
  color: var(--accent-ink);
  font-family: var(--font-mono);
  font-size: 11px;
}

.panel-title {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
}

.panel-hint {
  font-size: 11.5px;
  letter-spacing: 0.04em;
  color: var(--muted);
}

.panel-empty {
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--muted);
}

/* ========== 教材列表 ========== */
.textbook-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
}

.textbook-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: rgba(235, 229, 217, 0.32);
}

.textbook-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.textbook-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.textbook-meta {
  font-size: 11px;
  color: var(--muted);
}

.link-action {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--accent);
  cursor: pointer;
  border-bottom: 1px solid transparent;
  transition: border-color 0.18s ease, color 0.18s ease;
}

.link-action:hover {
  color: var(--accent-ink);
  border-bottom-color: var(--accent);
}

/* ========== 课程 ========== */
.course-tabs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}

.course-tab {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 13px 15px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--paper);
  cursor: pointer;
  transition: all 0.18s ease;
}

.course-tab:hover {
  border-color: var(--accent);
}

.course-tab.is-active {
  border-color: var(--ink);
  background: var(--surface);
  box-shadow: inset 3px 0 0 var(--accent);
}

.course-tab-name {
  font-family: var(--font-display);
  font-size: 14.5px;
  font-weight: 600;
  color: var(--ink);
}

.course-tab-desc {
  font-size: 11.5px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ========== 章节 ========== */
.chapter-area {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 4px;
}

.chapter-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.chapter-head-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}

.chapter-head-sub {
  font-size: 11.5px;
  color: var(--muted);
}

.chapter-list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
}

.chapter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 14px;
  background: var(--surface);
  border-bottom: 1px solid var(--line);
  cursor: pointer;
  transition: background 0.16s ease;
}

.chapter-row:last-child {
  border-bottom: none;
}

.chapter-row:hover {
  background: rgba(244, 240, 232, 0.6);
}

.chapter-row.is-active {
  background: var(--accent-soft);
}

.chapter-order {
  flex-shrink: 0;
  width: 30px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--muted);
}

.chapter-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.chapter-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink);
}

.chapter-desc {
  font-size: 11.5px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chapter-count {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--muted);
}

.chapter-detail {
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: rgba(235, 229, 217, 0.28);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.detail-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink);
}

.detail-sub {
  font-size: 11px;
  color: var(--muted);
}

.courseware-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.courseware-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--surface);
}

.courseware-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 6px;
  border: 1px solid rgba(33, 74, 106, 0.14);
  background: rgba(33, 74, 106, 0.07);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.04em;
}

.courseware-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.courseware-title {
  font-size: 13px;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.courseware-meta {
  font-size: 10.5px;
  color: var(--muted);
}

.graph-area {
  margin-top: 4px;
}

/* ========== 空状态 ========== */
.empty-state {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 46px 28px;
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

/* ========== 选课弹窗 ========== */
.modal-overlay {
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

.modal-dialog {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 680px;
  max-height: 84vh;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-lift);
  animation: dialogIn 0.2s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes dialogIn {
  from { opacity: 0; transform: translateY(10px) scale(0.99); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-header {
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 20px 24px 14px;
  border-bottom: 1px solid var(--line);
}

.modal-title {
  flex: 1;
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--ink);
}

.modal-close {
  position: absolute;
  top: 14px;
  right: 16px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 16px;
  color: var(--muted);
  cursor: pointer;
  transition: color 0.18s ease, background 0.18s ease;
}

.modal-close:hover {
  color: var(--accent-ink);
  background: var(--accent-soft);
}

.modal-search {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
}

.search-input {
  flex: 1;
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #FDFBF6;
  font-size: 13.5px;
  color: var(--ink);
  box-sizing: border-box;
  transition: border-color 0.18s ease, background 0.18s ease;
}

.search-input:focus {
  border-color: var(--accent);
  background: var(--surface);
  outline: none;
}

.btn-search {
  flex-shrink: 0;
  margin: 0;
  height: 38px;
  line-height: 38px;
  padding: 0 18px;
  border: none;
  border-radius: 10px;
  background: var(--ink);
  color: #F7F2E7;
  font-size: 13px;
  letter-spacing: 0.04em;
  transition: background 0.18s ease;
}

.btn-search:hover {
  background: #24334F;
}

.modal-body {
  flex: 1;
  padding: 0 24px 8px;
  overflow-y: auto;
}

.loading-state {
  padding: 44px 0;
  text-align: center;
}

.loading-text {
  font-size: 13px;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.class-list {
  display: flex;
  flex-direction: column;
}

.class-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 6px;
  border-bottom: 1px solid var(--line);
  transition: background 0.16s ease;
}

.class-row:hover {
  background: rgba(244, 240, 232, 0.6);
}

.class-row:last-child {
  border-bottom: none;
}

.col-name {
  flex: 2;
  min-width: 0;
  font-size: 13.5px;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-id {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 11.5px;
  letter-spacing: 0.04em;
  color: var(--muted);
}

.col-teacher {
  flex: 1;
  font-size: 12.5px;
  color: var(--ink-2);
}

.btn-enroll {
  flex-shrink: 0;
  margin: 0;
  height: 32px;
  line-height: 32px;
  padding: 0 16px;
  border: 1px solid var(--ink);
  border-radius: 9px;
  background: var(--ink);
  color: #F7F2E7;
  font-size: 12px;
  letter-spacing: 0.04em;
  transition: all 0.18s ease;
}

.btn-enroll:hover {
  background: #24334F;
  border-color: #24334F;
}

.btn-enroll.btn-drop {
  background: transparent;
  border-color: var(--danger);
  color: var(--danger);
}

.btn-enroll.btn-drop:hover {
  background: rgba(163, 59, 46, 0.08);
}

.modal-footer-pagination {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px 18px;
  border-top: 1px solid var(--line);
}

.page-info {
  font-family: var(--font-mono);
  font-size: 11.5px;
  letter-spacing: 0.06em;
  color: var(--muted);
}

.page-nav {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-btn {
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 12px;
  color: var(--ink-2);
  cursor: pointer;
  border: 1px solid var(--line);
  transition: all 0.16s ease;
}

.page-btn:hover {
  border-color: var(--accent);
  color: var(--accent-ink);
  background: var(--accent-soft);
}

.page-btn.disabled {
  color: #B9BFC8;
  border-color: var(--line);
  background: transparent;
  cursor: default;
}

.page-btn.disabled:hover {
  border-color: var(--line);
  color: #B9BFC8;
  background: transparent;
}

/* ========== 选课弹窗逻辑（与页面脚本同源） ========== */
@media (max-width: 768px) {
  .page-header {
    align-items: flex-start;
    padding-bottom: 12px;
  }
  .page-title {
    font-size: 22px;
  }
  .btn-select {
    height: 34px;
    line-height: 34px;
    padding: 0 16px;
    font-size: 12px;
  }
  .panel {
    padding: 15px;
  }
  .textbook-list,
  .course-tabs {
    grid-template-columns: 1fr;
  }
  .modal-overlay {
    padding: 12px;
  }
  .modal-dialog {
    max-height: 90vh;
  }
  .modal-header {
    padding: 16px 16px 12px;
  }
  .modal-title {
    font-size: 17px;
  }
  .modal-search {
    padding: 12px 16px;
  }
  .modal-body {
    padding: 0 16px 6px;
  }
  .modal-footer-pagination {
    padding: 10px 16px 14px;
  }
  .class-row {
    gap: 8px;
    padding: 12px 2px;
  }
  .col-id {
    display: none;
  }
  .empty-state {
    padding: 36px 18px;
  }
}
</style>
