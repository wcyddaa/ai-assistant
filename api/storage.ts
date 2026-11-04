/**
 * 对象存储配置 API
 * 调用 xs-config 配置服务 (8086)，仅管理员可用
 */
import { request } from './request'

const BASE_URL = 'http://localhost:8086'

export interface StorageConfigItem {
  id: number | null
  provider: string
  /** OSS 等需要独立接入地址；AGC/COS 可留空 */
  endpoint?: string
  bucket?: string
  region?: string
  clientId?: string
  /** 后端永不下发明文；编辑时留空表示沿用已保存密钥 */
  clientSecret?: string
  secretConfigured?: boolean
  /** untested / success / fail */
  status?: string
  testMessage?: string
  lastTestTime?: string
  enabled?: number
}

/** 支持的存储类型（后端下发字段标签，前端按需渲染） */
export interface StorageProviderMeta {
  value: string
  label: string
  endpointLabel?: string | null
  regionLabel?: string | null
  bucketLabel?: string | null
  clientIdLabel?: string | null
  secretLabel?: string | null
  hint?: string
}

/** 获取支持的存储类型 */
export function getStorageProviders(): Promise<StorageProviderMeta[]> {
  return request<StorageProviderMeta[]>({
    url: '/api/storage-config/providers',
    method: 'GET',
    baseURL: BASE_URL
  })
}

/** 获取存储配置（密钥已脱敏） */
export function getStorageConfig(): Promise<StorageConfigItem[]> {
  return request<StorageConfigItem[]>({
    url: '/api/storage-config',
    method: 'GET',
    baseURL: BASE_URL
  })
}

/** 保存存储配置 */
export function saveStorageConfig(data: StorageConfigItem): Promise<StorageConfigItem> {
  return request<StorageConfigItem>({
    url: '/api/storage-config',
    method: 'PUT',
    baseURL: BASE_URL,
    data: data as unknown as Record<string, unknown>
  })
}

/** 测试存储凭据连通性 */
export function testStorageConfig(data: StorageConfigItem): Promise<StorageConfigItem> {
  return request<StorageConfigItem>({
    url: '/api/storage-config/test',
    method: 'POST',
    baseURL: BASE_URL,
    data: data as unknown as Record<string, unknown>
  })
}
