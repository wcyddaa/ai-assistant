<!-- App.vue -->
<script setup>
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

// 初始化用户状态
userStore.initUser()
</script>

<style>
/* =========================================================
   星枢平台 · 全局设计系统
   视觉基调：教育档案室 —— 暖纸色画布 + 墨蓝字 + 朱砂强调色
   ========================================================= */
page {
  /* 色彩 */
  --paper: #F4F0E8;
  --paper-deep: #EBE5D9;
  --surface: #FFFDF8;
  --surface-raised: #FFFFFF;
  --ink: #17233B;
  --ink-2: #3C4A60;
  --muted: #7B8593;
  --line: #E0D9CB;
  --line-strong: #CDC3B0;
  --accent: #B4532A;
  --accent-ink: #8D3C1E;
  --accent-soft: #F2E3D9;
  --success: #3F6B52;
  --warning: #AD741B;
  --danger: #A33B2E;
  --info: #35597F;

  /* 字体 */
  --font-body: 'PingFang SC', 'HarmonyOS Sans SC', 'Microsoft YaHei', 'Helvetica Neue', sans-serif;
  --font-display: 'Songti SC', 'Noto Serif SC', 'Source Han Serif SC', Georgia, 'Times New Roman', serif;
  --font-mono: 'SF Mono', 'JetBrains Mono', Consolas, 'Courier New', monospace;

  /* 形状与阴影 */
  --radius-sm: 8px;
  --radius: 14px;
  --radius-lg: 20px;
  --shadow-soft: 0 1px 2px rgba(23, 35, 59, 0.04), 0 14px 30px -22px rgba(23, 35, 59, 0.38);
  --shadow-lift: 0 2px 4px rgba(23, 35, 59, 0.05), 0 22px 40px -24px rgba(23, 35, 59, 0.42);

  font-family: var(--font-body);
  font-size: 14px;
  color: var(--ink);
  background-color: var(--paper);
  background-image:
    radial-gradient(1200px 520px at 12% -8%, rgba(180, 83, 42, 0.10), transparent 60%),
    radial-gradient(900px 480px at 100% 0%, rgba(53, 89, 127, 0.08), transparent 62%),
    linear-gradient(180deg, #F6F2EA 0%, #F4F0E8 38%, #F1ECE2 100%);
  background-attachment: fixed;
  -webkit-font-smoothing: antialiased;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* 全局排版基线：任何页面未显式声明字体时也会继承这套气质 */
text,
span {
  line-height: 1.55;
}

input,
textarea,
button {
  font-family: var(--font-body);
  color: var(--ink);
}

input::placeholder,
textarea::placeholder {
  color: #A6AEBA;
}

/* 页面主标题统一衬线气质（各页可继续覆盖字号/颜色） */
.page-title,
.section-title,
.card-title,
.modal-title,
.detail-title,
.form-title,
.panel-title {
  font-family: var(--font-display);
  letter-spacing: 0.01em;
}

/* 数字统一使用等宽数字，读表更稳 */
.stat-value,
.usage-value,
.metric-value,
.number {
  font-family: var(--font-display);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

/* 小号全大写标签（英文辅助标签用） */
.caps {
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}

/* 细线分隔 */
.hairline {
  height: 1px;
  background: var(--line);
  width: 100%;
}

/* 滚动条（H5） */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
::-webkit-scrollbar-thumb {
  background: #D5CCBC;
  border-radius: 999px;
  border: 3px solid transparent;
  background-clip: content-box;
}
::-webkit-scrollbar-thumb:hover {
  background: #BDB19C;
  background-clip: content-box;
}
::-webkit-scrollbar-track {
  background: transparent;
}

/* 选中态 */
::selection {
  background: var(--accent-soft);
  color: var(--accent-ink);
}

/* =========================================================
   弹窗统一规范
   保证任何弹窗都落在视口内：顶部留出安全区、超出时整体可滚动，
   标题与右上角关闭按钮始终可见，避免被顶部栏或内容区裁掉。
   ========================================================= */
.popup-overlay,
.dialog-mask {
  position: fixed !important;
  inset: 0 !important;
  z-index: 1000 !important;
  display: flex !important;
  align-items: flex-start !important;
  justify-content: center !important;
  padding: 56px 20px 32px !important;
  overflow-y: auto !important;
  overscroll-behavior: contain;
}

.form-dialog,
.popup-dialog,
.student-dialog {
  position: relative;
  max-height: calc(100vh - 88px) !important;
  overflow-y: auto !important;
  margin: auto 0 !important;
  flex-shrink: 0;
}

/* 详情类弹窗自身已带 max-height / 内部滚动，这里只补定位与居中 */
.detail-dialog {
  position: relative;
  margin: auto 0 !important;
}

/* 问答/配置类弹窗（dialog-mask + dialog）保持上下居中 */
.dialog-mask > .dialog {
  margin: auto 0 !important;
}

/* 进度弹窗等自定义弹窗同样居中，不贴顶 */
.popup-overlay > .progress-dialog {
  margin: auto 0 !important;
}

/* uni-app H5 的 picker 弹层固定 z-index:999，低于上面统一设置的弹窗层级(1000)，
   表现就是弹窗里的下拉 picker 点击后“没有下拉/滚轮”、看起来按钮点不动。
   这里统一把 picker 弹层提到弹窗之上。 */
.uni-picker-container {
  z-index: 1200 !important;
}

/* 弹窗右上角关闭按钮（各页未自带 × 时统一补一个，避免与已自带 .modal-close 的页面冲突） */
.dialog-x {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 3;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-body);
  font-size: 19px;
  line-height: 1;
  color: var(--muted);
  cursor: pointer;
  border-radius: 8px;
  transition: color 0.16s ease, background 0.16s ease;
}

.dialog-x:hover {
  color: var(--ink);
  background: var(--paper-deep);
}

/* 给标题右侧留出 × 的位置，避免文字压到按钮 */
.form-dialog .form-title,
.detail-dialog .form-title,
.popup-dialog .form-title,
.student-dialog .form-title,
.popup-dialog .dialog-title {
  padding-right: 30px;
}

/* 添加学生 / 添加教师一行：输入框与按钮同高、垂直居中 */
.add-student-row {
  align-items: center;
}

.add-student-row .form-input {
  margin-bottom: 0 !important;
}

.add-student-row .btn-confirm,
.add-student-row .btn-add {
  height: 42px !important;
  line-height: 40px !important;
  padding: 0 18px !important;
  flex-shrink: 0;
}

/* =========================================================
   uni-app H5 原生输入框默认样式规整
   uni-input 默认 height/line-height 均为 1.4em 且 overflow:hidden，
   在自定义高度输入框里占位文字与输入文字容易被压到框外。
   ========================================================= */
uni-input {
  line-height: 1.4 !important;
}

uni-input .uni-input-wrapper,
uni-input .uni-input-form {
  height: 100%;
}

uni-input .uni-input-input,
uni-input .uni-input-placeholder,
uni-textarea .uni-textarea-textarea,
uni-textarea .uni-textarea-placeholder {
  font-family: var(--font-body) !important;
  font-size: inherit !important;
  line-height: 1.4 !important;
  color: var(--ink);
}

/* 只调颜色：不要覆盖 display，uni-input 用 v-show 的 inline display:none 隐藏占位文字，
   加 !important 的 display 会让占位文字在输入后仍与真实文字重叠 */
uni-input .uni-input-placeholder {
  color: #A6AEBA;
}

uni-textarea .uni-textarea-placeholder {
  color: #A6AEBA;
}
</style>
