// types/models.ts - 共享数据模型类型定义

// ==================== 管理员 - 看板 ====================
export interface ChartDataItem {
  date: string
  count: number
}

export interface DashboardStats {
  onlineUsers: number
  activeTeachers: number
  apiCalls: number
  totalStudents: number
  totalCourses: number
  totalHomework: number
  chartData: {
    dailyApiCalls: ChartDataItem[]
  }
}

// ==================== 管理员 - 学生 ====================
export interface StudentInfo {
  id: number
  username: string
  phone: string
  role: 'student'
  className: string
  status: string
  createTime: string
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// ==================== 管理员 - 账号 ====================
export interface AccountInfo {
  id: number
  username: string
  role: 'admin' | 'teacher' | 'student'
  status: string
  createTime: string
}

// ==================== 管理员 - 班级 ====================
export interface ClassInfo {
  id: number
  name: string
  description: string
  teacherName: string
  studentCount: number
  createTime: string
}

// ==================== 管理员 - 课程 ====================
export interface CourseInfo {
  id: number
  name: string
  className: string
  teacherName: string
  textbookTitle: string
  chapterCount: number
  status: 'draft' | 'pending' | 'approved'
  createTime: string
}

// ==================== 管理员 - 教材 ====================
export interface TextbookInfo {
  id: string
  title: string
  courseName: string
  chunks: number
  status: string
  uploadTime: string
}

// ==================== 教师 - 课程 ====================
export interface TeacherCourseInfo {
  id: number
  name: string
  className: string
  chapterCount: number
  status: string
}

// ==================== 教师 - 章节 ====================
export interface ChapterInfo {
  id: number
  courseId: number
  title: string
  description: string
  sortOrder: number
}

// ==================== 教师 - 作业模板 ====================
export interface HomeworkTemplateInfo {
  id: number
  courseId: number
  courseName: string
  title: string
  chapterId: number
  chapterTitle: string
  submitCount: number
  totalCount: number
  createTime: string
}

// ==================== 教师 - 学生作业 ====================
export interface StudentHomeworkInfo {
  id: number
  templateId: number
  studentName: string
  answer: string
  status: 'pending' | 'submitted' | 'graded'
  score: number | null
  comment: string
  submitTime: string | null
}

// ==================== 学生 - 作业 ====================
export interface StudentHomeworkListItem {
  id: number
  templateId: number
  courseName: string
  title: string
  status: 'pending' | 'submitted' | 'graded'
  score: number | null
  comment: string
  submitTime: string | null
  deadline: string
}

// ==================== 对话 ====================
export interface ChatMessage {
  role: 'user' | 'ai'
  content: string
}