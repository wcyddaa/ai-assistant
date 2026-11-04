<!-- pages/teacher/class/index.vue - 教师端我的教学班 -->
<template>
  <AppLayout>
    <view class="page-container">
      <view class="page-header">
        <view class="header-text">
          <text class="page-kicker">TEACHING CLASS</text>
          <text class="page-title">我的教学班</text>
          <text class="page-sub">维护教学班 · 分配学生 · 绑定课程</text>
        </view>
        <button class="btn-add" @click="handleAdd">创建教学班</button>
      </view>

      <!-- 教学班卡片列表 -->
      <view class="card-list">
        <view v-for="c in list" :key="c.id" class="class-card">
          <view class="card-top">
            <view class="card-title-row">
              <text class="class-name">{{ c.name }}</text>
              <text class="status-badge" :class="'status-' + c.status">
                {{ c.status === 'approved' ? '已通过' : c.status === 'pending' ? '待审核' : '草稿' }}
              </text>
              <text v-if="isOwner(c)" class="owner-badge">我创建</text>
            </view>
            <text class="class-desc">{{ c.description || '暂无描述' }}</text>
          </view>
          <view class="card-info">
            <text class="info-item">学生: {{ c.studentCount ?? 0 }}人</text>
            <text class="info-item teacher-line">教师: {{ c.teacherNames || c.teacherName || '未分配' }}</text>
            <view class="card-time">
              <text class="time-text">创建 {{ formatTime(c.createTime) }}</text>
              <text class="time-text">更新 {{ formatTime(c.updateTime) }}</text>
            </view>
          </view>
          <view class="card-actions">
            <text class="action-link" @click="handleStudents(c)">分配学生</text>
            <text class="action-link" @click="handleCourses(c)">绑定课程</text>
            <text class="action-link" @click="handleTextbooks(c)">教材</text>
            <text v-if="isOwner(c) && c.status === 'draft'" class="action-link" @click="handleEdit(c)">编辑</text>
            <text v-if="isOwner(c)" class="action-link danger" @click="handleDelete(c.id)">删除</text>
            <text v-else class="action-link muted">管理员分配</text>
          </view>
        </view>
        <view v-if="list.length === 0 && !loading" class="empty-state">
          <text class="empty-text">暂未绑定教学班</text>
        </view>
      </view>

      <!-- 创建教学班弹窗 -->
      <view v-if="formVisible" class="popup-overlay" @click="closeForm">
        <view class="form-dialog" @click.stop>
          <text class="dialog-x" @click="closeForm">×</text>
          <text class="form-title">创建教学班</text>
          <input class="form-input" v-model="form.name" placeholder="教学班名称" @confirm="submitForm" />
          <input class="form-input" v-model="form.description" placeholder="教学班描述" @confirm="submitForm" />
          <text class="form-hint">创建后为草稿状态，需管理员审核通过</text>
          <view class="form-actions">
            <button class="btn-cancel" @click="closeForm">取消</button>
            <button class="btn-confirm" @click="submitForm">确定</button>
          </view>
        </view>
      </view>

      <!-- 编辑教学班弹窗 -->
      <view v-if="editVisible" class="popup-overlay" @click="closeEdit">
        <view class="form-dialog" @click.stop>
          <text class="dialog-x" @click="closeEdit">×</text>
          <text class="form-title">编辑教学班</text>
          <input class="form-input" v-model="editForm.name" placeholder="教学班名称" @confirm="submitEdit" />
          <input class="form-input" v-model="editForm.description" placeholder="教学班描述" @confirm="submitEdit" />
          <view class="form-actions">
            <button class="btn-cancel" @click="closeEdit">取消</button>
            <button class="btn-confirm" @click="submitEdit">确定</button>
          </view>
        </view>
      </view>

      <!-- 分配学生弹窗 -->
      <view v-if="studentVisible" class="popup-overlay" @click="closeStudentDialog">
        <view class="student-dialog" @click.stop>
          <text class="dialog-x" @click="closeStudentDialog">×</text>
          <text class="form-title">{{ currentClass?.name }} - 分配学生</text>

          <view class="add-student-row">
            <input class="form-input" v-model="newStudentNo" placeholder="输入学生工号" @confirm="addStudent" style="flex:1; margin-bottom:0" />
            <button class="btn-confirm" @click="addStudent">添加</button>
          </view>

          <view class="student-list">
            <text class="section-label">已分配学生 ({{ studentList.length }}人)</text>
            <view v-for="s in studentList" :key="s.studentId" class="student-row">
              <text class="student-name">{{ s.studentName }}</text>
              <view class="student-row-ops">
                <text class="action-link" @click="openStudentDetail(s)">查看详情</text>
                <text class="action-link danger" @click="removeStudent(s.studentId)">移除</text>
              </view>
            </view>
            <view v-if="studentList.length === 0" class="empty-text">暂无学生</view>
          </view>

          <view class="form-actions" style="margin-top: 12px">
            <button class="btn-cancel" @click="closeStudentDialog">关闭</button>
          </view>
        </view>
      </view>

      <!-- 绑定课程弹窗 -->
      <view v-if="courseVisible" class="popup-overlay" @click="closeCourseDialog">
        <view class="student-dialog" @click.stop>
          <text class="dialog-x" @click="closeCourseDialog">×</text>
          <text class="form-title">{{ currentClass?.name }} - 绑定课程</text>

          <view class="add-student-row">
            <picker
              class="course-picker"
              :value="coursePickIndex"
              :range="availableCourses"
              range-key="name"
              @change="handleCoursePick"
            >
              <view class="picker-display">
                <text class="picker-text">{{ selectedCourseName || '选择课程（可绑定其他教师创建的课程）' }}</text>
                <text class="picker-arrow">&#9660;</text>
              </view>
            </picker>
            <button class="btn-confirm" @click="addCourse">绑定</button>
          </view>

          <view class="student-list">
            <text class="section-label">已绑定课程 ({{ courseList.length }}门)</text>
            <view v-for="c in courseList" :key="c.id" class="student-row course-row">
              <view class="course-info">
                <text class="student-name">{{ c.name }}</text>
                <text class="course-sub">{{ c.textbookTitle ? '教材：' + c.textbookTitle : '未关联教材' }}</text>
              </view>
              <text class="action-link danger" @click="removeCourse(c.id)">解绑</text>
            </view>
            <view v-if="courseList.length === 0" class="empty-text">暂无课程</view>
          </view>

          <view class="form-actions" style="margin-top: 12px">
            <button class="btn-cancel" @click="closeCourseDialog">关闭</button>
          </view>
        </view>
      </view>
      <!-- 教学班教材弹窗 -->
      <view v-if="textbookVisible" class="popup-overlay" @click="closeTextbookDialog">
        <view class="student-dialog" @click.stop>
          <text class="dialog-x" @click="closeTextbookDialog">×</text>
          <text class="form-title">{{ currentClass?.name }} - 教学班教材</text>
          <text class="form-hint">教材由管理员统一上传维护，教师只能从教材库中为教学班选择，不能上传或删除教材</text>

          <view class="student-list">
            <text class="section-label">已绑定教材 ({{ textbookList.length }}本)</text>
            <view v-for="tb in textbookList" :key="tb.id" class="student-row">
              <view class="course-info">
                <text class="student-name">{{ tb.title || '未命名教材' }}</text>
                <text class="course-sub">{{ tb.fileType?.toUpperCase() }} · {{ tb.totalPages }} 页</text>
              </view>
              <view class="student-row-ops">
                <text class="action-link" @click="previewTextbookItem(tb)">预览</text>
                <text class="action-link danger" @click="unbindTextbook(tb)">解绑</text>
              </view>
            </view>
            <view v-if="textbookList.length === 0" class="empty-text">暂未绑定教材</view>
          </view>

          <view class="textbook-upload">
            <text class="section-label">从教材库选择教材（管理员统一维护）</text>
            <view v-if="availableTextbooks.length > 0" class="add-student-row">
              <picker
                class="course-picker"
                :value="textbookPickIndex"
                :range="availableTextbooks"
                range-key="title"
                @change="handleTextbookPick"
              >
                <view class="picker-display">
                  <text class="picker-text">{{ selectedTextbookTitle || '选择教材' }}</text>
                  <text class="picker-arrow">&#9660;</text>
                </view>
              </picker>
              <button class="btn-confirm" @click="bindTextbook">绑定</button>
            </view>
            <text v-else class="form-hint">教材库暂无可选教材，请联系管理员上传</text>
          </view>

          <view class="form-actions" style="margin-top: 12px">
            <button class="btn-cancel" @click="closeTextbookDialog">关闭</button>
          </view>
        </view>
      </view>
    </view>

    <!-- 教材 PDF 预览 -->
    <PdfPreview
      v-if="tbPreviewVisible"
      :fileId="tbPreviewId"
      :baseUrl="tbPreviewBaseUrl"
      :totalPages="tbPreviewPages"
      :title="tbPreviewTitle"
      @close="tbPreviewVisible = false"
    />
    <StudentDetailModal
      :visible="detailVisible"
      :class-id="detailClassId"
      :class-name="detailClassName"
      :student="detailStudent"
      :teacher-id="teacherId"
      @close="closeStudentDetail"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AppLayout from '@/components/layout/AppLayout.vue'
import StudentDetailModal from '@/components/teacher/StudentDetailModal.vue'
import PdfPreview from '@/components/PdfPreview.vue'
import { useUserStore } from '@/store/user'
import { getClassesByTeacher, createClass, updateClass, deleteClass, getClassStudents, addClassStudent, removeClassStudent, type ClassInfo, type ClassStudent } from '@/api/class'
import { getCoursePage, getCoursesByClass, addCourseClass, removeCourseClass, type CourseInfo } from '@/api/course'
import { getTextbookPage, bindTextbookClass, type TextbookInfo } from '@/api/textbook'
import { getUserByUsername } from '@/api/user'

interface ClassInfoExt extends ClassInfo {
  studentCount?: number
}

const userStore = useUserStore()
const list = ref<ClassInfoExt[]>([])
const loading = ref(false)

const formVisible = ref(false)
const form = ref<Partial<ClassInfo>>({})

const editVisible = ref(false)
const editForm = ref<Partial<ClassInfo>>({})

const studentVisible = ref(false)
const currentClass = ref<ClassInfoExt | null>(null)
const studentList = ref<ClassStudent[]>([])
const newStudentNo = ref('')

const teacherId = computed(() => Number(userStore.userInfo?.userId) || 0)
const detailVisible = ref(false)
const detailClassId = ref(0)
const detailClassName = ref('')
const detailStudent = ref<ClassStudent | null>(null)

const courseVisible = ref(false)
const courseList = ref<CourseInfo[]>([])
const allCourses = ref<CourseInfo[]>([])
const coursePickIndex = ref(0)
const availableCourses = computed(() =>
  allCourses.value.filter((c) => !courseList.value.some((bound) => bound.id === c.id))
)
const selectedCourseName = computed(() => {
  const idx = coursePickIndex.value
  return idx >= 0 && idx < availableCourses.value.length ? availableCourses.value[idx].name : ''
})

// ==================== 教学班教材 ====================
const BOOK_API_BASE = 'http://localhost:8083'
const textbookVisible = ref(false)
const textbookList = ref<TextbookInfo[]>([])
const allTextbooks = ref<TextbookInfo[]>([])
const textbookPickIndex = ref(0)

// 可选教材 = 教材库中未绑定到其它教学班的教材，且排除当前班已绑定的
const availableTextbooks = computed(() =>
  allTextbooks.value.filter(
    (tb) =>
      (tb.classId == null || tb.classId === currentClass.value?.id) &&
      !textbookList.value.some((bound) => bound.id === tb.id)
  )
)
const selectedTextbookTitle = computed(() => {
  const idx = textbookPickIndex.value
  return idx >= 0 && idx < availableTextbooks.value.length ? availableTextbooks.value[idx].title : ''
})

const tbPreviewVisible = ref(false)
const tbPreviewId = ref('')
const tbPreviewBaseUrl = ref('')
const tbPreviewPages = ref(0)
const tbPreviewTitle = ref('')

async function handleTextbooks(c: ClassInfoExt) {
  currentClass.value = c
  textbookPickIndex.value = 0
  textbookVisible.value = true
  await Promise.all([loadTextbooks(c.id), loadTextbookLibrary()])
}

async function loadTextbooks(classId: number) {
  try {
    const res = await getTextbookPage({ classId, page: 1, size: 50 })
    textbookList.value = res.list || []
  } catch {
    textbookList.value = []
  }
}

async function loadTextbookLibrary() {
  try {
    const res = await getTextbookPage({ page: 1, size: 100 })
    allTextbooks.value = res.list || []
  } catch {
    allTextbooks.value = []
  }
}

function closeTextbookDialog() {
  textbookVisible.value = false
}

function handleTextbookPick(e: { detail: { value: number } }) {
  textbookPickIndex.value = e.detail.value
}

async function bindTextbook() {
  const tb = availableTextbooks.value[textbookPickIndex.value]
  if (!tb || !currentClass.value) {
    uni.showToast({ title: '请选择教材', icon: 'none' })
    return
  }
  try {
    await bindTextbookClass(tb.id, currentClass.value.id, currentClass.value.name)
    uni.showToast({ title: '已为教学班选择教材', icon: 'success' })
    await Promise.all([loadTextbooks(currentClass.value.id), loadTextbookLibrary()])
  } catch {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

function previewTextbookItem(tb: TextbookInfo) {
  tbPreviewId.value = tb.id
  tbPreviewBaseUrl.value = BOOK_API_BASE + '/api/textbooks/' + tb.id
  tbPreviewPages.value = tb.totalPages
  tbPreviewTitle.value = tb.title || '教材预览'
  tbPreviewVisible.value = true
}

async function unbindTextbook(tb: TextbookInfo) {
  try {
    await bindTextbookClass(tb.id, null, '')
    uni.showToast({ title: '已解绑', icon: 'success' })
    if (currentClass.value) {
      await Promise.all([loadTextbooks(currentClass.value.id), loadTextbookLibrary()])
    }
  } catch {
    uni.showToast({ title: '解绑失败', icon: 'none' })
  }
}

function isOwner(c: ClassInfo): boolean {
  return !!c.createrId && c.createrId === userStore.userInfo?.userId
}

function formatTime(time: string): string {
  if (!time) return '-'
  return time.substring(0, 10)
}

async function fetchData() {
  loading.value = true
  try {
    const userId = userStore.userInfo?.userId
    if (!userId) {
      list.value = []
      return
    }
    // 后端已返回学生人数与全部教师姓名，无需逐班查询
    const res = await getClassesByTeacher(userId)
    list.value = res.list
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

// ==================== 创建教学班 ====================

function handleAdd() {
  form.value = { name: '', description: '' }
  formVisible.value = true
}

function closeForm() {
  formVisible.value = false
}

async function submitForm() {
  if (!form.value.name?.trim()) {
    uni.showToast({ title: '请输入教学班名称', icon: 'none' })
    return
  }
  try {
    const userId = userStore.userInfo?.userId
    const userName = userStore.userInfo?.name || userStore.userInfo?.username || ''
    // 创建为草稿状态，自动绑定创建者作为教师
    await createClass({
      name: form.value.name,
      description: form.value.description || '',
      teacherId: userId,
      teacherName: userName,
      status: 'draft'
    })
    uni.showToast({ title: '创建成功，等待管理员审核', icon: 'success' })
    closeForm()
    fetchData()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '创建失败'
    uni.showToast({ title: msg, icon: 'none' })
  }
}

// ==================== 编辑教学班 ====================

function handleEdit(c: ClassInfoExt) {
  editForm.value = { ...c }
  editVisible.value = true
}

function closeEdit() {
  editVisible.value = false
}

async function submitEdit() {
  if (!editForm.value.name?.trim() || !editForm.value.id) {
    uni.showToast({ title: '请输入教学班名称', icon: 'none' })
    return
  }
  try {
    await updateClass(editForm.value.id, {
      name: editForm.value.name,
      description: editForm.value.description
    })
    uni.showToast({ title: '更新成功', icon: 'success' })
    closeEdit()
    fetchData()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '更新失败'
    uni.showToast({ title: msg, icon: 'none' })
  }
}

// ==================== 删除教学班 ====================

async function handleDelete(id: number) {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除该教学班吗？删除后相关的作业、提问记录和智能体配置也将被清除。',
    success: async (res) => {
      if (res.confirm) {
        try {
          const userId = userStore.userInfo?.userId
          await deleteClass(id, 'teacher', userId)
          uni.showToast({ title: '删除成功', icon: 'success' })
          fetchData()
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : '删除失败'
          uni.showToast({ title: msg, icon: 'none' })
        }
      }
    }
  })
}

// ==================== 分配学生 ====================

async function handleStudents(c: ClassInfoExt) {
  currentClass.value = c
  studentVisible.value = true
  newStudentNo.value = ''
  try {
    studentList.value = await getClassStudents(c.id)
  } catch {
    studentList.value = []
  }
}

function closeStudentDialog() {
  studentVisible.value = false
  currentClass.value = null
  studentList.value = []
}

async function addStudent() {
  const no = newStudentNo.value.trim()
  if (!no) {
    uni.showToast({ title: '请输入学生工号', icon: 'none' })
    return
  }
  if (!currentClass.value) return
  try {
    const student = await getUserByUsername(no)
    if (student.type !== 3) {
      uni.showToast({ title: '该工号不是学生身份', icon: 'none' })
      return
    }
    await addClassStudent(currentClass.value.id, student.id, student.name || student.username)
    uni.showToast({ title: '添加成功', icon: 'success' })
    newStudentNo.value = ''
    studentList.value = await getClassStudents(currentClass.value.id)
    fetchData()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '未找到该工号的学生'
    uni.showToast({ title: msg, icon: 'none' })
  }
}

function openStudentDetail(student: ClassStudent) {
  if (!currentClass.value) return
  detailClassId.value = currentClass.value.id
  detailClassName.value = currentClass.value.name
  detailStudent.value = student
  detailVisible.value = true
}

function closeStudentDetail() {
  detailVisible.value = false
  detailStudent.value = null
}

async function removeStudent(studentId: number) {
  if (!currentClass.value) return
  try {
    await removeClassStudent(currentClass.value.id, studentId)
    uni.showToast({ title: '移除成功', icon: 'success' })
    studentList.value = await getClassStudents(currentClass.value.id)
    fetchData()
  } catch {
    uni.showToast({ title: '移除失败', icon: 'none' })
  }
}

// ==================== 绑定课程 ====================

async function handleCourses(c: ClassInfoExt) {
  currentClass.value = c
  courseVisible.value = true
  coursePickIndex.value = 0
  try {
    const [bound, all] = await Promise.all([
      getCoursesByClass(c.id),
      getCoursePage({ pageNum: 1, pageSize: 200 })
    ])
    courseList.value = bound || []
    // 课程库全部可绑定（允许绑定其他教师创建的课程）
    allCourses.value = all.list || []
  } catch {
    courseList.value = []
    allCourses.value = []
  }
}

function closeCourseDialog() {
  courseVisible.value = false
  currentClass.value = null
  courseList.value = []
}

function handleCoursePick(e: { detail: { value: number } }) {
  coursePickIndex.value = e.detail.value
}

async function addCourse() {
  if (!currentClass.value) return
  const idx = coursePickIndex.value
  if (idx < 0 || idx >= availableCourses.value.length) {
    uni.showToast({ title: '请选择要绑定的课程', icon: 'none' })
    return
  }
  const course = availableCourses.value[idx]
  try {
    await addCourseClass(course.id, currentClass.value.id, currentClass.value.name)
    uni.showToast({ title: '绑定成功', icon: 'success' })
    courseList.value = await getCoursesByClass(currentClass.value.id)
    coursePickIndex.value = 0
    fetchData()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '绑定失败'
    uni.showToast({ title: msg, icon: 'none' })
  }
}

async function removeCourse(courseId: number) {
  if (!currentClass.value) return
  try {
    await removeCourseClass(courseId, currentClass.value.id)
    uni.showToast({ title: '已解绑', icon: 'success' })
    courseList.value = await getCoursesByClass(currentClass.value.id)
    coursePickIndex.value = 0
    fetchData()
  } catch {
    uni.showToast({ title: '解绑失败', icon: 'none' })
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

/* ========== 卡片列表 ========== */
.card-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}

.class-card {
  display: flex;
  flex-direction: column;
  padding: 18px 20px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.class-card:hover {
  transform: translateY(-2px);
  border-color: var(--line-strong);
}

.card-top {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.class-name {
  flex: 1;
  min-width: 0;
  font-family: var(--font-display);
  font-size: 17px;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.04em;
}

.status-badge.status-approved {
  background: rgba(63, 107, 82, 0.12);
  color: var(--success);
}

.status-badge.status-pending {
  background: rgba(173, 116, 27, 0.12);
  color: var(--warning);
}

.status-badge.status-draft {
  background: var(--paper-deep);
  color: var(--muted);
}

.owner-badge {
  flex-shrink: 0;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 10.5px;
  letter-spacing: 0.06em;
  background: var(--accent-soft);
  color: var(--accent-ink);
}

.class-desc {
  font-size: 12px;
  line-height: 1.6;
  color: var(--muted);
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
  font-size: 12.5px;
  color: var(--ink-2);
}

.info-item {
  display: block;
}

.teacher-line {
  color: var(--ink-2);
}

.card-time {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 2px;
}

.time-text {
  font-size: 11px;
  letter-spacing: 0.02em;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.card-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
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

.action-link.danger {
  color: var(--danger);
}

.action-link.danger:hover {
  border-bottom-color: var(--danger);
}

.action-link.muted {
  color: var(--muted);
  cursor: default;
  border-bottom: none;
}

/* ========== 空状态 ========== */
.empty-state {
  grid-column: 1 / -1;
  padding: 46px 20px;
  text-align: center;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius);
}

.empty-text {
  font-size: 12.5px;
  letter-spacing: 0.04em;
  color: var(--muted);
}

/* ========== 弹窗 ========== */
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

.form-dialog {
  width: 100%;
  max-width: 360px;
  padding: 26px 24px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lift);
}

.form-title {
  display: block;
  margin-bottom: 18px;
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--ink);
}

.form-input {
  width: 100%;
  height: 42px;
  margin-bottom: 12px;
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

.form-hint {
  display: block;
  margin-bottom: 14px;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--warning);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel {
  margin: 0;
  height: 40px;
  line-height: 38px;
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
  height: 40px;
  line-height: 38px;
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

/* ========== 分配学生 / 绑定课程弹窗 ========== */
.student-dialog {
  width: 100%;
  max-width: 420px;
  max-height: 74vh;
  overflow-y: auto;
  padding: 26px 24px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lift);
}

.add-student-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.course-picker {
  flex: 1;
}

.textbook-upload {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

.file-pick {
  flex: 1;
  display: flex;
  align-items: center;
  height: 42px;
  padding: 0 12px;
  border: 1px dashed var(--line-strong);
  border-radius: 10px;
  background: var(--paper);
  font-size: 12.5px;
  color: var(--ink-2);
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.picker-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 42px;
  padding: 0 12px;
  box-sizing: border-box;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 10px;
}

.picker-text {
  font-size: 12.5px;
  color: var(--ink-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.picker-arrow {
  font-size: 10px;
  color: var(--muted);
}

.section-label {
  display: block;
  margin-bottom: 8px;
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--muted);
}

.student-list {
  max-height: 280px;
  overflow-y: auto;
}

.student-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--surface-raised);
  border-bottom: 1px solid var(--line);
}

.student-row:last-child {
  border-bottom: none;
}

.student-name {
  font-size: 13px;
  color: var(--ink);
}

.student-row-ops {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.course-row {
  align-items: flex-start;
}

.course-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.course-sub {
  max-width: 260px;
  font-size: 11px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  .card-list {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .class-card {
    padding: 16px;
  }
  .card-actions {
    gap: 12px;
  }
  .popup-overlay {
    padding: 14px;
  }
  .form-dialog,
  .student-dialog {
    max-width: 100%;
    padding: 20px 16px;
  }
  .form-actions {
    flex-direction: column-reverse;
  }
  .form-actions .btn-cancel,
  .form-actions .btn-confirm {
    width: 100%;
  }
}
</style>
