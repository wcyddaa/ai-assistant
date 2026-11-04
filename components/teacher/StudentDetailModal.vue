<!-- components/teacher/StudentDetailModal.vue - 学生详情（学习情况 + 教学班能力图谱） -->
<template>
  <view v-if="visible" class="detail-overlay" @click="handleClose">
    <view class="detail-dialog" @click.stop>
      <view class="dialog-header">
        <view class="header-main">
          <view class="student-seal">{{ studentInitial }}</view>
          <view class="header-text">
            <view class="name-line">
              <text class="student-name">{{ student?.studentName || '学生' }}</text>
              <text class="class-tag">{{ className || '教学班' }}</text>
            </view>
            <text class="student-meta">
              学号 {{ student?.studentAccount || '未绑定' }} · 学生 ID {{ student?.studentId }}
            </text>
          </view>
        </view>
        <view class="header-actions">
          <text class="refresh-btn" :class="{ busy: loading || evaluating }" @click="reload(true)">
            {{ evaluating ? '智能体评估中…' : loading ? '加载中…' : '刷新画像' }}
          </text>
          <text class="close-btn" @click="handleClose">✕</text>
        </view>
      </view>

      <view class="dialog-body">
        <view v-if="errorMessage" class="state-box error">
          <text class="state-title">画像加载失败</text>
          <text class="state-text">{{ errorMessage }}</text>
          <text class="state-link" @click="reload(false)">重新加载</text>
        </view>

        <view v-else-if="loading" class="state-box">
          <text class="state-title">正在读取学习数据</text>
          <text class="state-text">作业记录、提问记录与智能体评分正在汇总…</text>
        </view>

        <template v-else-if="profile">
          <!-- 概览指标 -->
          <view class="stat-strip">
            <view class="stat-cell">
              <text class="stat-label">综合能力</text>
              <text class="stat-value accent">{{ overallDisplay }}</text>
              <text class="stat-note">{{ sourceLabel }}</text>
            </view>
            <view class="stat-cell">
              <text class="stat-label">作业均分</text>
              <text class="stat-value">{{ homeworkAvgDisplay }}</text>
              <text class="stat-note">{{ profile.homework.count }} 份作业</text>
            </view>
            <view class="stat-cell">
              <text class="stat-label">提问互动</text>
              <text class="stat-value">{{ profile.questions.count }}</text>
              <text class="stat-note">条教学班提问</text>
            </view>
            <view class="stat-cell">
              <text class="stat-label">最近评估</text>
              <text class="stat-value small">{{ evaluatedAtDisplay }}</text>
              <text class="stat-note">维度 {{ profile.dimensions.length }} 个</text>
            </view>
          </view>

          <!-- 无维度：教师先配置 -->
          <view v-if="profile.dimensions.length === 0" class="empty-dimension">
            <view class="empty-texts">
              <text class="empty-title">该教学班还没有能力维度</text>
              <text class="empty-desc">
                能力图谱按教学班独立配置。生成推荐维度后，智能体会依据本班作业与提问自动评分。
              </text>
            </view>
            <text class="primary-btn" @click="useRecommendedDimensions">生成推荐维度</text>
          </view>

          <!-- 能力雷达 -->
          <view v-else class="ability-grid">
            <view class="radar-panel">
              <view class="panel-head">
                <text class="panel-kicker">ABILITY RADAR</text>
                <text class="panel-title">本教学班能力图谱</text>
              </view>
              <AbilityRadar :dimensions="profile.dimensions" :size="296" />
              <text class="radar-foot">
                评分依据：{{ profile.report?.homeworkCount ?? profile.homework.count }} 份作业、
                {{ profile.report?.questionCount ?? profile.questions.count }} 条提问
              </text>
            </view>

            <view class="dimension-panel">
              <view class="panel-head">
                <text class="panel-kicker">DIMENSIONS</text>
                <text class="panel-title">维度得分与评语</text>
              </view>
              <view class="dimension-list">
                <view v-for="dim in profile.dimensions" :key="dim.dimensionId" class="dimension-row">
                  <view class="dimension-top">
                    <view class="dimension-name-wrap">
                      <text class="dimension-name">{{ dim.dimensionName }}</text>
                      <text class="dimension-weight">权重 {{ formatWeight(dim.weight) }}</text>
                    </view>
                    <text class="dimension-score" :class="scoreClass(dim.score)">
                      {{ formatScore(dim.score) }}
                    </text>
                  </view>
                  <view class="score-track">
                    <view class="score-fill" :class="scoreClass(dim.score)"
                          :style="{ width: Math.max(2, Math.min(100, Number(dim.score) || 0)) + '%' }"></view>
                  </view>
                  <text v-if="dim.comment" class="dimension-comment">{{ dim.comment }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 智能体综合评语 -->
          <view v-if="profile.dimensions.length > 0" class="summary-panel">
            <view class="panel-head">
              <text class="panel-kicker">AGENT REVIEW</text>
              <text class="panel-title">智能体学情评语</text>
            </view>
            <text class="summary-text">
              {{ profile.report?.summary || '暂无评语，点击“重新评估”让智能体依据最新作业与提问生成。' }}
            </text>
            <view class="summary-tags">
              <text v-for="topic in profile.questions.topTopics.slice(0, 4)" :key="topic.topic" class="summary-tag">
                {{ topic.topic }} · {{ topic.count }}
              </text>
              <text v-if="profile.questions.topTopics.length === 0" class="summary-tag muted">暂无提问主题</text>
            </view>
          </view>

          <!-- 作业与提问明细 -->
          <view class="record-grid">
            <view class="record-panel">
              <view class="panel-head">
                <text class="panel-kicker">HOMEWORK</text>
                <text class="panel-title">作业记录</text>
              </view>
              <view v-if="profile.homework.items.length === 0" class="record-empty">暂无作业提交记录</view>
              <view v-for="(hw, index) in profile.homework.items.slice(0, 6)" :key="index" class="record-row">
                <view class="record-main">
                  <text class="record-title">{{ hw.title }}</text>
                  <text class="record-sub">{{ statusLabel(hw.status) }}<text v-if="hw.comment"> · {{ hw.comment }}</text></text>
                </view>
                <text class="record-score">{{ hw.score != null ? formatScore(hw.score) : '—' }}</text>
              </view>
            </view>

            <view class="record-panel">
              <view class="panel-head">
                <text class="panel-kicker">INQUIRY</text>
                <text class="panel-title">提问主题分布</text>
              </view>
              <view v-if="profile.questions.topTopics.length === 0" class="record-empty">暂无提问记录</view>
              <view v-for="topic in profile.questions.topTopics.slice(0, 6)" :key="topic.topic" class="topic-row">
                <text class="topic-name">{{ topic.topic }}</text>
                <view class="topic-track">
                  <view class="topic-fill" :style="{ width: topicWidth(topic.count) }"></view>
                </view>
                <text class="topic-count">{{ topic.count }}</text>
              </view>
            </view>
          </view>

          <!-- 教师维度设置 -->
          <view class="setting-panel">
            <view class="setting-head" @click="showSettings = !showSettings">
              <view class="setting-title-wrap">
                <text class="panel-kicker">CLASS SETTING</text>
                <text class="panel-title">本教学班能力维度设置</text>
              </view>
              <text class="setting-toggle">{{ showSettings ? '收起' : '展开设置' }}</text>
            </view>

            <view v-if="showSettings" class="setting-body">
              <text class="setting-hint">
                维度与权重只影响当前教学班。同一学生在其他教学班的图谱互不影响。
              </text>

              <view v-for="dim in editableDimensions" :key="dim.dimensionId" class="setting-row">
                <view class="setting-info">
                  <text class="setting-name">{{ dim.dimensionName }}</text>
                  <text class="setting-desc">{{ dim.description || '未填写维度说明' }}</text>
                  <text class="setting-weight">权重 {{ formatWeight(dim.weight) }} · 当前得分 {{ formatScore(dim.score) }}</text>
                </view>
                <view class="setting-ops">
                  <text class="op-link" @click="startEdit(dim)">编辑</text>
                  <text class="op-link danger" @click="removeDimension(dim.dimensionId)">删除</text>
                </view>
              </view>

              <view v-if="editableDimensions.length === 0" class="setting-empty">
                尚未设置维度，点击下方“生成推荐维度”快速开始。
              </view>

              <view class="dimension-form">
                <input v-model="form.name" class="form-input" placeholder="维度名称，如：概念理解" maxlength="20" />
                <input v-model="form.description" class="form-input wide" placeholder="维度说明（可选）" maxlength="60" />
                <input v-model="form.weight" class="form-input narrow" type="number" placeholder="权重" />
                <text class="primary-btn compact" @click="saveDimension">
                  {{ editingId ? '保存修改' : '新增维度' }}
                </text>
                <text v-if="editingId" class="ghost-btn" @click="resetForm">取消</text>
              </view>
            </view>
          </view>
        </template>
      </view>

      <view class="dialog-footer">
        <text class="footer-note">能力评分由智能体基于本教学班作业与提问生成</text>
        <view class="footer-actions">
          <text class="ghost-btn" @click="handleClose">关闭</text>
          <text class="primary-btn" :class="{ disabled: evaluating || !profile || profile.dimensions.length === 0 }"
                @click="evaluate">
            {{ evaluating ? '评估中…' : '重新评估' }}
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import AbilityRadar from '@/components/teacher/AbilityRadar.vue'
import {
  createAbilityDimension,
  deleteAbilityDimension,
  evaluateAbility,
  getAbilityProfile,
  RECOMMENDED_DIMENSIONS,
  updateAbilityDimension,
  type AbilityProfile,
  type DimensionScore
} from '@/api/ability'

interface StudentLite {
  studentId: number
  studentName: string
  studentAccount?: string
}

const props = withDefaults(defineProps<{
  visible: boolean
  classId: number
  className: string
  student: StudentLite | null
  teacherId?: number
}>(), {
  teacherId: 0
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const profile = ref<AbilityProfile | null>(null)
const loading = ref(false)
const evaluating = ref(false)
const errorMessage = ref('')
const showSettings = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({ name: '', description: '', weight: '1' })

const studentInitial = computed(() => {
  const name = props.student?.studentName || '学'
  return String(name).charAt(0)
})

const editableDimensions = computed<DimensionScore[]>(() => profile.value?.dimensions ?? [])

const overallDisplay = computed(() => {
  const score = profile.value?.report?.overallScore
  if (score == null || Number(score) <= 0) return '—'
  return formatScore(score)
})

const homeworkAvgDisplay = computed(() => {
  const score = profile.value?.homework?.avgScore ?? profile.value?.report?.homeworkAvgScore
  return score == null ? '—' : formatScore(score)
})

const sourceLabel = computed(() => {
  const source = profile.value?.report?.source
  if (source === 'agent') return '智能体评分'
  if (source === 'rule') return '规则兜底评分'
  return '尚未评估'
})

const evaluatedAtDisplay = computed(() => {
  const time = profile.value?.report?.evaluatedAt
  if (!time) return '—'
  return String(time).replace('T', ' ').slice(5, 16)
})

function formatScore(value: number | string | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '—'
  const num = Number(value)
  return Number.isInteger(num) ? String(num) : num.toFixed(1)
}

function formatWeight(value: number | string | null | undefined): string {
  return value == null ? '1' : String(Number(value)).replace(/\.0$/, '')
}

function scoreClass(score: number | string): string {
  const value = Number(score) || 0
  if (value >= 85) return 'excellent'
  if (value >= 70) return 'good'
  if (value >= 55) return 'fair'
  return 'weak'
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    submitted: '已提交',
    graded: '已批改',
    draft: '草稿',
    returned: '已退回',
    pending: '待提交'
  }
  return map[status] || (status || '未知状态')
}

function topicWidth(count: number): string {
  const max = Math.max(...(profile.value?.questions.topTopics ?? []).map((t) => t.count), 1)
  return Math.round((count / max) * 100) + '%'
}

async function loadProfile(autoEvaluate: boolean) {
  if (!props.student || !props.classId) return
  loading.value = true
  errorMessage.value = ''
  try {
    profile.value = await getAbilityProfile(props.student.studentId, props.classId, autoEvaluate)
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : '请确认学习服务已启动'
    profile.value = null
  } finally {
    loading.value = false
  }
}

async function reload(autoEvaluate: boolean) {
  if (evaluating.value) return
  await loadProfile(autoEvaluate)
}

async function evaluate() {
  if (!props.student || !props.classId || evaluating.value) return
  if ((profile.value?.dimensions.length ?? 0) === 0) {
    uni.showToast({ title: '请先设置能力维度', icon: 'none' })
    return
  }
  evaluating.value = true
  try {
    profile.value = await evaluateAbility(props.student.studentId, props.classId, props.student.studentName)
    uni.showToast({ title: '智能体评估完成', icon: 'none' })
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '评估失败', icon: 'none' })
  } finally {
    evaluating.value = false
  }
}

async function useRecommendedDimensions() {
  if (!props.classId) return
  try {
    uni.showLoading({ title: '生成维度…' })
    for (let i = 0; i < RECOMMENDED_DIMENSIONS.length; i++) {
      const item = RECOMMENDED_DIMENSIONS[i]
      await createAbilityDimension({
        classId: props.classId,
        dimensionName: item.name,
        dimensionCode: item.code,
        weight: item.weight,
        description: item.description,
        sortOrder: i,
        teacherId: props.teacherId
      })
    }
    uni.hideLoading()
    await evaluate()
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: e instanceof Error ? e.message : '生成失败', icon: 'none' })
  }
}

function startEdit(dim: DimensionScore) {
  editingId.value = dim.dimensionId
  form.name = dim.dimensionName
  form.description = dim.description || ''
  form.weight = formatWeight(dim.weight)
  showSettings.value = true
}

function resetForm() {
  editingId.value = null
  form.name = ''
  form.description = ''
  form.weight = '1'
}

async function saveDimension() {
  const name = form.name.trim()
  if (!name) {
    uni.showToast({ title: '请填写维度名称', icon: 'none' })
    return
  }
  const weight = Number(form.weight) || 1
  try {
    const payload = {
      classId: props.classId,
      dimensionName: name,
      weight,
      description: form.description.trim(),
      teacherId: props.teacherId
    }
    if (editingId.value) {
      await updateAbilityDimension(editingId.value, { ...payload, id: editingId.value })
    } else {
      await createAbilityDimension(payload)
    }
    resetForm()
    uni.showToast({ title: '维度已保存', icon: 'none' })
    await loadProfile(false)
    showSettings.value = true
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '保存失败', icon: 'none' })
  }
}

async function removeDimension(id: number) {
  try {
    await deleteAbilityDimension(id)
    uni.showToast({ title: '已删除', icon: 'none' })
    await loadProfile(false)
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '删除失败', icon: 'none' })
  }
}

function handleClose() {
  emit('close')
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      showSettings.value = false
      resetForm()
      loadProfile(true)
    } else {
      profile.value = null
      errorMessage.value = ''
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.detail-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(23, 35, 59, 0.44);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: overlayIn 0.18s ease both;
}

@keyframes overlayIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.detail-dialog {
  width: min(980px, 96vw);
  max-height: 90vh;
  background: var(--surface);
  border: 1px solid var(--line-strong);
  border-radius: 20px;
  box-shadow: 0 40px 90px -36px rgba(23, 35, 59, 0.55);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: dialogIn 0.22s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

@keyframes dialogIn {
  from { opacity: 0; transform: translateY(14px) scale(0.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 24px;
  border-bottom: 1px solid var(--line);
  background: linear-gradient(180deg, #FFFDF8, #FBF7EF);
}

.header-main {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.student-seal {
  width: 46px;
  height: 46px;
  border-radius: 10px;
  background: var(--ink);
  color: #F7F2E7;
  font-family: var(--font-display);
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.name-line {
  display: flex;
  align-items: center;
  gap: 10px;
}

.student-name {
  font-family: var(--font-display);
  font-size: 22px;
  color: var(--ink);
  letter-spacing: 0.02em;
}

.class-tag {
  font-size: 11px;
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: 999px;
  padding: 2px 9px;
  white-space: nowrap;
}

.student-meta {
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 0.04em;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.refresh-btn {
  font-size: 12px;
  color: var(--ink-2);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 6px 13px;
  cursor: pointer;
  transition: all 0.16s ease;
  white-space: nowrap;
}

.refresh-btn:hover {
  border-color: var(--line-strong);
  background: #F7F1E6;
}

.refresh-btn.busy {
  opacity: 0.6;
  pointer-events: none;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  color: var(--muted);
  cursor: pointer;
}

.close-btn:hover {
  background: var(--accent-soft);
  color: var(--accent);
}

.dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.state-box {
  padding: 42px 24px;
  border: 1px dashed var(--line-strong);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: #FBF8F1;
}

.state-box.error {
  border-color: #E4C4BC;
  background: #FBF1EE;
}

.state-title {
  font-family: var(--font-display);
  font-size: 17px;
  color: var(--ink);
}

.state-text {
  font-size: 12px;
  color: var(--muted);
  text-align: center;
}

.state-link {
  font-size: 12px;
  color: var(--accent);
  cursor: pointer;
  margin-top: 4px;
}

.stat-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border: 1px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
  background: #FBF8F1;
}

.stat-cell {
  padding: 14px 18px;
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.stat-cell:last-child {
  border-right: none;
}

.stat-label {
  font-size: 10px;
  letter-spacing: 0.16em;
  color: var(--muted);
}

.stat-value {
  font-family: var(--font-display);
  font-size: 26px;
  color: var(--ink);
  line-height: 1.2;
}

.stat-value.accent {
  color: var(--accent);
}

.stat-value.small {
  font-size: 16px;
  line-height: 1.5;
}

.stat-note {
  font-size: 10px;
  color: var(--muted);
}

.empty-dimension {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px;
  border: 1px dashed var(--line-strong);
  border-radius: 14px;
  background: #FBF6EC;
}

.empty-texts {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.empty-title {
  font-family: var(--font-display);
  font-size: 17px;
  color: var(--ink);
}

.empty-desc {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.6;
}

.ability-grid {
  display: grid;
  grid-template-columns: minmax(0, 340px) minmax(0, 1fr);
  gap: 20px;
  align-items: stretch;
}

.radar-panel,
.dimension-panel,
.summary-panel,
.record-panel,
.setting-panel {
  border: 1px solid var(--line);
  border-radius: 16px;
  background: #FFFEFA;
  padding: 18px;
}

.radar-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.panel-head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-self: stretch;
}

.panel-kicker {
  font-size: 9px;
  letter-spacing: 0.22em;
  color: var(--accent);
}

.panel-title {
  font-family: var(--font-display);
  font-size: 16px;
  color: var(--ink);
  letter-spacing: 0.02em;
}

.radar-foot {
  font-size: 10px;
  color: var(--muted);
  text-align: center;
}

.dimension-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dimension-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dimension-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.dimension-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.dimension-name-wrap {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.dimension-name {
  font-size: 13px;
  color: var(--ink);
  font-weight: 600;
}

.dimension-weight {
  font-size: 9px;
  color: var(--muted);
  letter-spacing: 0.06em;
}

.dimension-score {
  font-family: var(--font-display);
  font-size: 18px;
  line-height: 1;
}

.dimension-score.excellent { color: var(--success); }
.dimension-score.good { color: var(--accent); }
.dimension-score.fair { color: var(--warning); }
.dimension-score.weak { color: var(--danger); }

.score-track {
  height: 4px;
  border-radius: 3px;
  background: #EDE6D9;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}

.score-fill.excellent { background: var(--success); }
.score-fill.good { background: var(--accent); }
.score-fill.fair { background: var(--warning); }
.score-fill.weak { background: var(--danger); }

.dimension-comment {
  font-size: 11px;
  color: var(--muted);
  line-height: 1.5;
}

.summary-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-text {
  font-size: 13px;
  color: var(--ink-2);
  line-height: 1.75;
}

.summary-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.summary-tag {
  font-size: 10px;
  color: var(--ink-2);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 3px 9px;
  background: #FBF8F1;
}

.summary-tag.muted {
  color: var(--muted);
}

.record-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.record-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.record-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 0;
  border-bottom: 1px solid #F0EADF;
}

.record-row:last-child {
  border-bottom: none;
}

.record-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.record-title {
  font-size: 12px;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.record-sub {
  font-size: 10px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.record-score {
  font-family: var(--font-display);
  font-size: 16px;
  color: var(--accent);
  flex-shrink: 0;
}

.record-empty {
  font-size: 12px;
  color: var(--muted);
  padding: 14px 0;
}

.topic-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
}

.topic-name {
  width: 78px;
  font-size: 11px;
  color: var(--ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.topic-track {
  flex: 1;
  height: 4px;
  border-radius: 3px;
  background: #EDE6D9;
  overflow: hidden;
}

.topic-fill {
  height: 100%;
  background: var(--ink-2);
  border-radius: 3px;
}

.topic-count {
  font-size: 11px;
  color: var(--muted);
  width: 20px;
  text-align: right;
}

.setting-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #FBF8F1;
}

.setting-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  cursor: pointer;
}

.setting-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-toggle {
  font-size: 11px;
  color: var(--accent);
}

.setting-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid var(--line);
  padding-top: 12px;
}

.setting-hint {
  font-size: 11px;
  color: var(--muted);
  line-height: 1.6;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 10px 12px;
  background: #FFFDF8;
  border: 1px solid var(--line);
  border-radius: 10px;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.setting-name {
  font-size: 13px;
  color: var(--ink);
  font-weight: 600;
}

.setting-desc {
  font-size: 10px;
  color: var(--muted);
}

.setting-weight {
  font-size: 9px;
  color: var(--muted);
  letter-spacing: 0.05em;
}

.setting-ops {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.op-link {
  font-size: 11px;
  color: var(--ink-2);
  cursor: pointer;
}

.op-link:hover {
  color: var(--accent);
}

.op-link.danger {
  color: var(--danger);
}

.setting-empty {
  font-size: 12px;
  color: var(--muted);
  padding: 8px 0;
}

.dimension-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding-top: 4px;
}

.form-input {
  height: 34px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: #FFFDF8;
  padding: 0 11px;
  font-size: 12px;
  color: var(--ink);
  width: 150px;
}

.form-input.wide {
  width: 220px;
}

.form-input.narrow {
  width: 76px;
}

.primary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  padding: 0 16px;
  border-radius: 999px;
  background: var(--ink);
  color: #F8F3E8;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.16s ease;
  white-space: nowrap;
}

.primary-btn:hover {
  background: var(--accent);
}

.primary-btn.compact {
  height: 32px;
  padding: 0 14px;
}

.primary-btn.disabled {
  opacity: 0.45;
  pointer-events: none;
}

.ghost-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  color: var(--ink-2);
  font-size: 12px;
  cursor: pointer;
  background: transparent;
}

.ghost-btn:hover {
  background: #F3EDE1;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 24px;
  border-top: 1px solid var(--line);
  background: #FBF7EF;
}

.footer-note {
  font-size: 10px;
  color: var(--muted);
  letter-spacing: 0.04em;
}

.footer-actions {
  display: flex;
  gap: 10px;
}

@media (max-width: 768px) {
  .detail-overlay {
    padding: 0;
  }
  .detail-dialog {
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
  .stat-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .stat-cell:nth-child(2) {
    border-right: none;
  }
  .stat-cell:nth-child(1),
  .stat-cell:nth-child(2) {
    border-bottom: 1px solid var(--line);
  }
  .ability-grid,
  .record-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .dialog-header {
    padding: 14px 16px;
  }
  .dialog-body {
    padding: 16px;
  }
  .footer-note {
    display: none;
  }
  .dialog-footer {
    justify-content: flex-end;
  }
  .empty-dimension {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
