<!-- components/teacher/AbilityRadar.vue - 教学班能力雷达图 -->
<template>
  <view class="radar-wrap" :style="{ width: size + 'px', height: size + 'px' }">
    <canvas
      :id="canvasId"
      :canvas-id="canvasId"
      class="radar-canvas"
      :style="{ width: size + 'px', height: size + 'px' }"
    ></canvas>
    <view v-if="points.length === 0" class="radar-empty">
      <text>暂无可绘制的维度</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onMounted, watch } from 'vue'

interface RadarPoint {
  name: string
  score: number
}

const props = withDefaults(defineProps<{
  dimensions: Array<{ dimensionName: string; score: number }>
  size?: number
}>(), {
  size: 300
})

const instance = getCurrentInstance()
const canvasId = `abilityRadar_${Math.random().toString(36).slice(2, 8)}`

const points = computed<RadarPoint[]>(() =>
  props.dimensions
    .filter((d) => d && d.dimensionName)
    .slice(0, 8)
    .map((d) => ({
      name: d.dimensionName,
      score: Math.max(0, Math.min(100, Number(d.score) || 0))
    }))
)

function drawRadar() {
  if (points.value.length < 3) return
  const ctx = uni.createCanvasContext(canvasId, instance?.proxy as never)
  const size = props.size
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - 46
  const count = points.value.length
  const angleStep = (Math.PI * 2) / count
  const startAngle = -Math.PI / 2

  ctx.clearRect(0, 0, size, size)

  // 网格环
  for (let ring = 1; ring <= 4; ring++) {
    const r = (radius * ring) / 4
    ctx.beginPath()
    for (let i = 0; i < count; i++) {
      const angle = startAngle + angleStep * i
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.setStrokeStyle(ring === 4 ? 'rgba(23,35,59,0.16)' : 'rgba(23,35,59,0.08)')
    ctx.setLineWidth(1)
    ctx.stroke()
  }

  // 轴线
  for (let i = 0; i < count; i++) {
    const angle = startAngle + angleStep * i
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius)
    ctx.setStrokeStyle('rgba(23,35,59,0.10)')
    ctx.setLineWidth(1)
    ctx.stroke()
  }

  // 数据多边形
  ctx.beginPath()
  for (let i = 0; i < count; i++) {
    const angle = startAngle + angleStep * i
    const r = (radius * points.value[i].score) / 100
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.setFillStyle('rgba(180,83,42,0.16)')
  ctx.fill()
  ctx.setStrokeStyle('#B4532A')
  ctx.setLineWidth(2)
  ctx.stroke()

  // 数据点与标签
  ctx.setFontSize(11)
  for (let i = 0; i < count; i++) {
    const angle = startAngle + angleStep * i
    const score = points.value[i].score
    const r = (radius * score) / 100
    const px = cx + Math.cos(angle) * r
    const py = cy + Math.sin(angle) * r

    ctx.beginPath()
    ctx.arc(px, py, 3, 0, Math.PI * 2)
    ctx.setFillStyle('#B4532A')
    ctx.fill()

    const labelR = radius + 20
    let lx = cx + Math.cos(angle) * labelR
    let ly = cy + Math.sin(angle) * labelR
    lx = Math.max(30, Math.min(size - 30, lx))
    ly = Math.max(14, Math.min(size - 12, ly))
    ctx.setTextAlign('center')
    ctx.setTextBaseline('middle')
    ctx.setFillStyle('#3C4A60')
    ctx.fillText(points.value[i].name.slice(0, 4), lx, ly)
  }

  ctx.draw()
}

function scheduleDraw() {
  nextTick(() => {
    setTimeout(drawRadar, 60)
  })
}

watch(() => props.dimensions, scheduleDraw, { deep: true })
onMounted(scheduleDraw)
</script>

<style scoped>
.radar-wrap {
  position: relative;
  margin: 0 auto;
}

.radar-canvas {
  display: block;
}

.radar-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--muted);
}
</style>
