<!-- components/layout/AppLayout.vue -->
<template>
  <view class="app-layout">
    <!-- 顶部栏 -->
    <view class="topbar">
      <view class="topbar-left">
        <view class="menu-btn" @click="toggleSidebar">
          <view class="menu-line"></view>
          <view class="menu-line short"></view>
          <view class="menu-line"></view>
        </view>
        <view class="title-group">
          <text class="page-title">{{ appStore.currentPageTitle }}</text>
          <text class="page-kicker">{{ roleLabel }} 工作台</text>
        </view>
      </view>

      <view class="topbar-right" @click="showUserMenu = !showUserMenu">
        <view class="user-avatar">{{ avatarChar }}</view>
        <view class="user-meta">
          <text class="user-name">{{ userStore.userName }}</text>
          <text class="user-role">{{ roleLabel }}</text>
        </view>
        <text class="arrow" :class="{ open: showUserMenu }">&#9662;</text>
        <view v-if="showUserMenu" class="user-dropdown">
          <view class="dropdown-item" @click.stop="handleLogout">退出登录</view>
        </view>
      </view>
    </view>

    <!-- 侧边栏遮罩 -->
    <view v-if="sidebarVisible" class="sidebar-overlay" @click="closeSidebar"></view>

    <!-- 侧边栏 -->
    <view class="sidebar" :class="{ 'sidebar-open': sidebarVisible }">
      <view class="sidebar-header">
        <view class="brand-seal">星</view>
        <view class="brand-text">
          <text class="brand-name">星枢平台</text>
          <text class="brand-sub">XINGSHU ACADEMY</text>
        </view>
      </view>

      <text class="nav-group-label">导航</text>
      <view class="nav-list">
        <view
          v-for="(item, index) in navItems"
          :key="item.path"
          class="nav-item"
          :class="{ active: currentPath === item.path }"
          @click="navigateTo(item.path)"
        >
          <text class="nav-index">{{ String(index + 1).padStart(2, '0') }}</text>
          <text class="nav-label">{{ item.label }}</text>
          <view class="nav-active-bar"></view>
        </view>
      </view>

      <view class="sidebar-footer">
        <text class="footer-line">教学班驱动 · 智能体协同</text>
        <text class="footer-version">v1.0 / 2026</text>
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="content">
      <view class="content-inner">
        <slot />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { useAppStore } from '@/store/app'

interface NavItem { path: string; label: string; icon?: string }

const userStore = useUserStore()
const appStore = useAppStore()
const showUserMenu = ref(false)
const sidebarVisible = ref(false)
const currentPath = ref('')

onMounted(() => {
  // 首次进入时根据当前路由点亮侧栏项
  const pages = getCurrentPages()
  const page = pages[pages.length - 1] as { route?: string } | undefined
  if (page?.route) {
    currentPath.value = '/' + page.route.replace(/^\//, '')
  }
})

const roleLabel = computed(() => {
  const role = userStore.userRole
  if (role === 'admin') return '管理员'
  if (role === 'teacher') return '教师'
  return '学生'
})

const avatarChar = computed(() => {
  const name = userStore.userInfo?.name || userStore.userInfo?.username || roleLabel.value
  return String(name).charAt(0)
})

const navItems = computed<NavItem[]>(() => {
  const role = userStore.userRole
  if (role === 'admin') {
    return [
      { path: '/pages/admin/dashboard/index', label: '管理看板' },
      { path: '/pages/admin/student/index', label: '学生管理' },
      { path: '/pages/admin/account/index', label: '账号管理' },
      { path: '/pages/admin/class/index', label: '教学班管理' },
      { path: '/pages/admin/course/index', label: '课程管理' },
      { path: '/pages/admin/textbook/index', label: '教材管理' },
      { path: '/pages/admin/model/index', label: '模型管理' }
    ]
  }
  if (role === 'teacher') {
    return [
      { path: '/pages/teacher/dashboard/index', label: '首页' },
      { path: '/pages/teacher/class/index', label: '我的教学班' },
      { path: '/pages/teacher/course/index', label: '我的课程' },
      { path: '/pages/teacher/chapter/list', label: '课程内容管理' },
      { path: '/pages/teacher/student/index', label: '我的学生' },
      { path: '/pages/teacher/homework/list', label: '作业管理' },
      { path: '/pages/teacher/agent-config/index', label: '智能体管理' }
    ]
  }
  return [
    { path: '/pages/student/dashboard/index', label: '首页' },
    { path: '/pages/student/course/index', label: '我的课程' },
    { path: '/pages/student/homework/index', label: '我的作业' },
    { path: '/pages/student/chat/index', label: 'AI 助手' }
  ]
})

function toggleSidebar() {
  sidebarVisible.value = !sidebarVisible.value
}

function closeSidebar() {
  sidebarVisible.value = false
}

function navigateTo(path: string) {
  currentPath.value = path
  closeSidebar()
  uni.navigateTo({ url: path })
}

function handleLogout() {
  showUserMenu.value = false
  userStore.logout()
}
</script>

<style scoped>
.app-layout {
  height: 100vh;
  background: transparent;
  overflow: hidden;
}

/* ========== 顶部栏 ========== */
.topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  padding: 0 22px 0 18px;
  background: rgba(255, 253, 248, 0.86);
  backdrop-filter: saturate(160%) blur(14px);
  -webkit-backdrop-filter: saturate(160%) blur(14px);
  border-bottom: 1px solid var(--line);
  z-index: 110;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.menu-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  padding: 0 9px;
  cursor: pointer;
  transition: background 0.18s ease;
}

.menu-btn:hover {
  background: var(--accent-soft);
}

.menu-line {
  height: 1.5px;
  width: 100%;
  background: var(--ink);
  border-radius: 2px;
  transition: width 0.2s ease;
}

.menu-line.short {
  width: 64%;
}

.menu-btn:hover .menu-line.short {
  width: 100%;
}

.title-group {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.page-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.25;
}

.page-kicker {
  font-size: 10px;
  letter-spacing: 0.16em;
  color: var(--muted);
  text-transform: uppercase;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  position: relative;
  padding: 5px 8px 5px 6px;
  border-radius: 12px;
  transition: background 0.18s ease;
}

.topbar-right:hover {
  background: rgba(235, 229, 217, 0.55);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--ink);
  color: #F7F2E7;
  font-family: var(--font-display);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-meta {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.user-name {
  font-size: 13px;
  color: var(--ink);
  font-weight: 600;
}

.user-role {
  font-size: 10px;
  color: var(--muted);
  letter-spacing: 0.08em;
}

.arrow {
  font-size: 11px;
  color: var(--muted);
  transition: transform 0.2s ease;
}

.arrow.open {
  transform: rotate(180deg);
}

.user-dropdown {
  position: absolute;
  top: 52px;
  right: 0;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: var(--shadow-lift);
  min-width: 132px;
  z-index: 200;
  padding: 6px;
  animation: dropIn 0.16s ease both;
}

@keyframes dropIn {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

.dropdown-item {
  padding: 9px 12px;
  font-size: 13px;
  color: var(--danger);
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s ease;
}

.dropdown-item:hover {
  background: #F7EAE6;
}

/* ========== 侧边栏 ========== */
.sidebar-overlay {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(23, 35, 59, 0.34);
  z-index: 98;
  animation: fadeIn 0.2s ease both;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.sidebar {
  position: fixed;
  top: 60px;
  left: 0;
  bottom: 0;
  width: 252px;
  background: #17233B;
  background-image:
    radial-gradient(420px 260px at 0% 0%, rgba(180, 83, 42, 0.24), transparent 70%),
    linear-gradient(180deg, #1A2742 0%, #141E33 100%);
  color: #F4EFE4;
  z-index: 100;
  transform: translateX(-100%);
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.sidebar-open {
  transform: translateX(0);
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 26px 24px 22px;
  border-bottom: 1px solid rgba(244, 239, 228, 0.10);
}

.brand-seal {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 6px;
  background: var(--accent);
  color: #FFF6EC;
  font-family: var(--font-display);
  font-size: 21px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 18px -10px rgba(180, 83, 42, 0.9);
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.brand-name {
  font-family: var(--font-display);
  font-size: 19px;
  letter-spacing: 0.06em;
  color: #F8F3E8;
}

.brand-sub {
  font-size: 9px;
  letter-spacing: 0.22em;
  color: rgba(248, 243, 232, 0.42);
}

.nav-group-label {
  display: block;
  padding: 22px 26px 10px;
  font-size: 9px;
  letter-spacing: 0.24em;
  color: rgba(248, 243, 232, 0.34);
}

.nav-list {
  padding: 0 10px;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  margin-bottom: 2px;
  border-radius: 10px;
  cursor: pointer;
  color: rgba(248, 243, 232, 0.62);
  transition: background 0.16s ease, color 0.16s ease;
}

.nav-item:hover {
  background: rgba(248, 243, 232, 0.06);
  color: rgba(248, 243, 232, 0.9);
}

.nav-item.active {
  background: rgba(248, 243, 232, 0.10);
  color: #FFF8EC;
}

.nav-index {
  font-family: var(--font-mono);
  font-size: 10px;
  color: rgba(248, 243, 232, 0.30);
  min-width: 16px;
  letter-spacing: 0.06em;
}

.nav-item.active .nav-index {
  color: #E79A6E;
}

.nav-label {
  font-size: 13.5px;
  letter-spacing: 0.02em;
}

.nav-active-bar {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  border-radius: 0 3px 3px 0;
  background: var(--accent);
  transition: height 0.2s ease;
}

.nav-item.active .nav-active-bar {
  height: 22px;
}

.sidebar-footer {
  margin-top: auto;
  padding: 22px 26px 26px;
  border-top: 1px solid rgba(244, 239, 228, 0.10);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.footer-line {
  font-size: 11px;
  color: rgba(248, 243, 232, 0.46);
  letter-spacing: 0.04em;
}

.footer-version {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.14em;
  color: rgba(248, 243, 232, 0.26);
}

/* ========== 内容区域 ========== */
.content {
  height: 100vh;
  overflow-y: auto;
  box-sizing: border-box;
  padding: 76px 0 28px;
}

.content-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 28px;
  /* 此处不做 transform/opacity 动画：任何残留的 transform 都会成为 position:fixed 弹窗的包含块，
     导致弹窗相对内容区而不是视口定位（被顶部裁切、打不开）。 */
}

/* ========== 抽屉式侧栏：不常驻，展开时覆盖内容，选择后自动收起 ========== */
.sidebar {
  top: 60px;
  z-index: 105;
  box-shadow: 8px 0 32px -24px rgba(23, 35, 59, 0.6);
}

.sidebar-header {
  padding: 20px 24px 18px;
}

@media (max-width: 768px) {
  .content-inner {
    padding: 0 14px;
  }
  .page-kicker,
  .user-meta {
    display: none;
  }
  .topbar {
    padding: 0 12px;
  }
}
</style>
