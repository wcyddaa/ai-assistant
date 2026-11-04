<!-- pages/teacher/agent-config/index.vue - 教师端智能体实例（模板内置，实例按教学班） -->
<template>
  <AppLayout>
    <view class="page-container">
      <view class="page-header">
        <view class="header-text">
          <text class="page-kicker">AGENT STUDIO</text>
          <text class="page-title">智能体实例</text>
          <text class="page-desc">模板由平台内置，教师在教学班内配置提示词与已发布模型，班内智能体共享班级额度</text>
        </view>
        <button v-if="classOptions.length" class="btn-add" @click="openCreate">新增实例</button>
      </view>

      <view v-if="loading" class="loading-state">
        <text class="loading-text">加载中...</text>
      </view>

      <view v-else-if="classOptions.length === 0" class="empty-state">
        <text class="empty-text">暂未绑定教学班，请先创建或联系管理员分配教学班</text>
      </view>

      <view v-else class="content">
        <!-- 教学班切换 -->
        <view class="class-bar">
          <text class="class-label">当前教学班</text>
          <picker
            class="class-picker"
            :value="selectedClassIndex"
            :range="classOptions"
            range-key="label"
            @change="handleClassChange"
          >
            <view class="picker-display">
              <text class="picker-text">{{ selectedClassLabel || '请选择教学班' }}</text>
              <text class="picker-arrow">&#9660;</text>
            </view>
          </picker>
          <button class="btn-quota" @click="openQuotaDialog">调整班级额度</button>
        </view>

        <!-- 额度与用量概览 -->
        <view class="usage-card">
          <view class="usage-item">
            <text class="usage-value">{{ usage.agentCount }}</text>
            <text class="usage-label">智能体实例</text>
          </view>
          <view class="usage-item">
            <text class="usage-value primary">{{ formatNumber(usage.classTokenUsed) }}</text>
            <text class="usage-label">班级已用 Token</text>
          </view>
          <view class="usage-item">
            <text class="usage-value success">{{ usage.classQuotaConfigured ? formatNumber(usage.classTokenLimit) : '未分配' }}</text>
            <text class="usage-label">班级额度</text>
          </view>
          <view class="usage-item">
            <text class="usage-value warning">{{ usage.requestUsedToday }}</text>
            <text class="usage-label">今日调用</text>
          </view>
        </view>

        <view class="quota-block">
          <view class="quota-head">
            <text class="quota-title">班级额度使用情况</text>
            <text class="quota-text">
              {{ formatNumber(usage.classTokenUsed) }} / {{ usage.classQuotaConfigured ? formatNumber(usage.classTokenLimit) : '未分配' }}
            </text>
          </view>
          <view class="progress-track">
            <view class="progress-fill" :class="classProgressClass" :style="{ width: classPercent + '%' }" />
          </view>
          <text class="quota-hint">
            该教学班全部智能体共用这份额度；平台总额度由管理员设置，分配后剩余额度同步减少。
          </text>
        </view>

        <view class="section-header">
          <text class="section-title">智能体实例</text>
          <text class="section-sub">模板固定 · 按教学班隔离</text>
        </view>

        <view v-if="agents.length === 0" class="empty-agents">
          <text class="empty-text">该教学班还没有智能体实例，点击右上角「新增实例」选择模板开始配置</text>
        </view>

        <view v-else class="agent-list">
          <view v-for="agent in agents" :key="agent.id" class="agent-card">
            <view class="agent-head">
              <view class="agent-name-wrap">
                <view class="agent-avatar" :class="typeClass(agent.agentType)">
                  {{ typeBadge(agent.agentType) }}
                </view>
                <view class="agent-title-wrap">
                  <text class="agent-name">{{ agent.agentName || templateName(agent.agentType) }}</text>
                  <text class="agent-type">{{ templateName(agent.agentType) }}</text>
                </view>
              </view>
              <text class="status-badge" :class="agent.status === 'active' ? 'active' : 'inactive'">
                {{ agent.status === 'active' ? '已启用' : '已停用' }}
              </text>
            </view>

            <view class="agent-meta">
              <view class="meta-item">
                <text class="meta-label">使用模型</text>
                <text class="meta-value mono">{{ agent.modelName || '未绑定' }}</text>
              </view>
              <view class="meta-item">
                <text class="meta-label">今日请求</text>
                <text class="meta-value">{{ todayRequestUsed(agent) }} / {{ agent.requestLimitDaily || '不限' }}</text>
              </view>
              <view class="meta-item">
                <text class="meta-label">提示词</text>
                <text class="meta-value prompt">{{ promptPreview(agent) }}</text>
              </view>
            </view>

            <view class="agent-actions">
              <button class="btn-ghost" :disabled="testingAgentId === agent.id" @click="testSavedAgent(agent)">
                {{ testingAgentId === agent.id ? '测试中...' : '测试连接' }}
              </button>
              <button class="btn-ghost" @click="openEdit(agent)">编辑</button>
              <button class="btn-danger" @click="removeAgent(agent)">删除</button>
            </view>
          </view>
        </view>
      </view>

      <!-- 新增/编辑弹窗 -->
      <view v-if="showDialog" class="dialog-mask" @click="closeDialog">
        <view class="dialog" @click.stop>
          <view class="dialog-head">
            <text class="dialog-title">{{ editingId ? '编辑智能体实例' : '新增智能体实例' }}</text>
            <text class="dialog-close" @click="closeDialog">×</text>
          </view>

          <scroll-view scroll-y class="dialog-body">
            <view class="form-grid">
              <view class="form-row">
                <text class="form-label required">智能体模板</text>
                <picker
                  v-if="!editingId"
                  :value="templateIndex"
                  :range="templateOptions"
                  range-key="label"
                  @change="handleTemplateChange"
                >
                  <view class="picker-display">
                    <text class="picker-text">{{ templateLabel || '请选择模板' }}</text>
                    <text class="picker-arrow">&#9660;</text>
                  </view>
                </picker>
                <view v-else class="readonly-box">{{ templateLabel }}</view>
                <text v-if="!editingId" class="form-hint">{{ currentTemplate?.description }}</text>
              </view>

              <view class="form-row">
                <text class="form-label">实例名称</text>
                <input class="form-input" v-model="form.agentName" placeholder="默认使用模板名称" />
              </view>

              <view class="form-row full">
                <text class="form-label required">使用模型（管理员已发布）</text>
                <picker
                  :value="modelIndex"
                  :range="modelOptions"
                  range-key="label"
                  @change="handleModelChange"
                  :disabled="modelOptions.length === 0"
                >
                  <view class="picker-display" :class="{ disabled: modelOptions.length === 0 }">
                    <text class="picker-text">{{ modelLabel || '暂无可选模型' }}</text>
                    <text class="picker-arrow">&#9660;</text>
                  </view>
                </picker>
                <text v-if="modelOptions.length === 0" class="form-hint warn">
                  管理员尚未发布该模板可用的模型；可切换上方智能体模板，或联系管理员完成连接测试并发布。
                </text>
                <text v-else class="form-hint">仅可选择管理员测试连接成功并已发布的模型，密钥由平台统一配置。</text>
              </view>

              <view class="form-row full">
                <text class="form-label">角色定义</text>
                <input class="form-input" v-model="form.roleDefinition" placeholder="如：本课程答疑助教" />
              </view>

              <view class="form-row full">
                <view class="prompt-head">
                  <text class="form-label">系统提示词</text>
                  <text class="link-btn" @click="resetPrompt">使用模板默认提示词</text>
                </view>
                <textarea
                  class="form-textarea"
                  v-model="form.systemPrompt"
                  placeholder="定义该实例如何回答学生问题、如何生成作业等行为..."
                />
              </view>

              <view class="form-row">
                <text class="form-label">温度（0-2）</text>
                <input class="form-input" v-model="form.temperature" type="digit" placeholder="0.3" />
              </view>
              <view class="form-row">
                <text class="form-label">单次最大 Token</text>
                <input class="form-input" v-model="form.maxTokens" type="number" placeholder="4096" />
              </view>
              <view class="form-row">
                <text class="form-label">每日请求上限</text>
                <input class="form-input" v-model="form.requestLimitDaily" type="number" placeholder="留空表示不限" />
              </view>
              <view class="form-row">
                <text class="form-label">状态</text>
                <view class="segmented">
                  <view class="segment" :class="{ 'segment-active': form.status === 'active' }" @click="form.status = 'active'">启用</view>
                  <view class="segment" :class="{ 'segment-active': form.status !== 'active' }" @click="form.status = 'inactive'">停用</view>
                </view>
              </view>
            </view>
          </scroll-view>

          <view class="dialog-foot">
            <button class="btn-ghost" @click="closeDialog">取消</button>
            <button class="btn-primary" :disabled="saving || modelOptions.length === 0" @click="handleSave">
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </view>
        </view>
      </view>

      <!-- 班级额度弹窗 -->
      <view v-if="showQuotaDialog" class="dialog-mask" @click="showQuotaDialog = false">
        <view class="dialog quota-dialog" @click.stop>
          <view class="dialog-head">
            <text class="dialog-title">调整班级额度</text>
            <text class="dialog-close" @click="showQuotaDialog = false">×</text>
          </view>
          <view class="dialog-body quota-body">
            <view class="platform-line">
              <text class="platform-label">平台总额度</text>
              <text class="platform-value">{{ formatNumber(platformQuota.totalTokenLimit) }}</text>
            </view>
            <view class="platform-line">
              <text class="platform-label">平台剩余可分配</text>
              <text class="platform-value accent">{{ formatNumber(platformQuota.availableTokenLimit) }}</text>
            </view>
            <view class="form-row quota-row">
              <text class="form-label">本班额度（token）</text>
              <input class="form-input" v-model="quotaInput" type="number" placeholder="请输入分配额度" />
            </view>
            <text class="form-hint">
              教师只能调整本教学班额度；分配后平台可分配额度同步减少。当前已用
              {{ formatNumber(classQuota.tokenUsed) }} token，额度不能低于已用量。
            </text>
          </view>
          <view class="dialog-foot">
            <button class="btn-ghost" @click="showQuotaDialog = false">取消</button>
            <button class="btn-primary" :disabled="savingQuota" @click="saveQuota">
              {{ savingQuota ? '保存中...' : '保存额度' }}
            </button>
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
import { useUserStore } from '@/store/user'
import { getClassesByTeacher } from '@/api/class'
import { getPublishedModels, type ModelConfigItem } from '@/api/config'
import {
  listAgentTemplates,
  listAgents,
  getClassAgentUsage,
  getClassQuota,
  getPlatformQuotaOverview,
  updateClassQuota,
  saveAgent,
  deleteAgent,
  testAgentInstance,
  type AgentClassConfig,
  type AgentTemplate,
  type ClassAgentUsage,
  type ClassQuotaInfo,
  type PlatformQuotaOverview
} from '@/api/agent-config'

interface PickerChangeEvent {
  detail: { value: number }
}

interface ClassOption {
  id: number
  label: string
}

const userStore = useUserStore()
const loading = ref(false)
const saving = ref(false)
const savingQuota = ref(false)

// 教学班
const classOptions = ref<ClassOption[]>([])
const selectedClassIndex = ref(-1)
const selectedClassId = ref<number | null>(null)
const selectedClassLabel = computed(() => {
  const idx = selectedClassIndex.value
  return idx >= 0 && idx < classOptions.value.length ? classOptions.value[idx].label : ''
})

// 模板
const templates = ref<AgentTemplate[]>([])
const templateOptions = computed(() => templates.value.map((t) => ({ value: t.code, label: t.name })))
const templateIndex = ref(0)
const currentTemplate = computed(() => templates.value[templateIndex.value])
/** 管理员已发布模型对应的智能体类型，用于新增时优先选择可用模板 */
const publishedAgentTypes = ref<string[]>([])

// 实例与用量
const agents = ref<AgentClassConfig[]>([])
const usage = ref<ClassAgentUsage>({
  agentCount: 0,
  tokenUsed: 0,
  tokenLimit: 0,
  requestUsedToday: 0,
  classTokenLimit: 0,
  classTokenUsed: 0,
  classQuotaConfigured: false,
  agents: []
})

// 额度
const classQuota = ref<ClassQuotaInfo>({
  classId: 0,
  configured: false,
  totalTokenLimit: 0,
  tokenUsed: 0,
  remainingTokenLimit: 0
})
const platformQuota = ref<PlatformQuotaOverview>({
  totalTokenLimit: 0,
  allocatedTokenLimit: 0,
  availableTokenLimit: 0,
  tokenUsed: 0,
  classCount: 0
})
const showQuotaDialog = ref(false)
const quotaInput = ref('')

const classPercent = computed(() => {
  const limit = usage.value.classTokenLimit || 0
  if (limit <= 0) return 0
  return Math.min(Math.round(((usage.value.classTokenUsed || 0) / limit) * 100), 100)
})
const classProgressClass = computed(() => {
  const p = classPercent.value
  if (p >= 90) return 'danger'
  if (p >= 60) return 'warning'
  return 'normal'
})

// 弹窗
const showDialog = ref(false)
const editingId = ref<number | null>(null)
const form = ref<AgentClassConfig>(createEmptyForm())

// 可选模型
const modelOptions = ref<Array<{ id: number; label: string; value: number }>>([])
const modelIndex = ref(0)
const modelLabel = computed(() => {
  const idx = modelIndex.value
  return idx >= 0 && idx < modelOptions.value.length ? modelOptions.value[idx].label : ''
})
const templateLabel = computed(() => {
  const t = templates.value.find((x) => x.code === form.value.agentType)
  return t?.name || ''
})

// 连接测试
const testingAgentId = ref<number | null>(null)

function createEmptyForm(): AgentClassConfig {
  return {
    classId: 0,
    teacherId: 0,
    agentName: '',
    agentType: 'chat',
    modelConfigId: null,
    temperature: 0.3,
    maxTokens: 4096,
    roleDefinition: '',
    systemPrompt: '',
    status: 'active'
  }
}

function handleClassChange(e: PickerChangeEvent) {
  const idx = e.detail.value
  if (idx < 0 || idx >= classOptions.value.length) return
  selectedClassIndex.value = idx
  selectedClassId.value = classOptions.value[idx].id
  loadClassData(classOptions.value[idx].id)
}

async function fetchData() {
  loading.value = true
  try {
    const userId = userStore.userInfo?.userId
    if (!userId) {
      classOptions.value = []
      return
    }
    const [classes, templateList, publishedList] = await Promise.all([
      getClassesByTeacher(userId),
      listAgentTemplates().catch(() => [] as AgentTemplate[]),
      getPublishedModels().catch(() => [] as ModelConfigItem[])
    ])
    templates.value = templateList
    publishedAgentTypes.value = (publishedList || [])
      .map((m) => m.agentName)
      .filter((name): name is string => !!name)
    classOptions.value = classes.list.map((c) => ({ id: c.id, label: c.name }))
    if (classOptions.value.length) {
      const previousId = selectedClassId.value
      const idx = previousId == null ? -1 : classOptions.value.findIndex((c) => c.id === previousId)
      const targetIndex = idx >= 0 ? idx : 0
      selectedClassIndex.value = targetIndex
      selectedClassId.value = classOptions.value[targetIndex].id
      await loadClassData(selectedClassId.value)
    }
  } catch {
    classOptions.value = []
  } finally {
    loading.value = false
  }
}

async function loadClassData(classId: number) {
  try {
    const [list, usageRes, quotaRes, platformRes] = await Promise.all([
      listAgents(classId),
      getClassAgentUsage(classId).catch(() => null),
      getClassQuota(classId).catch(() => null),
      getPlatformQuotaOverview().catch(() => null)
    ])
    agents.value = list || []
    if (usageRes) {
      usage.value = usageRes
    } else {
      usage.value = {
        agentCount: agents.value.length,
        tokenUsed: agents.value.reduce((s, a) => s + (a.tokenUsed || 0), 0),
        tokenLimit: 0,
        requestUsedToday: 0,
        classTokenLimit: 0,
        classTokenUsed: 0,
        classQuotaConfigured: false,
        agents: agents.value
      }
    }
    if (quotaRes) classQuota.value = quotaRes
    if (platformRes) platformQuota.value = platformRes
  } catch {
    agents.value = []
  }
}

function openCreate() {
  if (selectedClassId.value == null) {
    uni.showToast({ title: '请先选择教学班', icon: 'none' })
    return
  }
  editingId.value = null
  form.value = createEmptyForm()
  const unused = templates.value.filter((t) => !agents.value.some((a) => a.agentType === t.code))
  // 优先选择管理员已发布模型的模板，避免默认落到“暂无可选模型”的模板上
  const preferred = unused.find((t) => publishedAgentTypes.value.includes(t.code)) || unused[0]
  templateIndex.value = preferred ? templates.value.indexOf(preferred) : 0
  form.value.agentType = templates.value[templateIndex.value]?.code || 'chat'
  form.value.agentName = templates.value[templateIndex.value]?.name || ''
  form.value.systemPrompt = templates.value[templateIndex.value]?.defaultPrompt || ''
  showDialog.value = true
  loadPublishedModels()
}

function openEdit(agent: AgentClassConfig) {
  editingId.value = agent.id ?? null
  const idx = templates.value.findIndex((t) => t.code === agent.agentType)
  templateIndex.value = idx >= 0 ? idx : 0
  form.value = {
    ...createEmptyForm(),
    ...agent
  }
  showDialog.value = true
  loadPublishedModels(agent.modelConfigId ?? null)
}

function closeDialog() {
  showDialog.value = false
}

async function loadPublishedModels(keepModelId: number | null = null) {
  modelOptions.value = []
  modelIndex.value = 0
  const agentType = form.value.agentType
  if (!agentType) return
  try {
    const models: ModelConfigItem[] = await getPublishedModels(agentType)
    modelOptions.value = models
      .filter((m) => m.id != null)
      .map((m) => ({ id: m.id as number, value: m.id as number, label: `${m.modelName}（已发布）` }))
    if (keepModelId != null) {
      const idx = modelOptions.value.findIndex((m) => m.id === keepModelId)
      modelIndex.value = idx >= 0 ? idx : 0
      if (idx >= 0) form.value.modelConfigId = keepModelId
    } else if (modelOptions.value.length) {
      form.value.modelConfigId = modelOptions.value[0].id
    }
  } catch {
    modelOptions.value = []
  }
}

function handleTemplateChange(e: PickerChangeEvent) {
  const idx = e.detail.value
  if (idx < 0 || idx >= templates.value.length) return
  templateIndex.value = idx
  const tpl = templates.value[idx]
  form.value.agentType = tpl.code
  form.value.agentName = tpl.name
  form.value.systemPrompt = tpl.defaultPrompt
  loadPublishedModels()
}

function handleModelChange(e: PickerChangeEvent) {
  const idx = e.detail.value
  if (idx < 0 || idx >= modelOptions.value.length) return
  modelIndex.value = idx
  form.value.modelConfigId = modelOptions.value[idx].id
}

function resetPrompt() {
  form.value.systemPrompt = currentTemplate.value?.defaultPrompt || ''
}

function openQuotaDialog() {
  quotaInput.value = String(classQuota.value.totalTokenLimit || '')
  showQuotaDialog.value = true
  getPlatformQuotaOverview().then((res) => { platformQuota.value = res }).catch(() => {})
}

async function saveQuota() {
  if (selectedClassId.value == null) return
  const total = Number(quotaInput.value)
  if (!Number.isFinite(total) || total < 0) {
    uni.showToast({ title: '请输入有效的额度', icon: 'none' })
    return
  }
  savingQuota.value = true
  try {
    await updateClassQuota(selectedClassId.value, Math.floor(total))
    uni.showToast({ title: '额度已更新', icon: 'success' })
    showQuotaDialog.value = false
    await loadClassData(selectedClassId.value)
  } catch (e: unknown) {
    uni.showToast({ title: e instanceof Error ? e.message : '保存失败', icon: 'none' })
  } finally {
    savingQuota.value = false
  }
}

function todayRequestUsed(agent: AgentClassConfig): number {
  if (!agent.requestDate || agent.requestDate !== localDateString()) return 0
  return agent.requestUsed || 0
}

function localDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function templateName(code?: string): string {
  return templates.value.find((t) => t.code === code)?.name || '智能体'
}

function typeBadge(code?: string): string {
  const map: Record<string, string> = {
    chat: '问',
    homework: '作',
    knowledge_graph: '图',
    student_insight: '报'
  }
  return map[code || ''] || '智'
}

function typeClass(code?: string): string {
  return code || 'chat'
}

function promptPreview(agent: AgentClassConfig): string {
  const text = agent.systemPrompt || ''
  if (!text) return '未配置，使用模板默认行为'
  const compact = text.replace(/\s+/g, ' ')
  return compact.length > 46 ? `${compact.slice(0, 46)}...` : compact
}

function toNumber(value: unknown, fallback: number | undefined): number | undefined {
  if (value === '' || value === null || value === undefined) return fallback
  const num = Number(value)
  return Number.isNaN(num) ? fallback : num
}

function toLimit(value: unknown): number | undefined {
  const num = toNumber(value, undefined)
  if (num === undefined || num <= 0) return undefined
  return Math.floor(num)
}

async function handleSave() {
  const classId = selectedClassId.value
  const userId = userStore.userInfo?.userId
  if (classId == null || !userId) return
  if (!form.value.agentType) {
    uni.showToast({ title: '请选择智能体模板', icon: 'none' })
    return
  }
  if (form.value.modelConfigId == null) {
    uni.showToast({ title: '请选择管理员已发布的模型', icon: 'none' })
    return
  }

  const payload: AgentClassConfig = {
    ...form.value,
    id: editingId.value ?? undefined,
    classId,
    teacherId: userId,
    agentName: form.value.agentName?.trim() || templateName(form.value.agentType),
    modelConfigId: form.value.modelConfigId,
    temperature: toNumber(form.value.temperature, 0.3),
    maxTokens: toNumber(form.value.maxTokens, 4096),
    requestLimitDaily: toLimit(form.value.requestLimitDaily)
  }

  saving.value = true
  try {
    await saveAgent(payload)
    showDialog.value = false
    uni.showToast({ title: '保存成功', icon: 'success' })
    await loadClassData(classId)
  } catch (e: unknown) {
    uni.showToast({ title: e instanceof Error ? e.message : '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

async function testSavedAgent(agent: AgentClassConfig) {
  if (agent.id == null) return
  testingAgentId.value = agent.id
  try {
    const res = await testAgentInstance(agent.id)
    uni.showModal({
      title: '连接成功',
      content: `耗时 ${res.latencyMs} ms\n模型：${res.modelName || agent.modelName}\n返回：${res.reply || '模型已响应'}`,
      showCancel: false
    })
  } catch (e: unknown) {
    uni.showModal({
      title: '连接失败',
      content: e instanceof Error ? e.message : '请确认管理员已发布该模型',
      showCancel: false
    })
  } finally {
    testingAgentId.value = null
  }
}

function removeAgent(agent: AgentClassConfig) {
  if (agent.id == null || selectedClassId.value == null) return
  uni.showModal({
    title: '删除智能体实例',
    content: `确定删除「${agent.agentName || templateName(agent.agentType)}」吗？`,
    success: async (res) => {
      if (!res.confirm) return
      try {
        await deleteAgent(agent.id as number)
        uni.showToast({ title: '已删除', icon: 'success' })
        await loadClassData(selectedClassId.value as number)
      } catch (e: unknown) {
        uni.showToast({ title: e instanceof Error ? e.message : '删除失败', icon: 'none' })
      }
    }
  })
}

function formatNumber(value?: number): string {
  const num = value || 0
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return String(num)
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
  font-size: 24px;
  line-height: 1.2;
  letter-spacing: 0.02em;
  color: var(--ink);
}

.page-desc {
  font-size: 11px;
  letter-spacing: 0.06em;
  line-height: 1.6;
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

/* ========== 状态 ========== */
.loading-state {
  padding: 56px 20px;
  text-align: center;
}

.loading-text {
  font-size: 11px;
  letter-spacing: 0.16em;
  color: var(--muted);
}

.empty-state {
  padding: 56px 20px;
  text-align: center;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius);
}

.empty-text {
  font-size: 12.5px;
  letter-spacing: 0.04em;
  color: var(--muted);
}

.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ========== 教学班切换 ========== */
.class-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
}

.class-label {
  flex-shrink: 0;
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--muted);
}

.class-picker {
  flex: 1;
  min-width: 0;
}

.btn-quota {
  flex-shrink: 0;
  margin: 0;
  height: 38px;
  line-height: 36px;
  padding: 0 16px;
  font-size: 12px;
  color: var(--accent);
  background: transparent;
  border: 1px solid var(--accent);
  border-radius: 10px;
  transition: all 0.18s ease;
}

.btn-quota:hover {
  background: var(--accent-soft);
  color: var(--accent-ink);
}

.picker-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 38px;
  padding: 0 12px;
  box-sizing: border-box;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.16s ease;
}

.picker-display.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.picker-display:hover {
  border-color: var(--line-strong);
}

.picker-text {
  font-size: 13px;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.picker-arrow {
  flex-shrink: 0;
  font-size: 10px;
  color: var(--muted);
}

/* ========== 用量概览 ========== */
.usage-card {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 20px 22px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
}

.usage-item {
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;
  padding: 0 20px;
  border-right: 1px solid var(--line);
}

.usage-item:first-child { padding-left: 0; }

.usage-item:last-child {
  padding-right: 0;
  border-right: none;
}

.usage-value {
  font-family: var(--font-display);
  font-size: 26px;
  line-height: 1;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

.usage-value.primary { color: var(--accent); }
.usage-value.success { color: var(--success); }
.usage-value.warning { color: var(--warning); }

.usage-label {
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--muted);
}

/* ========== 班级额度 ========== */
.quota-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 18px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
}

.quota-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.quota-title {
  font-family: var(--font-display);
  font-size: 15px;
  color: var(--ink);
}

.quota-text {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
}

.quota-hint {
  font-size: 11px;
  line-height: 1.6;
  color: var(--muted);
}

.progress-track {
  height: 5px;
  background: var(--paper-deep);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--accent);
  transition: width 0.3s ease;
}

.progress-fill.normal { background: var(--accent); }
.progress-fill.warning { background: var(--warning); }
.progress-fill.danger { background: var(--danger); }

/* ========== 列表区标题 ========== */
.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-top: 4px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line);
}

.section-title {
  font-family: var(--font-display);
  font-size: 17px;
  color: var(--ink);
}

.section-sub {
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--muted);
}

.empty-agents {
  padding: 40px 20px;
  text-align: center;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius);
}

/* ========== 智能体卡片 ========== */
.agent-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 14px;
}

.agent-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 20px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.agent-card:hover {
  transform: translateY(-2px);
  border-color: var(--line-strong);
}

.agent-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.agent-name-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.agent-avatar {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 17px;
  border-radius: 6px;
  color: #F7F0E2;
  background: var(--ink);
}

.agent-avatar.homework { background: var(--accent); }
.agent-avatar.knowledge_graph { background: #3F6B52; }
.agent-avatar.student_insight { background: #8A6A2F; }

.agent-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.agent-name {
  font-family: var(--font-display);
  font-size: 16px;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agent-type {
  font-size: 10.5px;
  letter-spacing: 0.1em;
  color: var(--muted);
}

.status-badge {
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.04em;
}

.status-badge.active {
  background: rgba(63, 107, 82, 0.12);
  color: var(--success);
}

.status-badge.inactive {
  background: var(--paper-deep);
  color: var(--muted);
}

/* ========== 元信息 ========== */
.agent-meta {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 4px 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.meta-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
}

.meta-label {
  flex-shrink: 0;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.meta-value {
  max-width: 66%;
  font-size: 12.5px;
  color: var(--ink-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.meta-value.prompt {
  max-width: 72%;
  font-size: 11.5px;
  color: var(--muted);
}

.mono {
  font-family: var(--font-mono);
  font-size: 11.5px;
  letter-spacing: 0.02em;
}

/* ========== 卡片操作 ========== */
.agent-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 2px;
}

.btn-ghost {
  margin: 0;
  height: 32px;
  line-height: 30px;
  padding: 0 14px;
  font-size: 12px;
  color: var(--ink-2);
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 10px;
  transition: all 0.16s ease;
}

.btn-ghost:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.btn-danger {
  margin: 0;
  height: 32px;
  line-height: 30px;
  padding: 0 14px;
  font-size: 12px;
  color: var(--danger);
  background: transparent;
  border: 1px solid rgba(163, 59, 46, 0.3);
  border-radius: 10px;
  transition: all 0.16s ease;
}

.btn-danger:hover {
  background: rgba(163, 59, 46, 0.08);
  border-color: var(--danger);
}

/* ========== 弹窗 ========== */
.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(23, 35, 59, 0.34);
}

.dialog {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 640px;
  max-height: 86vh;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lift);
  overflow: hidden;
}

.dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 24px 14px;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
}

.dialog-title {
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--ink);
}

.dialog-close {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  color: var(--muted);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.16s ease;
}

.dialog-close:hover {
  color: var(--ink);
  background: var(--paper-deep);
}

/* scroll-view 作为 flex 子项默认 min-height:auto，会按内容撑高导致超出弹窗被裁切；
   min-height:0 才能让它在弹窗高度内收缩并出现内部滚动条 */
.dialog-body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 18px 24px;
  box-sizing: border-box;
  overflow: hidden;
}

.dialog-body :deep(.uni-scroll-view) {
  height: 100%;
  max-height: 100%;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 18px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.form-row.full { grid-column: span 2; }

.form-label {
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--muted);
}

.form-label.required::after {
  content: ' *';
  color: var(--accent);
}

.form-hint {
  font-size: 10.5px;
  line-height: 1.6;
  color: var(--muted);
}

.form-hint.warn { color: var(--danger); }

.form-input {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  box-sizing: border-box;
  font-size: 13px;
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

.readonly-box {
  height: 38px;
  line-height: 38px;
  padding: 0 12px;
  font-size: 13px;
  color: var(--ink-2);
  background: var(--paper-deep);
  border: 1px solid var(--line);
  border-radius: 10px;
}

.form-textarea {
  width: 100%;
  min-height: 130px;
  padding: 10px 12px;
  box-sizing: border-box;
  font-size: 13px;
  line-height: 1.75;
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

.prompt-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.link-btn {
  font-size: 11px;
  color: var(--accent);
  cursor: pointer;
}

.link-btn:hover { text-decoration: underline; }

/* 启用/停用 */
.segmented {
  display: flex;
  height: 38px;
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
}

.segment {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12.5px;
  color: var(--muted);
  background: var(--surface);
  cursor: pointer;
  transition: all 0.16s ease;
}

.segment:hover { color: var(--ink); }

.segment-active {
  color: #F8F3E8;
  background: var(--ink);
}

/* ========== 额度弹窗 ========== */
.quota-dialog { max-width: 460px; }

.quota-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.platform-line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px dashed var(--line);
}

.platform-label {
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.platform-value {
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.platform-value.accent { color: var(--accent); }

.quota-row { margin-top: 4px; }

/* ========== 弹窗底部 ========== */
.dialog-foot {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 14px 24px 20px;
  border-top: 1px solid var(--line);
  flex-shrink: 0;
}

.btn-primary {
  margin: 0;
  height: 38px;
  line-height: 36px;
  padding: 0 24px;
  font-size: 13px;
  color: #F8F3E8;
  background: var(--ink);
  border: 1px solid var(--ink);
  border-radius: 10px;
  transition: background 0.18s ease;
}

.btn-primary:hover { background: #24334F; }

.btn-primary[disabled] { opacity: 0.5; }

/* ========== 移动端 ========== */
@media (max-width: 768px) {
  .page-container { gap: 12px; padding: 0; }
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding-bottom: 12px;
  }
  .page-title { font-size: 20px; }
  .btn-add { width: 100%; text-align: center; }
  .class-bar {
    flex-wrap: wrap;
    padding: 14px 16px;
  }
  .class-picker { width: 100%; flex-basis: 100%; }
  .btn-quota { width: 100%; }
  .usage-card {
    grid-template-columns: repeat(2, 1fr);
    gap: 18px 0;
    padding: 18px 16px;
  }
  .usage-item { padding: 0 14px; }
  .usage-item:nth-child(2n) { border-right: none; }
  .usage-item:nth-child(odd) { padding-left: 0; }
  .usage-value { font-size: 22px; }
  .agent-list { grid-template-columns: 1fr; gap: 10px; }
  .agent-card { padding: 16px; }
  .dialog-mask { padding: 12px; }
  .dialog { max-height: 90vh; }
  .dialog-head { padding: 18px 16px 12px; }
  .dialog-body { padding: 16px; }
  .form-grid { grid-template-columns: 1fr; gap: 12px; }
  .form-row.full { grid-column: span 1; }
  .dialog-foot { padding: 12px 16px 16px; }
  .dialog-foot .btn-ghost,
  .dialog-foot .btn-primary { flex: 1; }
  .agent-actions { justify-content: flex-start; }
}
</style>
