<!-- pages/teacher/homework/student.vue - 批改单个学生作业 -->
<template>
  <AppLayout>
    <view class="page-container">
      <view class="page-header">
        <view class="header-text">
          <text class="page-kicker">GRADING</text>
          <text class="page-title">批改作业 · {{ studentName }}</text>
          <text class="page-sub">阅读学生作答 · 给出分数与评语</text>
        </view>
      </view>
      <view class="answer-box">
        <text class="section-label">学生作答</text>
        <view class="answer-content">{{ answer }}</view>
      </view>
      <view class="grade-box">
        <text class="section-label">评分</text>
        <input class="grade-input" v-model="score" type="number" placeholder="输入分数" />
      </view>
      <view class="comment-box">
        <text class="section-label">评语</text>
        <textarea class="comment-textarea" v-model="comment" placeholder="输入评语" />
      </view>
      <button class="submit-btn" @click="handleSubmit">提交批改</button>
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import AppLayout from '@/components/layout/AppLayout.vue'
import { gradeHomework } from '@/api/homework'

const homeworkId = ref(0)
const studentName = ref('')
const answer = ref('')
const score = ref('')
const comment = ref('')

onLoad((options: Record<string, string | undefined>) => {
  homeworkId.value = Number(options?.homeworkId ?? 0)
  studentName.value = decodeURIComponent(options?.studentName ?? '')
  answer.value = decodeURIComponent(options?.answer ?? '')
  score.value = options?.score ?? ''
})

async function handleSubmit() {
  try {
    await gradeHomework(homeworkId.value, Number(score.value), comment.value)
    uni.showToast({ title: '批改成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 800)
  } catch {
    uni.showToast({ title: '批改失败，请重试', icon: 'none' })
  }
}
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 720px;
  margin: 0 auto;
  padding: 2px;
  box-sizing: border-box;
}

/* ========== 页面头部 ========== */
.page-header {
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}

.page-kicker {
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
}

.page-title {
  font-family: var(--font-display);
  font-size: 22px;
  line-height: 1.3;
  color: var(--ink);
}

.page-sub {
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--muted);
}

/* ========== 面板 ========== */
.answer-box,
.grade-box,
.comment-box {
  padding: 18px 20px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
}

.section-label {
  display: block;
  margin-bottom: 10px;
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--muted);
}

.answer-content {
  font-size: 13.5px;
  line-height: 1.8;
  color: var(--ink-2);
  background: #F9F5ED;
  border-left: 2px solid var(--line-strong);
  border-radius: 0 8px 8px 0;
  padding: 12px 14px;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ========== 表单 ========== */
.grade-input {
  width: 140px;
  height: 40px;
  padding: 0 12px;
  box-sizing: border-box;
  font-family: var(--font-display);
  font-size: 16px;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 10px;
  font-variant-numeric: tabular-nums;
  transition: border-color 0.18s ease;
}

.grade-input:focus {
  border-color: var(--accent);
  outline: none;
}

.comment-textarea {
  width: 100%;
  height: 100px;
  padding: 12px;
  box-sizing: border-box;
  font-size: 13.5px;
  line-height: 1.75;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 10px;
  resize: vertical;
  transition: border-color 0.18s ease;
}

.comment-textarea:focus {
  border-color: var(--accent);
  outline: none;
}

/* ========== 提交 ========== */
.submit-btn {
  margin: 4px 0 0;
  width: 100%;
  height: 44px;
  line-height: 42px;
  font-size: 14px;
  letter-spacing: 0.06em;
  color: #F8F3E8;
  background: var(--ink);
  border: 1px solid var(--ink);
  border-radius: 10px;
  transition: background 0.18s ease, transform 0.18s ease;
}

.submit-btn:hover {
  background: #24334F;
  transform: translateY(-1px);
}

/* ========== 移动端 ========== */
@media (max-width: 768px) {
  .page-container {
    gap: 12px;
    padding: 0;
  }
  .page-title {
    font-size: 19px;
  }
  .answer-box,
  .grade-box,
  .comment-box {
    padding: 16px;
  }
  .grade-input {
    width: 100%;
  }
}
</style>
