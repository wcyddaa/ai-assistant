<template>
  <view class="kg">
    <view class="kg-head">
      <view class="kg-head-main">
        <text class="kg-title">课程知识图谱</text>
        <text v-if="graph && graph.nodes.length" class="kg-meta">
          {{ graph.nodes.length }} 个节点 · {{ graph.edges.length }} 条关系
          <text v-if="graph.generatedAt"> · 更新于 {{ formatTime(graph.generatedAt) }}</text>
        </text>
      </view>
      <view class="kg-actions">
        <slot name="actions" />
      </view>
    </view>

    <view v-if="graph && graph.nodes.length" class="kg-body">
      <view class="kg-canvas">
        <svg class="kg-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line
            v-for="(edge, idx) in drawableEdges"
            :key="'e' + idx"
            :x1="edge.x1"
            :y1="edge.y1"
            :x2="edge.x2"
            :y2="edge.y2"
            :class="['kg-line', 'kg-line--' + edge.relation]"
          />
        </svg>
        <view
          v-for="item in positionedNodes"
          :key="item.node.nodeKey"
          :class="['kg-node', 'kg-node--' + item.node.category, { 'is-active': selected && selected.nodeKey === item.node.nodeKey }]"
          :style="{ left: item.x + '%', top: item.y + '%' }"
          @click="selected = item.node"
        >
          <text class="kg-node-text">{{ shortName(item.node.name) }}</text>
        </view>
      </view>

      <view class="kg-side">
        <view v-if="selected" class="kg-detail">
          <view class="kg-detail-head">
            <text :class="['kg-tag', 'kg-tag--' + selected.category]">{{ categoryLabel(selected.category) }}</text>
            <text class="kg-detail-weight">权重 {{ Number(selected.weight).toFixed(2) }}</text>
          </view>
          <text class="kg-detail-name">{{ selected.name }}</text>
          <text v-if="selected.description" class="kg-detail-desc">{{ selected.description }}</text>
          <text class="kg-detail-source">来源：{{ sourceLabel(selected.source) }}</text>
        </view>
        <view v-else class="kg-detail kg-detail--hint">
          <text class="kg-detail-name">点击节点查看详情</text>
          <text class="kg-detail-desc">图谱由课件内容、学生提问主题与作业错误共同生成，教师备课与学生复习均可使用。</text>
        </view>

        <view class="kg-legend">
          <view v-for="l in legend" :key="l.key" class="kg-legend-item">
            <view :class="['kg-dot', 'kg-node--' + l.key]" />
            <text class="kg-legend-text">{{ l.label }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="kg-empty">
      <text class="kg-empty-title">尚未生成知识图谱</text>
      <text class="kg-empty-desc">上传课件并配置章节后，可由智能体从课件、学生提问与作业错误中提取知识点。</text>
      <slot name="empty" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { KnowledgeGraph, KnowledgeNode } from '@/api/course'

const props = defineProps<{
  graph: KnowledgeGraph | null
}>()

const selected = ref<KnowledgeNode | null>(null)

watch(() => props.graph, () => {
  selected.value = null
})

const legend = [
  { key: 'course', label: '课程' },
  { key: 'chapter', label: '章节' },
  { key: 'courseware', label: '课件' },
  { key: 'concept', label: '知识点' },
  { key: 'question', label: '高频提问' },
  { key: 'homework', label: '作业易错' }
]

const positionedNodes = computed(() => {
  const nodes = props.graph?.nodes || []
  if (!nodes.length) return []
  const ordered = [...nodes].sort((a, b) => categoryRank(a.category) - categoryRank(b.category))
  const positions: Record<string, { x: number; y: number }> = {}
  const result: { node: KnowledgeNode; x: number; y: number }[] = []

  const centerNode = ordered.find(n => n.category === 'course')
  const chapters = ordered.filter(n => n.category === 'chapter')
  const rest = ordered.filter(n => n.category !== 'course' && n.category !== 'chapter')

  if (centerNode) {
    positions[centerNode.nodeKey] = { x: 50, y: 50 }
    result.push({ node: centerNode, x: 50, y: 50 })
  }

  const chapterCenter = centerNode ? { x: 50, y: 50 } : { x: 50, y: 48 }
  const chapterRadius = chapters.length > 0 ? 22 : 0
  chapters.forEach((node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(chapters.length, 1) - Math.PI / 2
    const x = clamp(chapterCenter.x + Math.cos(angle) * chapterRadius, 8, 92)
    const y = clamp(chapterCenter.y + Math.sin(angle) * chapterRadius * 0.72, 10, 90)
    positions[node.nodeKey] = { x, y }
    result.push({ node, x, y })
  })

  const outerRadius = rest.length > 14 ? 40 : 36
  rest.forEach((node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(rest.length, 1) - Math.PI / 2 + 0.25
    const x = clamp(50 + Math.cos(angle) * outerRadius, 7, 93)
    const y = clamp(50 + Math.sin(angle) * outerRadius * 0.72, 8, 92)
    positions[node.nodeKey] = { x, y }
    result.push({ node, x, y })
  })

  return result
})

const drawableEdges = computed(() => {
  const positions: Record<string, { x: number; y: number }> = {}
  positionedNodes.value.forEach(item => {
    positions[item.node.nodeKey] = { x: item.x, y: item.y }
  })
  const list: { x1: number; y1: number; x2: number; y2: number; relation: string }[] = []
  for (const edge of props.graph?.edges || []) {
    const from = positions[edge.sourceKey]
    const to = positions[edge.targetKey]
    if (!from || !to) continue
    list.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y, relation: edge.relation || 'related' })
  }
  return list
})

function categoryRank(category: string) {
  return { course: 0, chapter: 1, courseware: 2, concept: 3, question: 4, homework: 5 }[category] ?? 6
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function shortName(name: string) {
  if (!name) return ''
  return name.length > 9 ? name.slice(0, 9) + '…' : name
}

function categoryLabel(category: string) {
  return {
    course: '课程', chapter: '章节', courseware: '课件', concept: '知识点',
    question: '高频提问', homework: '作业易错'
  }[category] || '知识点'
}

function sourceLabel(source: string) {
  return {
    chapter: '章节结构', courseware: '课件内容', question: '学生提问', homework: '作业数据'
  }[source] || '课程资料'
}

function formatTime(value: string) {
  if (!value) return ''
  return value.replace('T', ' ').slice(0, 16)
}
</script>

<style scoped lang="scss">
.kg {
  border: 1px solid var(--line, #e6e0d4);
  border-radius: 16px;
  background: var(--surface, #fffdf8);
  padding: 18px;
}

.kg-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.kg-head-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kg-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--ink, #22232a);
}

.kg-meta {
  font-size: 12px;
  color: var(--ink-3, #8a8578);
}

.kg-body {
  display: flex;
  gap: 16px;
  margin-top: 14px;
  flex-wrap: wrap;
}

.kg-canvas {
  position: relative;
  flex: 1 1 480px;
  min-width: 300px;
  height: 420px;
  border-radius: 12px;
  background:
    radial-gradient(circle at 50% 50%, rgba(33, 74, 106, 0.06), transparent 62%),
    var(--paper, #faf7f0);
  overflow: hidden;
}

.kg-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.kg-line {
  stroke: rgba(33, 74, 106, 0.35);
  stroke-width: 0.5;
}

.kg-line--weak_point {
  stroke: rgba(176, 68, 52, 0.6);
  stroke-dasharray: 2 1.4;
}

.kg-line--prerequisite {
  stroke: rgba(176, 128, 47, 0.6);
  stroke-dasharray: 1.6 1.2;
}

.kg-node {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  line-height: 1.2;
  color: #fff;
  background: var(--ink, #22232a);
  box-shadow: 0 6px 14px rgba(24, 32, 44, 0.16);
  cursor: pointer;
  max-width: 112px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.kg-node:hover,
.kg-node.is-active {
  transform: translate(-50%, -50%) scale(1.08);
  box-shadow: 0 10px 22px rgba(24, 32, 44, 0.24);
  z-index: 3;
}

.kg-node--course {
  background: #1f3550;
  font-weight: 700;
}

.kg-node--chapter {
  background: var(--accent, #b04434);
}

.kg-node--courseware {
  background: #2f6f8f;
}

.kg-node--concept {
  background: #6b7f64;
}

.kg-node--question {
  background: #b0802f;
}

.kg-node--homework {
  background: #9c4a5c;
}

.kg-node-text {
  color: #fff;
  font-size: 11px;
}

.kg-side {
  flex: 1 1 220px;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kg-detail {
  border: 1px solid var(--line, #e6e0d4);
  border-radius: 12px;
  padding: 14px;
  background: var(--paper, #faf7f0);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.kg-detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.kg-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  color: #fff;
  background: var(--ink, #22232a);
}

.kg-tag--chapter { background: var(--accent, #b04434); }
.kg-tag--courseware { background: #2f6f8f; }
.kg-tag--concept { background: #6b7f64; }
.kg-tag--question { background: #b0802f; }
.kg-tag--homework { background: #9c4a5c; }

.kg-detail-weight {
  font-size: 11px;
  color: var(--ink-3, #8a8578);
}

.kg-detail-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--ink, #22232a);
}

.kg-detail-desc {
  font-size: 12px;
  line-height: 1.65;
  color: var(--ink-2, #4a4a52);
}

.kg-detail-source {
  font-size: 11px;
  color: var(--ink-3, #8a8578);
}

.kg-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
}

.kg-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.kg-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--ink, #22232a);
}

.kg-dot.kg-node--course { background: #1f3550; }
.kg-dot.kg-node--chapter { background: var(--accent, #b04434); }
.kg-dot.kg-node--courseware { background: #2f6f8f; }
.kg-dot.kg-node--concept { background: #6b7f64; }
.kg-dot.kg-node--question { background: #b0802f; }
.kg-dot.kg-node--homework { background: #9c4a5c; }

.kg-legend-text {
  font-size: 11px;
  color: var(--ink-2, #4a4a52);
}

.kg-empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 26px 18px;
  margin-top: 12px;
  border-radius: 12px;
  background: var(--paper, #faf7f0);
}

.kg-empty-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink, #22232a);
}

.kg-empty-desc {
  font-size: 12px;
  line-height: 1.6;
  color: var(--ink-3, #8a8578);
}

@media (max-width: 720px) {
  .kg-body {
    flex-direction: column;
  }
  .kg-canvas {
    height: 340px;
  }
}
</style>
