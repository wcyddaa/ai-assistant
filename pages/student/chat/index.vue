<!-- pages/student/chat/index.vue - 学生AI对话 -->
<template>
  <AppLayout>
    <view class="chat-container">
      <!-- 页面头部 -->
      <view class="chat-head">
        <view class="head-left">
          <text class="head-kicker">AI ASSISTANT</text>
          <text class="head-title">AI 助教</text>
          <text class="head-sub">教学班知识库 · 课程答疑</text>
        </view>
        <view class="head-seal">辅</view>
      </view>

      <!-- 教学班选择器 -->
      <view class="class-selector">
        <text class="selector-label">选择教学班：</text>
        <picker
          class="class-picker"
          :value="classPickerIndex"
          :range="classPickerOptions"
          range-key="name"
          @change="handleClassChange"
        >
          <view class="picker-display">
            <text :class="selectedClassId ? 'picker-text' : 'picker-placeholder'">
              {{ selectedClassId ? selectedClassName : '请选择教学班' }}
            </text>
            <text class="picker-arrow">&#9660;</text>
          </view>
        </picker>
        <text v-if="selectedClassId" class="class-hint">已限定本班知识库范围</text>
      </view>

      <!-- 智能体选择：必须选择本教学班的问答智能体实例 -->
      <view v-if="selectedClassId" class="agent-selector">
        <text class="selector-label">问答智能体</text>
        <scroll-view v-if="classAgents.length" scroll-x class="agent-scroll">
          <view class="agent-chips">
            <view
              v-for="(a, i) in classAgents"
              :key="a.id"
              class="agent-chip"
              :class="{ active: agentPickerIndex === i }"
              @click="selectAgent(i)"
            >
              <text class="chip-name">{{ a.agentName || '未命名' }}</text>
              <text v-if="a.modelName" class="chip-model">{{ a.modelName }}</text>
            </view>
          </view>
        </scroll-view>
        <text v-else class="agent-empty">本教学班暂未配置可用的问答智能体，请联系教师配置后再提问</text>
      </view>

      <!-- 消息列表 -->
      <scroll-view
        class="chat-messages"
        scroll-y
        :scroll-top="scrollTop"
        :scroll-with-animation="true"
      >
        <view
          v-for="(msg, i) in messages"
          :key="msg.message_id || i"
          class="msg-item"
          :class="msg.role === 'user' ? 'msg-user' : 'msg-ai'"
        >
          <view class="msg-bubble">
            <text class="msg-text" selectable="true">{{ msg.content }}</text>
          </view>
        </view>
        <view v-if="loading" class="msg-item msg-ai">
          <view class="msg-bubble loading-bubble">
            <text class="loading-text">AI正在思考...</text>
          </view>
        </view>
        <view v-if="messages.length === 0 && !loading" class="empty-chat">
          <view class="empty-seal">问</view>
          <text class="empty-text">你好！我是本教学班的 AI 助教</text>
          <text class="empty-hint">{{ selectedClassId ? (selectedAgent ? '仅检索本教学班绑定资源，提问将计入本班额度' : '请选择本班的问答智能体后开始提问') : '请先选择教学班' }}</text>
        </view>
      </scroll-view>

      <!-- 底部输入栏 -->
      <view class="chat-input-bar">
        <input
          class="chat-input"
          v-model="inputText"
          :placeholder="inputPlaceholder"
          :disabled="loading"
          @confirm="handleSend"
        />
        <button
          class="send-btn"
          @click="handleSend"
          :disabled="loading || !inputText.trim() || !selectedClassId || !selectedAgent"
        >发送</button>
      </view>
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useUserStore } from '@/store/user'
import { sendMessage, type ChatMessage } from '@/api/chat'
import { getStudentClasses, type ClassInfo } from '@/api/class'
import { listPublicAgents, type PublicAgent } from '@/api/agent-config'

const userStore = useUserStore()
const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const loading = ref(false)
const scrollTop = ref(0)
const sessionId = ref<string>('')

// 教学班选择
const myClasses = ref<ClassInfo[]>([])
const selectedClassId = ref<number | null>(null)
const classPickerIndex = ref(-1)

const selectedClassName = computed(() => {
  const cls = myClasses.value.find(c => c.id === selectedClassId.value)
  return cls?.name || ''
})

const classPickerOptions = computed(() => myClasses.value)

// 教学班智能体（只列出问答智能体实例）
const classAgents = ref<PublicAgent[]>([])
const agentPickerIndex = ref(-1)
const selectedAgent = computed(() => {
  const idx = agentPickerIndex.value
  return idx >= 0 && idx < classAgents.value.length ? classAgents.value[idx] : null
})

const inputPlaceholder = computed(() => {
  if (!selectedClassId.value) return '请先选择教学班'
  if (!selectedAgent.value) return '请先选择本班的问答智能体'
  return '输入问题...'
})

function resetConversation() {
  sessionId.value = ''
  messages.value = []
}

function selectAgent(index: number) {
  if (agentPickerIndex.value === index) return
  agentPickerIndex.value = index
  resetConversation()
}

async function fetchMyClasses() {
  const userId = userStore.userInfo?.userId
  if (!userId) return
  try {
    myClasses.value = await getStudentClasses(userId)
  } catch {
    myClasses.value = []
  }
  // 只有一个教学班时自动选中，避免误入“无班级”的通用对话
  if (myClasses.value.length === 1) {
    classPickerIndex.value = 0
    selectedClassId.value = myClasses.value[0].id
    await loadClassAgents(selectedClassId.value)
  }
}

async function loadClassAgents(classId: number | null) {
  classAgents.value = []
  agentPickerIndex.value = -1
  if (classId == null) return
  try {
    const list = await listPublicAgents(classId)
    classAgents.value = (list || []).filter((a) => a.status === 'active' && a.agentType === 'chat')
  } catch {
    classAgents.value = []
  }
  // 仅一个问答智能体时直接选中；多个时由学生自行选择
  if (classAgents.value.length === 1) {
    agentPickerIndex.value = 0
  }
}

function handleClassChange(e: { detail: { value: number } }) {
  const idx = e.detail.value
  classPickerIndex.value = idx
  const cls = myClasses.value[idx]
  if (selectedClassId.value !== (cls?.id ?? null)) {
    resetConversation()
  }
  selectedClassId.value = cls?.id ?? null
  loadClassAgents(selectedClassId.value)
}

/** 滚动到底部 */
function scrollToBottom() {
  nextTick(() => {
    scrollTop.value = Date.now()
  })
}

/** 发送消息 */
async function handleSend() {
  const text = inputText.value.trim()
  if (!text || loading.value) return
  if (!selectedClassId.value) {
    uni.showToast({ title: '请先选择教学班', icon: 'none' })
    return
  }
  if (!selectedAgent.value) {
    uni.showToast({ title: '请选择本班的问答智能体', icon: 'none' })
    return
  }

  const tempMsg: ChatMessage = {
    role: 'user',
    content: text,
    timestamp: new Date().toISOString(),
    message_id: `temp-${Date.now()}`
  }
  messages.value.push(tempMsg)
  inputText.value = ''
  scrollToBottom()

  loading.value = true

  try {
    const userId = userStore.userInfo?.userId
    const userName = userStore.userInfo?.name || userStore.userInfo?.username || ''

    const result = await sendMessage({
      message: text,
      session_id: sessionId.value || null,
      stream: false,
      class_id: selectedClassId.value,
      agent_name: selectedAgent.value?.agentName || null,
      student_id: userId ?? null,
      student_name: userName
    })

    messages.value.push({
      role: 'assistant',
      content: result.response,
      timestamp: result.timestamp || new Date().toISOString(),
      message_id: result.message_id
    })

    if (!sessionId.value && result.session_id) {
      sessionId.value = result.session_id
    }

    scrollToBottom()
  } catch (err: unknown) {
    messages.value.pop()
    const msg = err instanceof Error ? err.message : '网络错误，请重试'
    uni.showToast({ title: msg, icon: 'none' })
  } finally {
    loading.value = false
  }
}

onShow(() => {
  fetchMyClasses()
})
</script>

<style scoped>
button::after {
  border: none;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 104px);
  overflow: hidden;
}

/* ========== 页面头部 ========== */
.chat-head {
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 4px 4px 14px;
  border-bottom: 1px solid var(--line);
}

.head-left {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.head-kicker {
  font-size: 10px;
  letter-spacing: 0.24em;
  color: var(--accent);
}

.head-title {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: 0.02em;
  color: var(--ink);
}

.head-sub {
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--muted);
}

.head-seal {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 6px;
  border: 1px solid rgba(180, 83, 42, 0.2);
  background: var(--accent-soft);
  color: var(--accent-ink);
  font-family: var(--font-display);
  font-size: 15px;
}

/* ========== 教学班选择器 ========== */
.class-selector {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 4px;
  border-bottom: 1px solid var(--line);
}

.selector-label {
  flex-shrink: 0;
  font-size: 11px;
  letter-spacing: 0.14em;
  color: var(--muted);
}

.class-picker {
  flex: 1;
}

.picker-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface);
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease;
}

.picker-display:hover {
  border-color: var(--line-strong);
  background: #FFFEFB;
}

.picker-text {
  font-size: 13px;
  color: var(--ink);
}

.picker-placeholder {
  font-size: 13px;
  color: var(--muted);
}

.picker-arrow {
  font-size: 10px;
  color: var(--muted);
}

.class-hint {
  flex-shrink: 0;
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--success);
}

.agent-empty {
  font-size: 12px;
  color: var(--warning);
}

/* ========== 智能体 chips ========== */
.agent-selector {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 4px 12px;
  border-bottom: 1px solid var(--line);
}

.agent-scroll {
  flex: 1;
  white-space: nowrap;
}

.agent-chips {
  display: inline-flex;
  gap: 8px;
  padding: 2px 0;
}

.agent-chip {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
  padding: 7px 13px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface);
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
}

.agent-chip:hover {
  border-color: var(--line-strong);
  transform: translateY(-1px);
}

.agent-chip.active {
  border-color: var(--accent);
  background: var(--accent-soft);
  box-shadow: 0 10px 22px -18px rgba(180, 83, 42, 0.85);
}

.chip-name {
  font-size: 12px;
  line-height: 1.35;
  color: var(--ink-2);
}

.agent-chip.active .chip-name {
  color: var(--accent-ink);
  font-weight: 600;
}

.chip-model {
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--muted);
}

.agent-chip.active .chip-model {
  color: var(--accent-ink);
  opacity: 0.72;
}

/* ========== 消息区 ========== */
.chat-messages {
  flex: 1;
  min-height: 0;
  padding: 22px 6px 16px;
  box-sizing: border-box;
  overflow-y: auto;
}

.msg-item {
  display: flex;
  margin-bottom: 16px;
}

.msg-user {
  justify-content: flex-end;
}

.msg-ai {
  justify-content: flex-start;
}

.msg-bubble {
  max-width: 78%;
  padding: 11px 15px;
  border-radius: var(--radius);
}

.msg-user .msg-bubble {
  background: var(--ink);
  border: 1px solid var(--ink);
  border-bottom-right-radius: 4px;
  box-shadow: 0 14px 26px -22px rgba(23, 35, 59, 0.9);
}

.msg-user .msg-text {
  color: #F7F2E7;
}

.msg-ai .msg-bubble {
  background: var(--surface);
  border: 1px solid var(--line);
  border-bottom-left-radius: 4px;
}

.msg-ai .msg-text {
  color: var(--ink-2);
}

.msg-text {
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.msg-ai .loading-bubble {
  background: rgba(235, 229, 217, 0.5);
  border-style: dashed;
  border-color: var(--line-strong);
}

.loading-text {
  font-size: 13px;
  letter-spacing: 0.06em;
  color: var(--muted);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* ========== 空状态 ========== */
.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
  max-width: 520px;
  margin: 48px auto 0;
  padding: 44px 28px;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius);
  background: rgba(255, 253, 248, 0.5);
  text-align: center;
}

.empty-seal {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid rgba(180, 83, 42, 0.2);
  background: var(--accent-soft);
  color: var(--accent-ink);
  font-family: var(--font-display);
  font-size: 19px;
}

.empty-text {
  font-family: var(--font-display);
  font-size: 17px;
  letter-spacing: 0.02em;
  color: var(--ink);
}

.empty-hint {
  font-size: 12px;
  line-height: 1.8;
  color: var(--muted);
  padding: 0 8px;
}

/* ========== 底部输入区 ========== */
.chat-input-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 6px;
  border-top: 1px solid var(--line);
  background: rgba(244, 240, 232, 0.94);
  backdrop-filter: saturate(140%) blur(10px);
  -webkit-backdrop-filter: saturate(140%) blur(10px);
}

.chat-input {
  flex: 1;
  height: 42px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #FDFBF6;
  font-size: 14px;
  color: var(--ink);
  box-sizing: border-box;
  transition: border-color 0.18s ease, background 0.18s ease;
}

.chat-input:focus {
  border-color: var(--accent);
  background: var(--surface);
  outline: none;
}

.send-btn {
  flex-shrink: 0;
  width: 68px;
  height: 42px;
  line-height: 42px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 10px;
  background: var(--ink);
  color: #F7F2E7;
  font-size: 13px;
  letter-spacing: 0.1em;
  transition: background 0.18s ease, transform 0.18s ease;
}

.send-btn:hover {
  background: #24334F;
}

.send-btn:active {
  transform: translateY(1px);
}

.send-btn[disabled] {
  opacity: 0.45;
  transform: none;
}

@media (max-width: 768px) {
  .chat-container {
    height: calc(100vh - 92px);
  }
  .chat-head {
    padding: 2px 2px 10px;
  }
  .head-title {
    font-size: 20px;
  }
  .head-seal {
    display: none;
  }
  .class-selector {
    padding: 10px 2px;
    gap: 6px;
  }
  .selector-label {
    display: none;
  }
  .picker-display {
    padding: 7px 10px;
  }
  .agent-selector {
    padding: 8px 2px 10px;
  }
  .chat-messages {
    padding: 16px 2px 12px;
  }
  .msg-bubble {
    max-width: 86%;
  }
  .msg-text {
    font-size: 13.5px;
  }
  .empty-chat {
    margin-top: 24px;
    padding: 34px 18px;
  }
  .empty-text {
    font-size: 15px;
  }
  .chat-input-bar {
    padding: 10px 2px;
    gap: 8px;
  }
  .chat-input {
    height: 40px;
    padding: 0 12px;
    font-size: 13.5px;
  }
  .send-btn {
    width: 60px;
    height: 40px;
    line-height: 40px;
    font-size: 12.5px;
  }
}
</style>