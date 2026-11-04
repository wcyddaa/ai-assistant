<!-- pages/login/index.vue - 登录页面 -->
<template>
  <view class="login-page">
    <!-- 左侧封面 -->
    <view class="login-cover">
      <view class="cover-grid"></view>
      <view class="cover-watermark">星</view>

      <view class="cover-top">
        <view class="brand-seal">星</view>
        <view class="brand-block">
          <text class="brand-name">星枢平台</text>
          <text class="brand-sub">XINGSHU ACADEMY</text>
        </view>
      </view>

      <view class="cover-main">
        <text class="cover-kicker">TEACHING · INTELLIGENCE</text>
        <text class="cover-title">让每一个<br />教学班，都有自己的<br /><text class="cover-title-accent">智能助教</text></text>
        <text class="cover-desc">以教学班为基准，串联课程、教材、作业与智能体，让教学资料随班而行。</text>
      </view>

      <view class="cover-bottom">
        <view class="cover-tags">
          <text class="cover-tag">教学班</text>
          <text class="cover-tag">课程教材</text>
          <text class="cover-tag">智能体</text>
        </view>
        <text class="cover-version">v1.0 / 2026</text>
      </view>
    </view>

    <!-- 右侧表单 -->
    <view class="login-panel">
      <view class="form-wrap">
        <text class="form-kicker">WELCOME BACK</text>
        <text class="form-title">登录</text>
        <text class="form-sub">使用学校分配的账号进入你的工作台</text>

        <view class="login-form">
          <view class="field">
            <text class="field-label">账号</text>
            <input class="field-input" v-model="username" placeholder="请输入账号" />
          </view>
          <view class="field">
            <text class="field-label">密码</text>
            <input class="field-input" v-model="password" type="password" placeholder="请输入密码" @confirm="handleLogin" />
          </view>
        </view>

        <view class="role-section">
          <text class="field-label">身份</text>
          <view class="role-options">
            <view
              class="role-item"
              :class="{ active: role === 'admin' }"
              @click="selectRole('admin')"
            >
              <text class="label">管理员</text>
            </view>
            <view
              class="role-item"
              :class="{ active: role === 'teacher' }"
              @click="selectRole('teacher')"
            >
              <text class="label">教师</text>
            </view>
            <view
              class="role-item"
              :class="{ active: role === 'student' }"
              @click="selectRole('student')"
            >
              <text class="label">学生</text>
            </view>
          </view>
        </view>

        <button class="login-btn" :disabled="loading" @click="handleLogin">
          <text>{{ loading ? '登录中…' : '进入工作台' }}</text>
          <text class="btn-arrow">→</text>
        </button>

        <text class="form-note">账号与身份由管理员统一分配，如有问题请联系教务。</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const username = ref('')
const password = ref('')
const role = ref('admin')
const loading = ref(false)

// 角色选择方法
function selectRole(selectedRole: string) {
  role.value = selectedRole
}

// 根据角色获取跳转路径
function getRedirectUrl(): string {
  const urlMap: Record<string, string> = {
    'admin': '/pages/admin/dashboard/index',
    'teacher': '/pages/teacher/dashboard/index',
    'student': '/pages/student/dashboard/index'
  }
  return urlMap[role.value] || '/pages/admin/dashboard/index'
}

async function handleLogin() {
  // 验证输入
  if (!username.value.trim()) {
    uni.showToast({ title: '请输入账号', icon: 'none' })
    return
  }
  if (!password.value.trim()) {
    uni.showToast({ title: '请输入密码', icon: 'none' })
    return
  }

  loading.value = true

  try {
    await userStore.login(username.value, password.value, role.value)

    // 启动心跳
    userStore.startHeartbeat()

    // 获取跳转URL
    const url = getRedirectUrl()

    // 确保url不为空
    if (!url) {
      throw new Error('跳转路径为空')
    }

    // 显示登录成功提示后跳转
    uni.showToast({ title: '登录成功', icon: 'success', duration: 800 })
    setTimeout(() => {
      uni.reLaunch({ url: url })
    }, 500)
  } catch (e: unknown) {
    console.error('登录错误:', e)
    const errorMsg = e instanceof Error ? e.message : '登录失败，请重试'
    uni.showToast({ title: errorMsg, icon: 'none', duration: 2000 })
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  min-height: 100vh;
  background: var(--paper);
  background-image:
    radial-gradient(1000px 600px at 100% 100%, rgba(180, 83, 42, 0.07), transparent 60%);
}

/* ========== 左侧封面 ========== */
.login-cover {
  position: relative;
  width: 46%;
  min-height: 100vh;
  padding: 48px 56px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  color: #F8F3E8;
  background: #17233B;
  background-image:
    radial-gradient(700px 500px at 0% 0%, rgba(180, 83, 42, 0.32), transparent 66%),
    linear-gradient(160deg, #1B2946 0%, #131D31 100%);
  animation: coverIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes coverIn {
  from { opacity: 0; transform: translateX(-16px); }
  to { opacity: 1; transform: translateX(0); }
}

.cover-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(248, 243, 232, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(248, 243, 232, 0.045) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(80% 70% at 30% 40%, #000 20%, transparent 80%);
  -webkit-mask-image: radial-gradient(80% 70% at 30% 40%, #000 20%, transparent 80%);
  pointer-events: none;
}

.cover-watermark {
  position: absolute;
  right: -32px;
  bottom: -58px;
  font-family: var(--font-display);
  font-size: 300px;
  line-height: 1;
  color: rgba(248, 243, 232, 0.035);
  pointer-events: none;
  user-select: none;
}

.cover-top {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.brand-seal {
  width: 42px;
  height: 42px;
  border-radius: 7px;
  background: var(--accent);
  color: #FFF6EC;
  font-family: var(--font-display);
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 26px -12px rgba(180, 83, 42, 0.95);
}

.brand-block {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.brand-name {
  font-family: var(--font-display);
  font-size: 19px;
  letter-spacing: 0.08em;
  color: #FAF5EA;
}

.brand-sub {
  font-size: 9px;
  letter-spacing: 0.24em;
  color: rgba(248, 243, 232, 0.42);
}

.cover-main {
  position: relative;
  z-index: 1;
  max-width: 430px;
  display: flex;
  flex-direction: column;
  animation: riseIn 0.7s 0.12s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes riseIn {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

.cover-kicker {
  font-size: 10px;
  letter-spacing: 0.3em;
  color: rgba(248, 243, 232, 0.44);
  margin-bottom: 22px;
}

.cover-title {
  font-family: var(--font-display);
  font-size: 38px;
  line-height: 1.42;
  letter-spacing: 0.015em;
  color: #FAF5EA;
}

.cover-title-accent {
  color: #E39A6F;
}

.cover-desc {
  margin-top: 22px;
  max-width: 340px;
  font-size: 13px;
  line-height: 1.9;
  color: rgba(248, 243, 232, 0.56);
}

.cover-bottom {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.cover-tags {
  display: flex;
  gap: 8px;
}

.cover-tag {
  font-size: 11px;
  letter-spacing: 0.06em;
  color: rgba(248, 243, 232, 0.62);
  padding: 5px 11px;
  border: 1px solid rgba(248, 243, 232, 0.18);
  border-radius: 999px;
}

.cover-version {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.16em;
  color: rgba(248, 243, 232, 0.30);
}

/* ========== 右侧表单 ========== */
.login-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
}

.form-wrap {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  animation: riseIn 0.65s 0.2s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.form-kicker {
  font-size: 10px;
  letter-spacing: 0.3em;
  color: var(--accent);
  margin-bottom: 14px;
}

.form-title {
  font-family: var(--font-display);
  font-size: 34px;
  line-height: 1.2;
  letter-spacing: 0.04em;
  color: var(--ink);
}

.form-sub {
  margin-top: 10px;
  font-size: 13px;
  color: var(--muted);
}

.login-form {
  margin-top: 34px;
}

.field {
  margin-bottom: 22px;
}

.field-label {
  display: block;
  font-size: 11px;
  letter-spacing: 0.14em;
  color: var(--muted);
  margin-bottom: 8px;
}

.field-input {
  width: 100%;
  height: 42px;
  border: none;
  border-bottom: 1px solid var(--line-strong);
  background: transparent;
  padding: 0 2px;
  font-size: 15px;
  color: var(--ink);
  transition: border-color 0.2s ease;
}

.field-input:focus {
  border-bottom-color: var(--accent);
}

.role-section {
  margin: 6px 0 30px;
}

.role-options {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.role-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 11px 10px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface);
  cursor: pointer;
  transition: all 0.18s ease;
}

.role-item:hover {
  border-color: var(--line-strong);
  background: #FFFDF9;
}

.role-item:active {
  transform: scale(0.98);
}

.role-item.active {
  border-color: var(--accent);
  background: var(--accent);
  box-shadow: 0 10px 22px -14px rgba(180, 83, 42, 0.9);
}

.label {
  font-size: 13px;
  color: var(--ink-2);
  letter-spacing: 0.04em;
  transition: color 0.18s ease;
}

.role-item.active .label {
  color: #FFF8F1;
  font-weight: 600;
}

.login-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 10px;
  background: var(--ink);
  color: #F8F3E8;
  font-size: 15px;
  letter-spacing: 0.06em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 16px 30px -20px rgba(23, 35, 59, 0.9);
}

.login-btn:hover {
  background: #24334F;
  transform: translateY(-1px);
}

.login-btn:active {
  transform: translateY(0) scale(0.995);
}

.login-btn[disabled] {
  opacity: 0.55;
  transform: none;
}

.btn-arrow {
  font-size: 15px;
  color: #E9A277;
}

.form-note {
  margin-top: 22px;
  font-size: 11px;
  line-height: 1.8;
  color: #9AA2AE;
}

@media (max-width: 900px) {
  .login-page {
    flex-direction: column;
  }
  .login-cover {
    width: 100%;
    min-height: auto;
    padding: 28px 24px 32px;
    gap: 26px;
  }
  .cover-main {
    max-width: 100%;
  }
  .cover-title {
    font-size: 26px;
  }
  .cover-desc {
    display: none;
  }
  .cover-bottom {
    display: none;
  }
  .login-panel {
    padding: 32px 20px 44px;
  }
  .form-wrap {
    max-width: 100%;
  }
  .form-title {
    font-size: 27px;
  }
}
</style>
