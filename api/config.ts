/**
 * 模型配置 API
 * 调用 xs-config 配置服务 (8086)
 */
import { request } from './request'

const BASE_URL = 'http://localhost:8086'

export interface ModelConfigItem {
  id: number | null
  configType: string
  agentName: string
  modelName: string
  baseUrl?: string
  /** 后端列表接口不下发明文密钥；编辑时留空表示保留原密钥 */
  apiKey?: string
  temperature?: number
  maxTokens?: number
  /** 测试状态：untested / success / fail */
  testStatus?: string
  testMessage?: string
  lastTestTime?: string
  /** 是否已发布：1 是，0 否 */
  enabled?: number
  apiKeyConfigured?: boolean
}

/** 获取指定类型的模型配置列表 */
export function getModelConfigs(configType: string): Promise<ModelConfigItem[]> {
  return request<ModelConfigItem[]>({
    url: '/api/model-config',
    method: 'GET',
    baseURL: BASE_URL,
    data: { configType } as Record<string, unknown>
  })
}

/** 获取智能体名称列表 */
export function getAgentNames(configType: string): Promise<string[]> {
  return request<string[]>({
    url: `/api/model-config/agent-names?configType=${encodeURIComponent(configType)}`,
    method: 'GET',
    baseURL: BASE_URL
  })
}

/** 获取模型名称列表 */
export function getModelNames(configType: string): Promise<string[]> {
  return request<string[]>({
    url: `/api/model-config/model-names?configType=${encodeURIComponent(configType)}`,
    method: 'GET',
    baseURL: BASE_URL
  })
}

/** 保存或更新配置 */
export function saveModelConfig(data: ModelConfigItem): Promise<ModelConfigItem> {
  return request<ModelConfigItem>({
    url: '/api/model-config',
    method: 'POST',
    baseURL: BASE_URL,
    data: data as unknown as Record<string, unknown>
  })
}

/** 删除配置 */
export function deleteModelConfig(id: number): Promise<void> {
  return request<void>({
    url: `/api/model-config/${id}`,
    method: 'DELETE',
    baseURL: BASE_URL
  })
}

/** 获取指定智能体和模型名称的配置详情 */
export function getModelConfigDetail(configType: string, agentName: string, modelName: string): Promise<ModelConfigItem> {
  return request<ModelConfigItem>({
    url: `/api/model-config/detail?configType=${encodeURIComponent(configType)}&agentName=${encodeURIComponent(agentName)}&modelName=${encodeURIComponent(modelName)}`,
    method: 'GET',
    baseURL: BASE_URL
  })
}

/** 教师可选的已发布模型（测试成功且已发布，完全脱敏） */
export function getPublishedModels(agentType?: string): Promise<ModelConfigItem[]> {
  const query = agentType ? `?agentType=${encodeURIComponent(agentType)}` : ''
  return request<ModelConfigItem[]>({
    url: `/api/model-config/published${query}`,
    method: 'GET',
    baseURL: BASE_URL
  })
}

/** 模型测试结果 */
export interface ModelTestResult {
  success: boolean
  latencyMs: number
  message: string
  reply: string
  testStatus?: string
  enabled?: number
}

/** 管理员测试连接（服务端使用已保存的地址与密钥真实调用） */
export function testModelConfig(id: number): Promise<ModelTestResult> {
  return request<ModelTestResult>({
    url: `/api/model-config/${id}/test`,
    method: 'POST',
    baseURL: BASE_URL
  })
}

/** 发布模型（必须先测试成功） */
export function publishModelConfig(id: number): Promise<{ id: number; enabled: number }> {
  return request<{ id: number; enabled: number }>({
    url: `/api/model-config/${id}/publish`,
    method: 'PUT',
    baseURL: BASE_URL
  })
}

/** 停用模型 */
export function unpublishModelConfig(id: number): Promise<{ id: number; enabled: number }> {
  return request<{ id: number; enabled: number }>({
    url: `/api/model-config/${id}/unpublish`,
    method: 'PUT',
    baseURL: BASE_URL
  })
}