<!-- components/PdfPreview.vue - PDF 图片流预览组件 -->
<template>
  <view class="pdf-overlay" @click="close">
    <view class="preview-dialog" @click.stop>
      <!-- 顶部工具栏 -->
      <view class="preview-toolbar">
        <text class="toolbar-title">{{ title }}</text>
        <view class="toolbar-controls">
          <view class="page-nav">
            <text class="nav-btn" :class="{ disabled: currentPage <= 1 }" @click="goPage(currentPage - 1)">上一页</text>
            <input
              class="page-input"
              :value="currentPage"
              type="number"
              :min="1"
              :max="totalPages"
              @confirm="onPageInput"
            />
            <text class="page-total">/ {{ totalPages }}</text>
            <text class="nav-btn" :class="{ disabled: currentPage >= totalPages }" @click="goPage(currentPage + 1)">下一页</text>
          </view>
          <view class="zoom-controls">
            <text class="zoom-btn" @click="zoomOut">-</text>
            <text class="zoom-label">{{ zoomPercent }}%</text>
            <text class="zoom-btn" @click="zoomIn">+</text>
            <text class="zoom-btn fit" @click="fitWidth">适应宽度</text>
          </view>
        </view>
        <text class="close-btn" @click="close">×</text>
      </view>

      <!-- 图片预览区域 -->
      <view class="preview-body" @scroll.passive>
        <view v-if="loading" class="loading-state">
          <text class="loading-text">加载中...</text>
        </view>
        <view v-else-if="error" class="error-state">
          <text class="error-text">{{ error }}</text>
          <text class="retry-btn" @click="loadPage">重新加载</text>
        </view>
        <img
          v-show="!loading && !error"
          class="page-image"
          :style="{ transform: 'scale(' + zoom / 100 + ')', transformOrigin: 'top center' }"
          :src="imageSrc"
          @load="onImageLoad"
          @error="onImageError"
          alt="PDF 第 {{ currentPage }} 页"
        />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  fileId: string
  baseUrl: string
  totalPages: number
  title: string
  dpi?: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const currentPage = ref(1)
const zoom = ref(100)
const loading = ref(true)
const error = ref('')
const imageSrc = ref('')

const dpi = computed(() => props.dpi || 200)
const zoomPercent = computed(() => Math.round(zoom.value))

function buildImageUrl(page: number): string {
  return `${props.baseUrl}/pages/${page}?dpi=${dpi.value}`
}

function loadPage() {
  loading.value = true
  error.value = ''
  imageSrc.value = buildImageUrl(currentPage.value)
}

function onImageLoad() {
  loading.value = false
}

function onImageError() {
  loading.value = false
  error.value = '图片加载失败，请重试'
}

function goPage(page: number) {
  if (page < 1 || page > props.totalPages) return
  currentPage.value = page
  loadPage()
}

function onPageInput(e: { detail: { value: string } }) {
  const val = parseInt(e.detail.value, 10)
  if (isNaN(val)) return
  goPage(val)
}

function zoomIn() {
  zoom.value = Math.min(zoom.value + 20, 300)
}

function zoomOut() {
  zoom.value = Math.max(zoom.value - 20, 40)
}

function fitWidth() {
  zoom.value = 100
}

function close() {
  emit('close')
}

// 初始化加载
loadPage()

// 键盘快捷键：左右箭头翻页
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') {
    goPage(currentPage.value - 1)
  } else if (e.key === 'ArrowRight') {
    goPage(currentPage.value + 1)
  } else if (e.key === 'Escape') {
    close()
  }
}

// #ifdef H5
if (typeof document !== 'undefined') {
  document.addEventListener('keydown', onKeydown)
}
// #endif
</script>

<style scoped>
.pdf-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.preview-dialog {
  background: #fff;
  border-radius: 12px;
  width: 90vw;
  max-width: 960px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

/* 顶部工具栏 */
.preview-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
  min-height: 48px;
}

.toolbar-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  flex-shrink: 0;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toolbar-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  justify-content: center;
}

.page-nav {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-btn {
  font-size: 12px;
  color: #1a1a2e;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 4px;
  background: #fff;
  border: 1px solid #ddd;
  transition: all 0.15s;
  user-select: none;
}
.nav-btn:hover {
  background: #1a1a2e;
  color: #fff;
  border-color: #1a1a2e;
}
.nav-btn.disabled {
  color: #ccc;
  cursor: default;
  pointer-events: none;
}

.page-input {
  width: 48px;
  height: 28px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
  font-size: 13px;
  box-sizing: border-box;
  background: #fff;
}
.page-input:focus {
  border-color: #1a1a2e;
  outline: none;
}

.page-total {
  font-size: 13px;
  color: #666;
  flex-shrink: 0;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
}

.zoom-btn {
  font-size: 12px;
  color: #666;
  cursor: pointer;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background: #fff;
  user-select: none;
  transition: all 0.15s;
}
.zoom-btn:hover {
  background: #eee;
}
.zoom-btn.fit {
  font-size: 11px;
  padding: 3px 6px;
}

.zoom-label {
  font-size: 12px;
  color: #888;
  min-width: 36px;
  text-align: center;
}

.close-btn {
  font-size: 22px;
  color: #999;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
  transition: all 0.2s;
}
.close-btn:hover {
  color: #333;
  background: #e8e8e8;
}

/* 预览内容区 */
.preview-body {
  flex: 1;
  overflow: auto;
  padding: 16px;
  background: #e8eaed;
  display: flex;
  justify-content: center;
}

.page-image {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  background: #fff;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 0;
}

.loading-text {
  font-size: 14px;
  color: #999;
}

.error-text {
  font-size: 14px;
  color: #e74c3c;
}

.retry-btn {
  font-size: 13px;
  color: #1976d2;
  cursor: pointer;
  text-decoration: underline;
}
</style>