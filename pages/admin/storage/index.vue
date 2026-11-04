<!-- pages/admin/storage/index.vue - 管理员：对象存储凭据配置（仅存本地数据库） -->
<template>
  <AppLayout>
    <view class="page-container">
      <view class="page-header">
        <view class="header-left">
          <text class="header-kicker">STORAGE REGISTRY</text>
          <text class="page-title">对象存储</text>
          <text class="header-sub">管理员维护云端存储凭据；密钥加密后只保存在本地数据库，不会进入代码仓库</text>
        </view>
      </view>

      <view class="section">
        <view class="section-divider">
          <text class="divider-index">01</text>
          <text class="divider-text">华为 AGC 云存储</text>
        </view>

        <view class="storage-card">
          <view class="field">
            <text class="field-label">存储类型</text>
            <view class="field-static">
              <text class="mono">agc</text>
              <text class="field-hint">华为 AppGallery Connect 云存储</text>
            </view>
          </view>

          <view class="field">
            <text class="field-label">存储桶</text>
            <input v-model="form.bucket" class="field-input" placeholder="例如 pdf-dwad8" />
          </view>

          <view class="field">
            <text class="field-label">区域</text>
            <input v-model="form.region" class="field-input" placeholder="例如 cn-east-3" />
          </view>

          <view class="field">
            <text class="field-label">Client ID</text>
            <input v-model="form.clientId" class="field-input" placeholder="AGC 客户端 ID" />
          </view>

          <view class="field">
            <text class="field-label">Client Secret</text>
            <input
              v-model="form.clientSecret"
              class="field-input"
              :password="true"
              :placeholder="secretConfigured ? '已配置，留空表示不修改' : 'AGC 客户端密钥'"
            />
            <text class="field-hint">
              {{ secretConfigured ? '当前已保存密钥，仅在需要更换时填写' : '尚未配置密钥' }}
            </text>
          </view>

          <view class="status-row">
            <text class="status-dot" :class="statusClass"></text>
            <text class="status-text">{{ statusText }}</text>
            <text v-if="form.testMessage" class="status-message">{{ form.testMessage }}</text>
          </view>

          <view class="actions">
            <button class="btn-secondary" :loading="testing" :disabled="saving" @click="handleTest">测试连接</button>
            <button class="btn-primary" :loading="saving" :disabled="testing" @click="handleSave">保存配置</button>
          </view>
        </view>

        <text class="note">
          说明：教材、课件、作业附件统一由 xs-media 管理，上传时先落本地再同步云端；云端不可用时不影响本地读写。
          凭据只在本服务启动时经内部接口读取，前端接口始终返回脱敏结果。
        </text>
      </view>
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { getStorageConfig, saveStorageConfig, testStorageConfig, type StorageConfigItem } from '@/api/storage'

const form = reactive<StorageConfigItem>({
  id: null,
  provider: 'agc',
  bucket: 'pdf-dwad8',
  region: 'cn-east-3',
  clientId: '',
  clientSecret: ''
})

const secretConfigured = ref(false)
const saving = ref(false)
const testing = ref(false)

const statusClass = computed(() => {
  if (form.status === 'success') return 'success'
  if (form.status === 'fail') return 'fail'
  return 'untested'
})

const statusText = computed(() => {
  if (form.status === 'success') return '连接正常'
  if (form.status === 'fail') return '连接失败'
  return '尚未测试'
})

async function load() {
  try {
    const list = await getStorageConfig()
    const current = list.find((item) => item.enabled === 1) || list[0]
    if (current) {
      form.id = current.id
      form.provider = current.provider || 'agc'
      form.bucket = current.bucket || ''
      form.region = current.region || ''
      form.clientId = current.clientId || ''
      form.clientSecret = ''
      form.status = current.status
      form.testMessage = current.testMessage
      form.lastTestTime = current.lastTestTime
      secretConfigured.value = Boolean(current.secretConfigured)
    }
  } catch (e) {
    uni.showToast({ title: '加载存储配置失败', icon: 'none' })
  }
}

async function handleSave() {
  saving.value = true
  try {
    const saved = await saveStorageConfig({ ...form })
    form.id = saved.id
    form.status = saved.status
    form.testMessage = saved.testMessage
    form.clientSecret = ''
    secretConfigured.value = Boolean(saved.secretConfigured)
    uni.showToast({ title: '已保存', icon: 'success' })
  } catch (e: any) {
    uni.showToast({ title: e?.message || '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

async function handleTest() {
  testing.value = true
  try {
    const result = await testStorageConfig({ ...form })
    form.status = result.status
    form.testMessage = result.testMessage
    if (result.id) form.id = result.id
    secretConfigured.value = Boolean(result.secretConfigured)
    form.clientSecret = ''
    uni.showModal({
      title: result.status === 'success' ? '测试通过' : '测试失败',
      content: result.testMessage || '',
      showCancel: false
    })
  } catch (e: any) {
    uni.showToast({ title: e?.message || '测试失败', icon: 'none' })
  } finally {
    testing.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.storage-card {
  background: #ffffff;
  border: 1px solid #e6e9f0;
  border-radius: 14px;
  padding: 24px 26px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-shadow: 0 8px 24px rgba(20, 32, 60, 0.05);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
  letter-spacing: 0.4px;
}

.field-input {
  height: 42px;
  border: 1px solid #dfe3ec;
  border-radius: 10px;
  padding: 0 14px;
  font-size: 14px;
  color: #1a2233;
  background: #fbfcfe;
}

.field-input:focus {
  border-color: #3b6ef6;
  background: #ffffff;
}

.field-static {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 42px;
}

.field-hint {
  font-size: 12px;
  color: #8a93a6;
}

.mono {
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 13px;
  background: #f2f5fb;
  border-radius: 6px;
  padding: 4px 10px;
  color: #2d3a56;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding-top: 4px;
  border-top: 1px dashed #eef1f7;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #b9c0cf;
}

.status-dot.success {
  background: #22a06b;
}

.status-dot.fail {
  background: #e0483d;
}

.status-text {
  font-size: 13px;
  font-weight: 600;
  color: #2d3a56;
}

.status-message {
  font-size: 12px;
  color: #8a93a6;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-secondary,
.btn-primary {
  height: 40px;
  line-height: 40px;
  padding: 0 22px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  margin: 0;
}

.btn-secondary {
  background: #f2f5fb;
  color: #2d3a56;
  border: 1px solid #dfe3ec;
}

.btn-primary {
  background: #3b6ef6;
  color: #ffffff;
}

.note {
  display: block;
  margin-top: 14px;
  font-size: 12px;
  line-height: 1.7;
  color: #8a93a6;
}
</style>
