<!-- pages/admin/class/index.vue - 教学班管理 -->
<template>
  <AppLayout>
    <view class="page-container">
      <view class="page-header">
        <view class="header-left">
          <text class="header-kicker">TEACHING CLASSES</text>
          <text class="page-title-sm">教学班管理</text>
          <text class="header-sub">教师 · 课程 · 学生归属</text>
        </view>
        <button class="btn-add" @click="handleAdd">+ 创建教学班</button>
      </view>

      <!-- 搜索栏 -->
      <view class="search-bar">
        <input
          class="search-input"
          v-model="keyword"
          placeholder="搜索教学班名称"
          @confirm="handleSearch"
        />
        <button class="btn-search" @click="handleSearch">查询</button>
        <button class="btn-reset" @click="handleReset">重置</button>
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
            </view>
            <text class="class-desc">{{ c.description || '暂无描述' }}</text>
          </view>
          <view class="card-info">
            <text class="info-item">教师: {{ c.teacherNames || c.teacherName || '未绑定' }}</text>
            <text class="info-item">学生: {{ c.studentCount ?? 0 }}人</text>
          </view>
          <view class="card-actions">
            <text class="action-link" @click="handleTeacher(c)">分配教师</text>
            <text class="action-link" @click="handleCourseBind(c)">分配课程</text>
            <text class="action-link" @click="handleStudents(c)">分配学生</text>
            <text v-if="c.status === 'pending' || c.status === 'draft'" class="action-link success" @click="handleApprove(c.id)">审核通过</text>
            <text class="action-link" @click="handleEdit(c)">编辑</text>
            <text class="action-link danger" @click="handleDelete(c.id)">删除</text>
          </view>
        </view>
        <view v-if="list.length === 0 && !loading" class="empty-state">
          <text class="empty-text">暂无教学班数据</text>
          <text class="empty-caption">NO CLASSES</text>
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
          <text class="form-title">{{ isEdit ? '编辑教学班' : '创建教学班' }}</text>
          <input class="form-input" v-model="form.name" placeholder="教学班名称" @confirm="submitForm" />
          <input class="form-input" v-model="form.college" placeholder="所属学院" @confirm="submitForm" />
          <input class="form-input" v-model="form.description" placeholder="教学班描述" @confirm="submitForm" />
          <view class="form-actions">
            <button class="btn-cancel" @click="closeForm">取消</button>
            <button class="btn-confirm" @click="submitForm">确定</button>
          </view>
        </view>
      </view>

      <!-- 分配教师弹窗（支持多教师） -->
      <view v-if="teacherVisible" class="popup-overlay" @click="closeTeacherDialog">
        <view class="popup-dialog" @click.stop>
          <text class="dialog-x" @click="closeTeacherDialog">×</text>
          <text class="form-title">分配教师 - {{ currentClass?.name }}</text>

          <view class="section-label">已绑定教师（一个教学班可绑定多位教师）</view>
          <view class="tag-list">
            <view v-for="t in classTeachers" :key="t.teacherId" class="tag-row">
              <view class="teacher-tag">
                <text class="tag-text">{{ t.teacherName || ('教师 ' + t.teacherId) }}</text>
                <text v-if="t.isOwner === 1" class="owner-badge">主教师</text>
              </view>
              <text class="action-link danger" @click="removeTeacherFromClass(t)">移除</text>
            </view>
            <text v-if="classTeachers.length === 0" class="empty-text">暂未绑定教师</text>
          </view>

          <view class="section-label" style="margin-top: 12px">添加教师</view>
          <view class="add-student-row">
            <input class="form-input" v-model="teacherNo" placeholder="输入教师工号" @confirm="bindTeacher" style="flex:1; margin-bottom:0" />
            <button class="btn-confirm" @click="bindTeacher">添加</button>
          </view>
          <view class="form-actions" style="margin-top: 12px">
            <button class="btn-cancel" @click="closeTeacherDialog">关闭</button>
          </view>
        </view>
      </view>

      <!-- 分配课程弹窗 -->
      <view v-if="courseBindVisible" class="popup-overlay" @click="closeCourseBindDialog">
        <view class="popup-dialog" @click.stop>
          <text class="dialog-x" @click="closeCourseBindDialog">×</text>
          <text class="form-title">分配课程 - {{ currentClass?.name }}</text>

          <view class="section-label">已绑定课程</view>
          <view class="tag-list">
            <view v-for="cc in boundCourses" :key="cc.id" class="tag-row">
              <view class="course-tag-info">
                <text class="tag-text">{{ cc.name }}</text>
                <text class="tag-sub">{{ cc.textbookTitle ? '教材：' + cc.textbookTitle : '未关联教材' }}</text>
              </view>
              <text class="action-link danger" @click="unbindCourse(cc.courseId)">移除</text>
            </view>
            <text v-if="boundCourses.length === 0" class="empty-text">暂未绑定课程</text>
          </view>

          <view class="section-label" style="margin-top: 12px">添加课程</view>
          <view class="add-student-row">
            <picker
              class="course-picker"
              :value="coursePickIndex"
              :range="availableCourses"
              range-key="name"
              @change="handleCoursePick"
            >
              <view class="picker-display">
                <text class="picker-text">{{ selectedCourseName || '选择课程' }}</text>
                <text class="picker-arrow">&#9660;</text>
              </view>
            </picker>
            <button class="btn-confirm" @click="bindCourse">添加</button>
          </view>
          <view class="form-actions" style="margin-top: 12px">
            <button class="btn-cancel" @click="closeCourseBindDialog">关闭</button>
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
              <text class="action-link danger" @click="removeStudent(s.studentId)">移除</text>
            </view>
            <view v-if="studentList.length === 0" class="empty-text">暂无学生</view>
          </view>

          <view class="form-actions" style="margin-top: 12px">
            <button class="btn-cancel" @click="closeStudentDialog">关闭</button>
          </view>
        </view>
      </view>
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AppLayout from '@/components/layout/AppLayout.vue'
import {
  getClassPage,
  createClass,
  updateClass,
  deleteClass,
  approveClass,
  preCheckDeleteClass,
  getClassStudents,
  addClassStudent,
  removeClassStudent,
  getClassTeachers,
  addClassTeacher,
  removeClassTeacher,
  type ClassInfo,
  type ClassStudent,
  type ClassTeacher
} from '@/api/class'
import { getCoursePage, getCoursesByClass, addCourseClass, removeCourseClass, type CourseInfo } from '@/api/course'
import { getUserByUsername } from '@/api/user'

interface ClassInfoExt extends ClassInfo {
  studentCount?: number
}

interface BoundCourseExt extends CourseInfo {
  courseId: number
}

const list = ref<ClassInfoExt[]>([])
const loading = ref(false)
const keyword = ref('')
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const totalPages = ref(0)
const jumpPage = ref('')

const formVisible = ref(false)
const isEdit = ref(false)
const form = ref<Partial<ClassInfo>>({})

const teacherVisible = ref(false)
const teacherNo = ref('')
const classTeachers = ref<ClassTeacher[]>([])

const courseBindVisible = ref(false)
const boundCourses = ref<BoundCourseExt[]>([])
const allCourses = ref<CourseInfo[]>([])
const coursePickIndex = ref(0)
const availableCourses = computed(() =>
  allCourses.value.filter((c) => !boundCourses.value.some((bound) => bound.id === c.id))
)
const selectedCourseName = computed(() => {
  const idx = coursePickIndex.value
  return idx >= 0 && idx < availableCourses.value.length ? availableCourses.value[idx].name : ''
})

const studentVisible = ref(false)
const currentClass = ref<ClassInfoExt | null>(null)
const studentList = ref<ClassStudent[]>([])
const newStudentNo = ref('')

function formatTime(time: string): string {
  if (!time) return '-'
  return time.substring(0, 10)
}

async function fetchData() {
  loading.value = true
  try {
    const res = await getClassPage({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined
    })
    // 后端已批量返回学生人数与全部教师姓名
    list.value = res.list
    total.value = res.total
    totalPages.value = res.totalPages
    jumpPage.value = String(pageNum.value)
  } catch {
    list.value = []
    total.value = 0
    totalPages.value = 0
  } finally {
    loading.value = false
  }
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
    await approveClass(id)
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

function handleEdit(c: ClassInfo) {
  isEdit.value = true
  form.value = { ...c }
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
    if (isEdit.value && form.value.id) {
      await updateClass(form.value.id, form.value)
      uni.showToast({ title: '更新成功', icon: 'success' })
    } else {
      await createClass(form.value)
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
    const check = await preCheckDeleteClass(id)
    if (!check.canDelete) {
      const msg = check.blockers.join('\n')
      uni.showModal({
        title: '无法删除',
        content: `「${check.className}」${msg}`,
        showCancel: false
      })
      return
    }
    uni.showModal({
      title: '确认删除',
      content: `确定要删除教学班「${check.className}」吗？相关的作业、提问记录和智能体配置将被清除。`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteClass(id)
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

// ==================== 分配教师（多对多） ====================

async function handleTeacher(c: ClassInfoExt) {
  currentClass.value = c
  teacherNo.value = ''
  teacherVisible.value = true
  await loadClassTeachers()
}

async function loadClassTeachers() {
  if (!currentClass.value) return
  try {
    classTeachers.value = await getClassTeachers(currentClass.value.id)
  } catch {
    classTeachers.value = []
  }
}

function closeTeacherDialog() {
  teacherVisible.value = false
  currentClass.value = null
  classTeachers.value = []
}

async function bindTeacher() {
  const no = teacherNo.value.trim()
  if (!no) {
    uni.showToast({ title: '请输入教师工号', icon: 'none' })
    return
  }
  if (!currentClass.value) return
  try {
    const teacher = await getUserByUsername(no)
    if (teacher.type !== 2) {
      uni.showToast({ title: '该工号不是教师身份', icon: 'none' })
      return
    }
    await addClassTeacher(currentClass.value.id, teacher.id, teacher.name || teacher.username)
    uni.showToast({ title: '已添加教师', icon: 'success' })
    teacherNo.value = ''
    await loadClassTeachers()
    fetchData()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '未找到该工号的教师'
    uni.showToast({ title: msg, icon: 'none' })
  }
}

function removeTeacherFromClass(teacher: ClassTeacher) {
  if (!currentClass.value) return
  uni.showModal({
    title: '移除教师',
    content: `确定将「${teacher.teacherName || teacher.teacherId}」移出该教学班吗？`,
    success: async (res) => {
      if (!res.confirm) return
      try {
        await removeClassTeacher(currentClass.value!.id, teacher.teacherId)
        uni.showToast({ title: '已移除', icon: 'success' })
        await loadClassTeachers()
        fetchData()
      } catch {
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    }
  })
}

// ==================== 分配课程 ====================

async function handleCourseBind(c: ClassInfoExt) {
  currentClass.value = c
  coursePickIndex.value = 0
  courseBindVisible.value = true
  await loadBoundCourses()
}

function closeCourseBindDialog() {
  courseBindVisible.value = false
  currentClass.value = null
  boundCourses.value = []
  allCourses.value = []
}

async function loadBoundCourses() {
  if (!currentClass.value) return
  try {
    const [bound, all] = await Promise.all([
      getCoursesByClass(currentClass.value.id),
      getCoursePage({ pageNum: 1, pageSize: 200 })
    ])
    boundCourses.value = (bound || []).map((c) => ({ ...c, courseId: c.id }))
    allCourses.value = all.list || []
    coursePickIndex.value = 0
  } catch {
    boundCourses.value = []
    allCourses.value = []
  }
}

function handleCoursePick(e: { detail: { value: number } }) {
  coursePickIndex.value = e.detail.value
}

async function bindCourse() {
  const idx = coursePickIndex.value
  if (idx < 0 || idx >= availableCourses.value.length) {
    uni.showToast({ title: '请选择要添加的课程', icon: 'none' })
    return
  }
  if (!currentClass.value) return
  const course = availableCourses.value[idx]
  try {
    await addCourseClass(course.id, currentClass.value.id, currentClass.value.name)
    uni.showToast({ title: '添加成功', icon: 'success' })
    loadBoundCourses()
  } catch {
    uni.showToast({ title: '添加失败', icon: 'none' })
  }
}

async function unbindCourse(courseId: number) {
  if (!currentClass.value) return
  try {
    await removeCourseClass(courseId, currentClass.value.id)
    uni.showToast({ title: '移除成功', icon: 'success' })
    loadBoundCourses()
  } catch {
    uni.showToast({ title: '移除失败', icon: 'none' })
  }
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

onShow(() => {
  fetchData()
})
</script>

<style scoped>
/* =========================================================
   教学班管理 · 教育档案室
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

/* ========== 教学班卡片 ========== */
.card-list {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.class-card {
  position: relative;
  flex: 1 1 340px;
  min-width: 0;
  padding: 20px 22px 18px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.class-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 20px;
  bottom: 20px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--accent);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.class-card:hover {
  transform: translateY(-2px);
  border-color: var(--line-strong);
  box-shadow: var(--shadow-lift);
}

.class-card:hover::before { opacity: 1; }

.card-top { margin-bottom: 12px; }

.card-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 6px;
}

.class-name {
  font-family: var(--font-display);
  font-size: 18px;
  letter-spacing: 0.02em;
  color: var(--ink);
}

.class-desc {
  display: block;
  font-size: 12px;
  line-height: 1.7;
  color: var(--muted);
}

.status-badge,
.owner-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.status-badge::before {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.72;
}

.status-badge.status-approved { background: #E7EFE8; color: var(--success); }
.status-badge.status-pending { background: #F7ECD9; color: var(--warning); }
.status-badge.status-draft { background: var(--paper-deep); color: var(--muted); }

.owner-badge {
  background: var(--accent-soft);
  color: var(--accent-ink);
  letter-spacing: 0.04em;
}

.card-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 26px;
  padding: 12px 0;
  margin-bottom: 14px;
  border-top: 1px dashed var(--line);
  border-bottom: 1px dashed var(--line);
}

.info-item {
  font-size: 11.5px;
  letter-spacing: 0.06em;
  color: var(--muted);
}

.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
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
.action-link.success { color: var(--success); }

/* ========== 空状态 ========== */
.empty-state {
  flex: 1 1 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 46px 16px;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius);
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
.popup-dialog,
.student-dialog {
  width: 400px;
  max-width: 100%;
  max-height: 78vh;
  overflow-y: auto;
  padding: 26px 24px;
  background: var(--surface);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-lg);
  box-shadow: 0 24px 60px -30px rgba(23, 35, 59, 0.6);
  animation: dialogIn 0.18s ease both;
}

.form-dialog { width: 360px; }

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
  line-height: 1.4;
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

/* ========== 弹窗内列表 ========== */
.section-label {
  display: block;
  margin-bottom: 8px;
  font-size: 10.5px;
  letter-spacing: 0.14em;
  color: var(--muted);
}

.tag-list {
  max-height: 210px;
  overflow-y: auto;
}

.tag-row,
.student-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  margin-bottom: 6px;
  background: var(--surface-raised);
  border: 1px solid var(--line);
  border-radius: 10px;
  transition: border-color 0.16s ease;
}

.tag-row:hover,
.student-row:hover { border-color: var(--line-strong); }

.tag-text {
  font-size: 13px;
  color: var(--ink);
}

.teacher-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.course-tag-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.tag-sub {
  max-width: 300px;
  font-size: 11px;
  letter-spacing: 0.02em;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.student-name {
  font-size: 13px;
  color: var(--ink);
}

.tag-list .empty-text,
.student-list .empty-text {
  display: block;
  padding: 16px;
  margin-bottom: 6px;
  text-align: center;
  font-size: 12px;
  color: var(--muted);
  border: 1px dashed var(--line-strong);
  border-radius: 10px;
}

.add-student-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}

.add-student-row .btn-confirm {
  height: 40px;
  line-height: 38px;
  padding: 0 18px;
  flex-shrink: 0;
}

.course-picker { flex: 1; min-width: 0; }

.picker-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  height: 42px;
  padding: 0 12px;
  background: var(--surface-raised);
  border: 1px solid var(--line);
  border-radius: 10px;
  box-sizing: border-box;
  transition: border-color 0.18s ease;
}

.picker-display:hover { border-color: var(--line-strong); }

.picker-text {
  font-size: 13px;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.picker-arrow {
  font-size: 10px;
  color: var(--muted);
}

.student-list { max-height: 300px; overflow-y: auto; }

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

  .search-bar {
    flex-wrap: wrap;
    padding: 12px;
  }

  .search-input { flex-basis: 100%; }
  .btn-search,
  .btn-reset { flex: 1; }

  .class-card {
    flex: 1 1 100%;
    padding: 18px 18px 16px;
  }

  .class-name { font-size: 16px; }

  .pagination {
    flex-direction: column;
    align-items: stretch;
    padding: 12px;
  }

  .pagination-controls { justify-content: space-between; }
  .page-jump { justify-content: flex-end; }

  .form-dialog,
  .popup-dialog,
  .student-dialog {
    width: 100%;
    padding: 22px 18px;
  }

  .form-title { font-size: 17px; }
}
</style>