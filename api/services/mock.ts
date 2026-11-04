// api/services/mock.ts - 模拟数据服务层
import type { DashboardStats, StudentInfo, PageResult, AccountInfo, ClassInfo, CourseInfo, TextbookInfo, TeacherCourseInfo, ChapterInfo, HomeworkTemplateInfo, StudentHomeworkInfo, StudentHomeworkListItem } from '@/types/models'

function delay(ms = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ==================== 管理员 - 看板 ====================
export async function getDashboardStats(): Promise<DashboardStats> {
  await delay()
  return {
    onlineUsers: Math.floor(Math.random() * 200) + 50,
    activeTeachers: Math.floor(Math.random() * 30) + 10,
    apiCalls: Math.floor(Math.random() * 5000) + 1000,
    totalStudents: 1280,
    totalCourses: 45,
    totalHomework: 320,
    chartData: {
      dailyApiCalls: [
        { date: '周一', count: 1200 }, { date: '周二', count: 1800 },
        { date: '周三', count: 2200 }, { date: '周四', count: 1900 },
        { date: '周五', count: 2500 }, { date: '周六', count: 800 },
        { date: '周日', count: 500 }
      ]
    }
  }
}

// ==================== 管理员 - 学生 ====================
export async function getStudents(page = 1, pageSize = 10): Promise<PageResult<StudentInfo>> {
  await delay()
  const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二']
  const list: StudentInfo[] = names.map((name, i) => ({
    id: (page - 1) * pageSize + i + 1,
    username: name,
    phone: `1380000${String((page - 1) * pageSize + i + 1).padStart(4, '0')}`,
    role: 'student',
    className: i % 3 === 0 ? '计算机一班' : i % 3 === 1 ? '计算机二班' : '软件一班',
    status: i % 5 === 0 ? '禁用' : '正常',
    createTime: '2026-07-' + String(20 - i).padStart(2, '0')
  }))
  return { list, total: 100, page, pageSize }
}

export async function deleteStudent(_id: number): Promise<{ success: boolean }> {
  await delay()
  return { success: true }
}

// ==================== 管理员 - 账号 ====================
export async function getAccounts(page = 1, pageSize = 10): Promise<PageResult<AccountInfo>> {
  await delay()
  const list: AccountInfo[] = [
    { id: 1, username: 'admin', role: 'admin', status: '正常', createTime: '2026-01-01' },
    { id: 2, username: 'teacher_zhang', role: 'teacher', status: '正常', createTime: '2026-03-15' },
    { id: 3, username: 'teacher_li', role: 'teacher', status: '正常', createTime: '2026-04-20' },
    { id: 4, username: 'student_wang', role: 'student', status: '禁用', createTime: '2026-05-10' },
    { id: 5, username: 'student_zhao', role: 'student', status: '正常', createTime: '2026-06-01' }
  ]
  return { list, total: 5, page, pageSize }
}

// ==================== 管理员 - 班级 ====================
export async function getClasses(page = 1, pageSize = 10): Promise<PageResult<ClassInfo>> {
  await delay()
  const list: ClassInfo[] = [
    { id: 1, name: '计算机一班', description: '2026级计算机科学与技术', teacherName: '张老师', studentCount: 35, createTime: '2026-03-01' },
    { id: 2, name: '计算机二班', description: '2026级计算机科学与技术', teacherName: '李老师', studentCount: 32, createTime: '2026-03-01' },
    { id: 3, name: '软件一班', description: '2026级软件工程', teacherName: '王老师', studentCount: 40, createTime: '2026-03-01' },
    { id: 4, name: '网络一班', description: '2026级网络工程', teacherName: '赵老师', studentCount: 28, createTime: '2026-03-01' }
  ]
  return { list, total: 4, page, pageSize }
}

export async function createClass(data: { name: string; description: string; teacherName: string }): Promise<ClassInfo> {
  await delay()
  return { id: Date.now(), ...data, studentCount: 0, createTime: '2026-07-20' }
}

// ==================== 管理员 - 课程 ====================
export async function getCourses(page = 1, pageSize = 10): Promise<PageResult<CourseInfo>> {
  await delay()
  const list: CourseInfo[] = [
    { id: 1, name: 'Linux基础', className: '计算机一班', teacherName: '张老师', textbookTitle: 'Linux基础教程', chapterCount: 12, status: 'approved', createTime: '2026-03-15' },
    { id: 2, name: '数据结构', className: '计算机一班', teacherName: '张老师', textbookTitle: '数据结构与算法', chapterCount: 8, status: 'approved', createTime: '2026-03-20' },
    { id: 3, name: '计算机网络', className: '计算机二班', teacherName: '李老师', textbookTitle: '', chapterCount: 10, status: 'pending', createTime: '2026-04-01' },
    { id: 4, name: '操作系统', className: '软件一班', teacherName: '王老师', textbookTitle: '', chapterCount: 0, status: 'draft', createTime: '2026-04-10' }
  ]
  return { list, total: 4, page, pageSize }
}

export async function approveCourse(_id: number): Promise<{ success: boolean }> {
  await delay()
  return { success: true }
}

// ==================== 管理员 - 教材 ====================
export async function getTextbooks(page = 1, pageSize = 10): Promise<PageResult<TextbookInfo>> {
  await delay()
  const list: TextbookInfo[] = [
    { id: 'tb_001', title: 'Linux基础教程', courseName: 'Linux基础', chunks: 156, status: '已索引', uploadTime: '2026-03-10' },
    { id: 'tb_002', title: '数据结构与算法', courseName: '数据结构', chunks: 203, status: '已索引', uploadTime: '2026-03-18' },
    { id: 'tb_003', title: '计算机网络原理', courseName: '', chunks: 0, status: '待上传', uploadTime: '-' }
  ]
  return { list, total: 3, page, pageSize }
}

// ==================== 教师 - 章节 ====================
export async function getTeacherCourses(page = 1, pageSize = 10): Promise<PageResult<TeacherCourseInfo>> {
  await delay()
  return {
    list: [
      { id: 1, name: 'Linux基础', className: '计算机一班', chapterCount: 12, status: 'approved' },
      { id: 2, name: '数据结构', className: '计算机一班', chapterCount: 8, status: 'approved' }
    ], total: 2, page, pageSize
  }
}

export async function getChapters(courseId: number): Promise<ChapterInfo[]> {
  await delay()
  return [
    { id: 1, courseId, title: '第一章 概述', description: '课程简介与学习目标', sortOrder: 1 },
    { id: 2, courseId, title: '第二章 基础概念', description: '核心概念与术语', sortOrder: 2 },
    { id: 3, courseId, title: '第三章 进阶内容', description: '深入理解与应用', sortOrder: 3 }
  ]
}

export async function addChapter(courseId: number, data: { title: string; description: string; sortOrder: number }): Promise<ChapterInfo> {
  await delay()
  return { id: Date.now(), courseId, ...data }
}

// ==================== 教师 - 作业 ====================
export async function getTeacherHomeworkTemplates(page = 1, pageSize = 10): Promise<PageResult<HomeworkTemplateInfo>> {
  await delay()
  return {
    list: [
      { id: 1, courseId: 1, courseName: 'Linux基础', title: '第一次作业：基本命令', chapterId: 1, chapterTitle: '第一章 概述', submitCount: 28, totalCount: 35, createTime: '2026-07-10' },
      { id: 2, courseId: 1, courseName: 'Linux基础', title: '第二次作业：文件操作', chapterId: 2, chapterTitle: '第二章 基础概念', submitCount: 30, totalCount: 35, createTime: '2026-07-15' },
      { id: 3, courseId: 2, courseName: '数据结构', title: '第一次作业：链表', chapterId: 1, chapterTitle: '第一章', submitCount: 25, totalCount: 32, createTime: '2026-07-12' }
    ], total: 3, page, pageSize
  }
}

export async function getStudentHomeworks(templateId: number): Promise<StudentHomeworkInfo[]> {
  await delay()
  return [
    { id: 1, templateId, studentName: '张三', answer: 'ls -la 可以列出所有文件...', status: 'submitted', score: null, comment: '', submitTime: '2026-07-11 14:30' },
    { id: 2, templateId, studentName: '李四', answer: '使用cd命令切换目录...', status: 'submitted', score: 85, comment: '不错', submitTime: '2026-07-11 16:00' },
    { id: 3, templateId, studentName: '王五', answer: '', status: 'pending', score: null, comment: '', submitTime: null }
  ]
}

export async function gradeHomework(_id: number, _score: number, _comment: string): Promise<{ success: boolean }> {
  await delay()
  return { success: true }
}

// ==================== 学生 - 作业 ====================
export async function getStudentHomeworkList(page = 1, pageSize = 10): Promise<PageResult<StudentHomeworkListItem>> {
  await delay()
  return {
    list: [
      { id: 1, templateId: 1, courseName: 'Linux基础', title: '第一次作业：基本命令', status: 'pending', score: null, comment: '', submitTime: null, deadline: '2026-07-20' },
      { id: 2, templateId: 2, courseName: 'Linux基础', title: '第二次作业：文件操作', status: 'submitted', score: null, comment: '', submitTime: '2026-07-16 10:30', deadline: '2026-07-25' },
      { id: 3, templateId: 3, courseName: '数据结构', title: '第一次作业：链表', status: 'graded', score: 90, comment: '优秀', submitTime: '2026-07-14 09:00', deadline: '2026-07-22' }
    ], total: 3, page, pageSize
  }
}

export async function submitHomework(_id: number, _answer: string): Promise<{ success: boolean }> {
  await delay()
  return { success: true }
}