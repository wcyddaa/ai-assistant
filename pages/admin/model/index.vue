<!-- pages/admin/model/index.vue - 管理员：模型测试/发布 + 平台额度 + 固定模板 -->
<template>
  <AppLayout>
    <view class="page-container">
      <view class="page-header">
        <view class="header-left">
          <text class="header-kicker">MODEL REGISTRY</text>
          <text class="page-title">模型与额度</text>
          <text class="header-sub">管理员负责模型接入、连接测试与发布，并设置平台智能体总额度</text>
        </view>
      </view>

      <!-- ==================== 平台额度 ==================== -->
      <view class="section">
        <view class="section-divider">
          <text class="divider-index">01</text>
          <text class="divider-text">平台总额度</text>
        </view>

        <view class="quota-card">
          <view class="quota-metric">
            <text class="metric-value">{{ formatNumber(platform.totalTokenLimit) }}</text>
            <text class="metric-label">平台总额度</text>
          </view>
          <view class="quota-metric">
            <text class="metric-value accent">{{ formatNumber(platform.allocatedTokenLimit) }}</text>
            <text class="metric-label">已分配给教学班</text>
          </view>
          <view class="quota-metric">
            <text class="metric-value success">{{ formatNumber(platform.availableTokenLimit) }}</text>
            <text class="metric-label">剩余可分配</text>
          </view>
          <view class="quota-metric">
            <text class="metric-value warning">{{ formatNumber(platform.tokenUsed) }}</text>
            <text class="metric-label">全平台已消耗</text>
          </view>
          <button class="btn-quota" @click="openQuotaDialog">调整总额度</button>
        </view>
        <text class="quota-note">
          教学班从平台总额度中分配额度，分配后「剩余可分配」同步减少；班内所有智能体共享该班额度。
        </text>
      </view>

      <!-- ==================== 固定智能体模板 ==================== -->
      <view class="section">
        <view class="section-divider">
          <text class="divider-index">02</text>
          <text class="divider-text">内置智能体模板</text>
        </view>
        <text class="quota-note">
          模板由后端固定提供，对应系统中的智能体能力，管理员不可自行新增；教师只能基于模板在各自教学班创建实例。
        </text>
        <view class="template-grid">
          <view v-for="tpl in templates" :key="tpl.code" class="template-card">
            <text class="template-name">{{ tpl.name }}</text>
            <text class="template-code mono">{{ tpl.code }}</text>
            <text class="template-desc">{{ tpl.description }}</text>
          </view>
        </view>
      </view>

      <!-- ==================== 大语言模型 ==================== -->
      <view class="section">
        <view class="section-divider">
          <text class="divider-index">03</text>
          <text class="divider-text">大语言模型 (LLM)</text>
        </view>

        <view class="config-form">
          <view class="form-row">
            <text class="form-label">适用模板</text>
            <picker
              class="form-picker"
              mode="selector"
              :range="templateOptions"
              range-key="label"
              :value="llmTemplateIndex"
              @change="onLlmTemplateChange"
            >
              <text class="picker-text">{{ llmTemplateLabel || '请选择模板' }}</text>
            </picker>
          </view>

          <view class="form-row">
            <text class="form-label">模型名称</text>
            <input class="form-input" v-model="llm.modelName" placeholder="如 qwen-plus" />
          </view>

          <view class="form-row">
            <text class="form-label">URL 地址</text>
            <input
              class="form-input"
              v-model="llm.baseUrl"
              placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1"
            />
          </view>

          <view class="form-row">
            <text class="form-label">API Key</text>
            <input
              class="form-input mono"
              v-model="llm.apiKey"
              :placeholder="llm.id ? '留空保留原密钥' : '请输入 API Key'"
              password
            />
            <text v-if="llm.id && llm.apiKeyConfigured" class="form-hint">当前已配置密钥，留空不会覆盖</text>
          </view>

          <view class="form-row">
            <text class="form-label">温度: {{ Number(llm.temperature || 0).toFixed(1) }}</text>
            <slider
              class="form-slider"
              :value="llm.temperature || 0.3"
              :min="0"
              :max="2"
              :step="0.1"
              @change="onLlmTempChange"
              activeColor="#B4532A"
              backgroundColor="#E0D9CB"
            />
          </view>

          <view class="form-row">
            <text class="form-label">上下文长度</text>
            <input class="form-input" v-model.number="llm.maxTokens" type="number" placeholder="最大 Token 数" />
          </view>

          <view class="form-actions">
            <button v-if="llm.id" class="btn-ghost" @click="resetLlmForm">取消编辑</button>
            <button class="btn-save" :disabled="!canSaveLlm" @click="saveLlmConfig">
              {{ llm.id ? '保存修改' : '新增模型' }}
            </button>
          </view>
        </view>

        <view class="config-list" v-if="llmConfigs.length > 0">
          <view class="config-item" v-for="item in llmConfigs" :key="item.id">
            <view class="config-info">
              <view class="config-title-line">
                <text class="config-agent">{{ templateName(item.agentName) }}</text>
                <text class="status-dot" :class="statusClass(item)">{{ statusText(item) }}</text>
              </view>
              <text class="config-model">{{ item.modelName }}</text>
              <text class="config-url">{{ item.baseUrl }}</text>
              <text v-if="item.testMessage" class="config-message">{{ item.testMessage }}</text>
            </view>
            <view class="config-actions">
              <button class="btn-edit" :disabled="busyId === item.id" @click="runTest(item)">
                {{ busyId === item.id ? '测试中...' : '测试连接' }}
              </button>
              <button
                v-if="item.enabled !== 1"
                class="btn-publish"
                :disabled="item.testStatus !== 'success' || busyId === item.id"
                @click="publish(item)"
              >
                发布
              </button>
              <button v-else class="btn-edit" @click="unpublish(item)">停用</button>
              <button class="btn-edit" @click="editLlmConfig(item)">编辑</button>
              <button class="btn-delete" @click="deleteLlmConfig(item.id)">删除</button>
            </view>
          </view>
        </view>
        <view v-else class="empty-list">
          <text class="empty-text">还没有模型配置，请先新增模型并测试连接</text>
        </view>
      </view>

      <!-- ==================== 文本转向量 ==================== -->
      <view class="section">
        <view class="section-divider">
          <text class="divider-index">04</text>
          <text class="divider-text">文本转向量 (Embedding)</text>
        </view>
        <text class="quota-note">Embedding 用于教材检索，不参与教学班智能体发布。</text>

        <view class="config-form">
          <view class="form-row">
            <text class="form-label">模型名称</text>
            <input class="form-input" v-model="emb.modelName" placeholder="如 BAAI/bge-m3" />
          </view>

          <view class="form-row">
            <text class="form-label">URL 地址</text>
            <input class="form-input" v-model="emb.baseUrl" placeholder="https://api.siliconflow.cn" />
          </view>

          <view class="form-row">
            <text class="form-label">API Key</text>
            <input
              class="form-input mono"
              v-model="emb.apiKey"
              :placeholder="emb.id ? '留空保留原密钥' : '请输入 API Key'"
              password
            />
            <text v-if="emb.id && emb.apiKeyConfigured" class="form-hint">当前已配置密钥，留空不会覆盖</text>
          </view>

          <view class="form-actions">
            <button v-if="emb.id" class="btn-ghost" @click="resetEmbForm">取消编辑</button>
            <button class="btn-save" :disabled="!canSaveEmb" @click="saveEmbConfig">
              {{ emb.id ? '保存修改' : '新增配置' }}
            </button>
          </view>
        </view>

        <view class="config-list" v-if="embConfigs.length > 0">
          <view class="config-item" v-for="item in embConfigs" :key="item.id">
            <view class="config-info">
              <text class="config-model">{{ item.modelName }}</text>
              <text class="config-url">{{ item.baseUrl }}</text>
            </view>
            <view class="config-actions">
              <button class="btn-edit" @click="editEmbConfig(item)">编辑</button>
              <button class="btn-delete" @click="deleteEmbConfig(item.id)">删除</button>
            </view>
          </view>
        </view>
      </view>

      <!-- ==================== 全部智能体实例 ==================== -->
      <view class="section">
        <view class="section-divider">
          <text class="divider-index">05</text>
          <text class="divider-text">全部智能体实例</text>
        </view>
        <text class="quota-note">
          管理员可查看所有教学班已创建的智能体实例，包括所属教学班（含草稿/待审核状态）、教师、模板、模型与用量。
        </text>

        <view class="config-list" v-if="allInstances.length > 0">
          <view class="config-item" v-for="item in allInstances" :key="item.id">
            <view class="config-info">
              <view class="config-title-line">
                <text class="config-agent">{{ item.className }}</text>
                <text class="status-dot" :class="item.status === 'active' ? 'published' : 'untested'">
                  {{ item.status === 'active' ? '启用' : '停用' }}
                </text>
                <text class="status-dot" :class="classStatusClass(item.classStatus)">
                  {{ classStatusText(item.classStatus) }}
                </text>
              </view>
              <text class="config-model">{{ templateName(item.agentType) }} · {{ item.modelName }}</text>
              <text class="config-url">
                教师：{{ item.teacherName || '—' }} · 已用 {{ formatNumber(item.tokenUsed) }} token
              </text>
            </view>
            <view class="config-actions">
              <button class="btn-delete" @click="removeInstance(item)">删除</button>
            </view>
          </view>
        </view>
        <view v-else class="empty-list">
          <text class="empty-text">还没有教师创建智能体实例</text>
        </view>
      </view>

      <!-- 平台额度弹窗 -->
      <view v-if="showQuotaDialog" class="dialog-mask" @click="showQuotaDialog = false">
        <view class="dialog" @click.stop>
          <view class="dialog-head">
            <text class="dialog-title">调整平台总额度</text>
            <text class="dialog-close" @click="showQuotaDialog = false">×</text>
          </view>
          <view class="dialog-body">
            <view class="form-row">
              <text class="form-label">总额度（token）</text>
              <input class="form-input" v-model="quotaInput" type="number" placeholder="请输入平台总额度" />
            </view>
            <text class="form-hint">
              不能低于已分配额度（{{ formatNumber(platform.allocatedTokenLimit) }} token）。调整后教师可分配的余额同步变化。
            </text>
          </view>
          <view class="dialog-foot">
            <button class="btn-ghost" @click="showQuotaDialog = false">取消</button>
            <button class="btn-save" :disabled="savingQuota" @click="saveQuota">
              {{ savingQuota ? '保存中...' : '保存' }}
            </button>
          </view>
        </view>
      </view>
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import {
  getModelConfigs,
  saveModelConfig,
  deleteModelConfig,
  testModelConfig,
  publishModelConfig,
  unpublishModelConfig,
  type ModelConfigItem
} from '@/api/config'
import {
  listAgentTemplates,
  listAllAgentInstances,
  deleteAgent,
  getPlatformQuota,
  updatePlatformQuota,
  type AgentTemplate,
  type AllAgentInstance,
  type PlatformQuotaStats
} from '@/api/agent-config'

interface PickerChangeEvent {
  detail: { value: number }
}

interface SliderChangeEvent {
  detail: { value: number }
}

// ==================== 模板 ====================
const templates = ref<AgentTemplate[]>([])
const templateOptions = computed(() => templates.value.map((t) => ({ value: t.code, label: t.name })))

function templateName(code?: string): string {
  return templates.value.find((t) => t.code === code)?.name || code || '未命名模板'
}

// ==================== 平台额度 ====================
const platform = ref<PlatformQuotaStats>({
  totalTokenLimit: 0,
  allocatedTokenLimit: 0,
  availableTokenLimit: 0,
  tokenUsed: 0,
  classCount: 0,
  classes: []
})
const showQuotaDialog = ref(false)
const quotaInput = ref('')
const savingQuota = ref(false)

function formatNumber(value?: number): string {
  const num = value || 0
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return String(num)
}

async function loadPlatform() {
  try {
    platform.value = await getPlatformQuota()
  } catch {
    // 保持默认值
  }
}

function openQuotaDialog() {
  quotaInput.value = String(platform.value.totalTokenLimit || '')
  showQuotaDialog.value = true
}

async function saveQuota() {
  const total = Number(quotaInput.value)
  if (!Number.isFinite(total) || total < 0) {
    uni.showToast({ title: '请输入有效的总额度', icon: 'none' })
    return
  }
  savingQuota.value = true
  try {
    platform.value = await updatePlatformQuota(Math.floor(total))
    showQuotaDialog.value = false
    uni.showToast({ title: '已更新', icon: 'success' })
  } catch (e: unknown) {
    uni.showToast({ title: e instanceof Error ? e.message : '保存失败', icon: 'none' })
  } finally {
    savingQuota.value = false
  }
}

// ==================== LLM 状态 ====================
const llmConfigs = ref<ModelConfigItem[]>([])
const llm = reactive<ModelConfigItem>(createEmptyLlm())
const busyId = ref<number | null>(null)

const llmTemplateIndex = computed(() => {
  const idx = templates.value.findIndex((t) => t.code === llm.agentName)
  return idx >= 0 ? idx : 0
})
const llmTemplateLabel = computed(() => templateName(llm.agentName))

const canSaveLlm = computed(() => {
  return !!llm.agentName && !!llm.modelName?.trim() && !!llm.baseUrl?.trim()
})

function createEmptyLlm(): ModelConfigItem {
  return {
    id: null,
    configType: 'LLM',
    agentName: 'chat',
    modelName: 'qwen-plus',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: '',
    temperature: 0.3,
    maxTokens: 4096
  }
}

function resetLlmForm() {
  Object.assign(llm, createEmptyLlm(), { agentName: templates.value[0]?.code || 'chat' })
}

async function loadLlmData() {
  try {
    llmConfigs.value = await getModelConfigs('LLM')
  } catch {
    llmConfigs.value = []
  }
}

function onLlmTemplateChange(e: PickerChangeEvent) {
  const idx = e.detail.value
  if (idx < 0 || idx >= templates.value.length) return
  llm.agentName = templates.value[idx].code
}

function onLlmTempChange(e: SliderChangeEvent) {
  llm.temperature = e.detail.value
}

async function saveLlmConfig() {
  if (!canSaveLlm.value) return
  try {
    await saveModelConfig({ ...llm })
    uni.showToast({ title: '保存成功，请测试后发布', icon: 'success' })
    resetLlmForm()
    await loadLlmData()
  } catch (e: unknown) {
    uni.showToast({ title: e instanceof Error ? e.message : '保存失败', icon: 'none' })
  }
}

function editLlmConfig(item: ModelConfigItem) {
  Object.assign(llm, {
    ...createEmptyLlm(),
    ...item,
    apiKey: ''
  })
}

async function runTest(item: ModelConfigItem) {
  if (!item.id) return
  busyId.value = item.id
  try {
    const result = await testModelConfig(item.id)
    uni.showModal({
      title: '测试通过',
      content: `耗时 ${result.latencyMs} ms\n${result.reply || '模型已响应'}\n可点击「发布」供教师选用`,
      showCancel: false
    })
  } catch (e: unknown) {
    uni.showModal({
      title: '测试失败',
      content: e instanceof Error ? e.message : '请检查地址、密钥与模型名称',
      showCancel: false
    })
  } finally {
    busyId.value = null
    await loadLlmData()
  }
}

async function publish(item: ModelConfigItem) {
  if (!item.id) return
  busyId.value = item.id
  try {
    await publishModelConfig(item.id)
    uni.showToast({ title: '已发布', icon: 'success' })
    await loadLlmData()
  } catch (e: unknown) {
    uni.showToast({ title: e instanceof Error ? e.message : '发布失败', icon: 'none' })
  } finally {
    busyId.value = null
  }
}

async function unpublish(item: ModelConfigItem) {
  if (!item.id) return
  try {
    await unpublishModelConfig(item.id)
    uni.showToast({ title: '已停用', icon: 'success' })
    await loadLlmData()
  } catch (e: unknown) {
    uni.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })
  }
}

function statusText(item: ModelConfigItem): string {
  if (item.enabled === 1) return '已发布'
  if (item.testStatus === 'success') return '测试通过·待发布'
  if (item.testStatus === 'fail') return '测试失败'
  return '未测试'
}

function statusClass(item: ModelConfigItem): string {
  if (item.enabled === 1) return 'published'
  if (item.testStatus === 'success') return 'ready'
  if (item.testStatus === 'fail') return 'fail'
  return 'untested'
}

async function deleteLlmConfig(id: number | null) {
  if (!id) return
  uni.showModal({
    title: '删除模型',
    content: '删除后教师将无法再选择该模型，确定删除吗？',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await deleteModelConfig(id)
        uni.showToast({ title: '删除成功', icon: 'success' })
        await loadLlmData()
      } catch (e: unknown) {
        uni.showToast({ title: e instanceof Error ? e.message : '删除失败', icon: 'none' })
      }
    }
  })
}

// ==================== Embedding 状态 ====================
const embConfigs = ref<ModelConfigItem[]>([])
const emb = reactive<ModelConfigItem>(createEmptyEmb())

const canSaveEmb = computed(() => {
  return !!emb.modelName?.trim() && !!emb.baseUrl?.trim()
})

function createEmptyEmb(): ModelConfigItem {
  return {
    id: null,
    configType: 'EMBEDDING',
    agentName: 'default',
    modelName: 'BAAI/bge-m3',
    baseUrl: 'https://api.siliconflow.cn',
    apiKey: '',
    temperature: 0,
    maxTokens: 0
  }
}

function resetEmbForm() {
  Object.assign(emb, createEmptyEmb())
}

async function loadEmbData() {
  try {
    embConfigs.value = await getModelConfigs('EMBEDDING')
  } catch {
    embConfigs.value = []
  }
}

async function saveEmbConfig() {
  if (!canSaveEmb.value) return
  try {
    await saveModelConfig({ ...emb })
    uni.showToast({ title: '保存成功', icon: 'success' })
    resetEmbForm()
    await loadEmbData()
  } catch (e: unknown) {
    uni.showToast({ title: e instanceof Error ? e.message : '保存失败', icon: 'none' })
  }
}

function editEmbConfig(item: ModelConfigItem) {
  Object.assign(emb, {
    ...createEmptyEmb(),
    ...item,
    apiKey: ''
  })
}

async function deleteEmbConfig(id: number | null) {
  if (!id) return
  try {
    await deleteModelConfig(id)
    uni.showToast({ title: '删除成功', icon: 'success' })
    await loadEmbData()
  } catch (e: unknown) {
    uni.showToast({ title: e instanceof Error ? e.message : '删除失败', icon: 'none' })
  }
}

// ==================== 全部智能体实例 ====================
const allInstances = ref<AllAgentInstance[]>([])

async function loadInstances() {
  try {
    allInstances.value = await listAllAgentInstances()
  } catch {
    allInstances.value = []
  }
}

function classStatusText(status?: string): string {
  if (status === 'approved') return '已通过'
  if (status === 'pending') return '待审核'
  if (status === 'draft') return '草稿'
  return status || '未知'
}

function classStatusClass(status?: string): string {
  if (status === 'approved') return 'published'
  if (status === 'pending') return 'ready'
  return 'untested'
}

function removeInstance(item: AllAgentInstance) {
  uni.showModal({
    title: '删除实例',
    content: `确定删除「${item.className}」的${templateName(item.agentType)}实例吗？`,
    success: async (res) => {
      if (!res.confirm) return
      try {
        await deleteAgent(item.id)
        uni.showToast({ title: '删除成功', icon: 'success' })
        await loadInstances()
      } catch (e: unknown) {
        uni.showToast({ title: e instanceof Error ? e.message : '删除失败', icon: 'none' })
      }
    }
  })
}

onMounted(async () => {
  try {
    templates.value = await listAgentTemplates()
  } catch {
    templates.value = []
  }
  if (!llm.agentName && templates.value.length) {
    llm.agentName = templates.value[0].code
  }
  await Promise.all([loadPlatform(), loadLlmData(), loadEmbData(), loadInstances()])
})
</script>

<style scoped>
/* =========================================================
   模型与额度 · 教育档案室
   ========================================================= */
.page-container {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.page-title {
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

/* ========== 分区 ========== */
.section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line);
}

.divider-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 4px;
  opacity: 0.85;
}

.divider-text {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--ink);
  white-space: nowrap;
}

/* ========== 平台额度 ========== */
.quota-card {
  display: grid;
  grid-template-columns: repeat(4, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
}

.quota-metric {
  display: flex;
  flex-direction: column-reverse;
  gap: 7px;
  padding-right: 16px;
  border-right: 1px solid var(--line);
}

.metric-value {
  font-family: var(--font-display);
  font-size: 24px;
  line-height: 1;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.metric-value.accent { color: var(--accent); }
.metric-value.success { color: var(--success); }
.metric-value.warning { color: var(--warning); }

.metric-label {
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.btn-quota {
  margin: 0;
  height: 36px;
  line-height: 34px;
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

.quota-note {
  font-size: 11px;
  line-height: 1.7;
  color: var(--muted);
}

/* ========== 模板 ========== */
.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.template-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  background: var(--surface-raised);
  border: 1px solid var(--line);
  border-radius: 12px;
}

.template-name {
  font-family: var(--font-display);
  font-size: 15px;
  color: var(--ink);
}

.template-code {
  font-size: 10.5px;
  letter-spacing: 0.06em;
  color: var(--accent);
}

.template-desc {
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
}

.mono {
  font-family: var(--font-mono);
}

/* ========== 配置表单 ========== */
.config-form {
  padding: 20px 24px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
}

.form-row {
  display: grid;
  grid-template-columns: 108px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px dashed var(--line);
}

.form-row:last-of-type { border-bottom: none; }

.form-label {
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--muted);
  flex-shrink: 0;
}

.form-input {
  width: 100%;
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

.form-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(180, 83, 42, 0.10);
}

.mono { font-family: var(--font-mono); }

.form-hint {
  grid-column: 2 / span 2;
  font-size: 10.5px;
  line-height: 1.6;
  color: var(--muted);
}

.form-picker {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface-raised);
  border: 1px solid var(--line);
  border-radius: 10px;
  box-sizing: border-box;
  transition: border-color 0.18s ease;
}

.form-picker:hover { border-color: var(--line-strong); }

.form-picker::after {
  content: '▾';
  margin-left: auto;
  font-size: 11px;
  color: var(--muted);
}

.picker-text {
  font-size: 13px;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.form-slider {
  width: 100%;
  margin: 0 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

.btn-save {
  height: 38px;
  line-height: 36px;
  padding: 0 26px;
  font-size: 12.5px;
  letter-spacing: 0.04em;
  color: #F8F3E8;
  background: var(--ink);
  border: 1px solid var(--ink);
  border-radius: 10px;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.18s ease;
}

.btn-save:hover:not([disabled]) { background: #24334F; }

.btn-save[disabled] {
  background: var(--paper-deep);
  color: var(--muted);
  border-color: var(--line);
  cursor: not-allowed;
}

.btn-ghost {
  height: 38px;
  line-height: 36px;
  padding: 0 18px;
  font-size: 12px;
  color: var(--ink-2);
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 10px;
  cursor: pointer;
}

.btn-ghost:hover { border-color: var(--accent); color: var(--accent); }

/* ========== 配置列表 ========== */
.config-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  background: var(--surface-raised);
  border: 1px solid var(--line);
  border-radius: 12px;
  transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}

.config-item:hover {
  border-color: var(--line-strong);
  transform: translateY(-1px);
  box-shadow: var(--shadow-soft);
}

.config-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  flex: 1;
  min-width: 0;
}

.config-title-line {
  display: flex;
  align-items: center;
  gap: 10px;
}

.config-agent {
  font-family: var(--font-display);
  font-size: 15px;
  letter-spacing: 0.02em;
  color: var(--ink);
}

.status-dot {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10.5px;
  letter-spacing: 0.03em;
}

.status-dot.untested { color: var(--muted); background: var(--paper-deep); }
.status-dot.ready { color: var(--warning); background: rgba(154, 106, 24, 0.12); }
.status-dot.fail { color: var(--danger); background: rgba(163, 59, 46, 0.10); }
.status-dot.published { color: var(--success); background: rgba(63, 107, 82, 0.12); }

.config-model {
  max-width: 100%;
  padding: 2px 9px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.02em;
  color: var(--accent-ink);
  background: var(--accent-soft);
  border-radius: 999px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.config-url,
.config-message {
  max-width: 100%;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.02em;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.config-message { color: var(--ink-2); }

.config-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex-shrink: 0;
  justify-content: flex-end;
}

.btn-edit,
.btn-delete,
.btn-publish {
  height: 30px;
  line-height: 28px;
  padding: 0 12px;
  font-size: 11.5px;
  letter-spacing: 0.06em;
  border-radius: 8px;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.18s ease;
}

.btn-edit {
  color: var(--ink-2);
  background: transparent;
  border: 1px solid var(--line);
}

.btn-edit:hover {
  color: var(--accent-ink);
  border-color: var(--accent);
  background: var(--accent-soft);
}

.btn-publish {
  color: #F8F3E8;
  background: var(--ink);
  border: 1px solid var(--ink);
}

.btn-publish[disabled] {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-delete {
  color: var(--danger);
  background: #F5E4E0;
  border: 1px solid rgba(163, 59, 46, 0.2);
}

.btn-delete:hover {
  background: rgba(163, 59, 46, 0.16);
  border-color: var(--danger);
}

.empty-list {
  padding: 34px 20px;
  text-align: center;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius);
}

.empty-text {
  font-size: 12px;
  color: var(--muted);
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
  width: 100%;
  max-width: 440px;
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
}

.dialog-title {
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--ink);
}

.dialog-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  color: var(--muted);
  cursor: pointer;
  border-radius: 8px;
}

.dialog-close:hover { color: var(--ink); background: var(--paper-deep); }

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 24px;
}

.dialog-body .form-row {
  grid-template-columns: 108px minmax(0, 1fr);
  border-bottom: none;
  padding: 0;
}

.dialog-body .form-hint { grid-column: 1 / -1; }

.dialog-foot {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 14px 24px 20px;
  border-top: 1px solid var(--line);
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .page-container { gap: 16px; }
  .page-header { padding-bottom: 14px; }
  .page-title { font-size: 20px; }
  .divider-text { font-size: 15px; }
  .quota-card {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    padding: 18px 16px;
  }
  .quota-metric:nth-child(2n) { border-right: none; }
  .btn-quota { grid-column: span 2; width: 100%; }
  .config-form { padding: 16px 16px; }
  .form-row {
    grid-template-columns: 1fr;
    gap: 6px;
    padding: 9px 0;
  }
  .form-hint { grid-column: 1 / -1; }
  .form-actions { justify-content: stretch; }
  .btn-save, .btn-ghost { flex: 1; }
  .config-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 14px;
  }
  .config-actions { justify-content: flex-end; }
  .btn-edit,
  .btn-delete,
  .btn-publish { flex: 1; }
}
</style>
