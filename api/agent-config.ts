// api/agent-config.ts - 教学班智能体配置 API（xs-config，端口 8086）
// 模板由后端内置，教师只创建教学班实例；模型只能选用管理员测试通过并发布的模型。
import { request } from '@/api/request'

const CONFIG_API_BASE = 'http://localhost:8086'

export type AgentType = 'chat' | 'homework' | 'knowledge_graph' | 'student_insight'

/** 后端内置智能体模板（固定四种，管理员不可新增） */
export interface AgentTemplate {
  code: AgentType
  name: string
  description: string
  defaultPrompt: string
}

/** 教学班智能体实例（密钥与地址由服务端注入，前端不可见） */
export interface AgentClassConfig {
  id?: number
  classId: number
  teacherId: number
  /** 实例名称（同一教学班同一模板唯一） */
  agentName?: string
  /** 模板类型：chat / homework / knowledge_graph / student_insight */
  agentType?: AgentType | string
  /** 所选管理员已发布模型 */
  modelConfigId?: number | null
  /** 模型名称（服务端写入，只读展示） */
  modelName?: string
  temperature?: number
  maxTokens?: number
  /** 每日请求次数上限 */
  requestLimitDaily?: number
  /** 已用 token（实例维度统计） */
  tokenUsed?: number
  requestUsed?: number
  requestDate?: string
  systemPrompt?: string
  roleDefinition?: string
  status?: string
  createTime?: string
  updateTime?: string
}

/** 教学班智能体公开信息（学生端使用） */
export interface PublicAgent {
  id: number
  agentName: string
  agentType: string
  modelName: string
  status: string
}

/** 教学班智能体用量汇总（额度为班级共享） */
export interface ClassAgentUsage {
  agentCount: number
  tokenUsed: number
  tokenLimit: number
  requestUsedToday: number
  classTokenLimit: number
  classTokenUsed: number
  classQuotaConfigured: boolean
  agents: AgentClassConfig[]
}

/** 教学班额度 */
export interface ClassQuotaInfo {
  classId: number
  configured: boolean
  totalTokenLimit: number
  tokenUsed: number
  remainingTokenLimit: number
}

/** 平台总额度统计 */
export interface PlatformQuotaStats {
  totalTokenLimit: number
  allocatedTokenLimit: number
  availableTokenLimit: number
  tokenUsed: number
  classCount: number
  classes: Array<{ classId: number; totalTokenLimit: number; tokenUsed: number }>
}

/** 平台额度概览（教师调整班级额度时参考，不含班级明细） */
export type PlatformQuotaOverview = Omit<PlatformQuotaStats, 'classes'>

/** 管理员视角：全部教学班智能体实例 */
export interface AllAgentInstance {
  id: number
  classId: number
  className: string
  classStatus: string
  teacherId: number | null
  teacherName: string
  agentName: string
  agentType: string
  modelConfigId: number | null
  modelName: string
  status: string
  tokenUsed: number
  requestUsed: number
  requestDate?: string
  updateTime?: string
}

export interface AgentConnectionTestResult {
  success: boolean
  latencyMs: number
  message: string
  reply: string
  modelName?: string
}

/** 获取后端固定智能体模板 */
export function listAgentTemplates(): Promise<AgentTemplate[]> {
  return request<AgentTemplate[]>({
    url: '/api/agent-class-config/templates',
    method: 'GET',
    baseURL: CONFIG_API_BASE
  })
}

/** 获取教学班可用智能体（学生端，不含密钥） */
export function listPublicAgents(classId: number): Promise<PublicAgent[]> {
  return request<PublicAgent[]>({
    url: `/api/agent-class-config/class/${classId}/agents/public`,
    method: 'GET',
    baseURL: CONFIG_API_BASE
  })
}

/** 获取教学班全部智能体实例（教师端，密钥与地址不下发） */
export function listAgents(classId: number): Promise<AgentClassConfig[]> {
  return request<AgentClassConfig[]>({
    url: `/api/agent-class-config/class/${classId}/agents`,
    method: 'GET',
    baseURL: CONFIG_API_BASE
  })
}

/** 获取教学班智能体用量汇总 */
export function getClassAgentUsage(classId: number): Promise<ClassAgentUsage> {
  return request<ClassAgentUsage>({
    url: `/api/agent-class-config/class/${classId}/usage`,
    method: 'GET',
    baseURL: CONFIG_API_BASE
  })
}

/** 兼容旧调用：获取教学班第一个启用的智能体 */
export function getAgentClassConfig(classId: number): Promise<AgentClassConfig> {
  return request<AgentClassConfig>({
    url: `/api/agent-class-config/class/${classId}`,
    method: 'GET',
    baseURL: CONFIG_API_BASE
  })
}

/** 获取教师所有教学班的智能体配置 */
export function listAgentClassConfigsByTeacher(teacherId: number): Promise<AgentClassConfig[]> {
  return request<AgentClassConfig[]>({
    url: `/api/agent-class-config/teacher/${teacherId}`,
    method: 'GET',
    baseURL: CONFIG_API_BASE
  })
}

/** 管理员查看全部实例（含所属教学班与教师） */
export function listAllAgentInstances(): Promise<AllAgentInstance[]> {
  return request<AllAgentInstance[]>({
    url: '/api/agent-class-config/all',
    method: 'GET',
    baseURL: CONFIG_API_BASE
  })
}

/** 测试已保存实例（服务端使用已发布模型凭据，无需提交密钥） */
export function testAgentInstance(id: number): Promise<AgentConnectionTestResult> {
  return request<AgentConnectionTestResult>({
    url: `/api/agent-class-config/${id}/test`,
    method: 'POST',
    baseURL: CONFIG_API_BASE
  })
}

/** 新增/更新单个智能体实例 */
export function saveAgent(config: AgentClassConfig): Promise<AgentClassConfig> {
  return request<AgentClassConfig>({
    url: '/api/agent-class-config/agent',
    method: 'POST',
    data: config as unknown as Record<string, unknown>,
    baseURL: CONFIG_API_BASE
  })
}

/** 兼容旧调用：保存或更新教学班智能体配置 */
export function saveAgentClassConfig(config: AgentClassConfig): Promise<AgentClassConfig> {
  return saveAgent(config)
}

/** 删除教学班智能体配置 */
export function deleteAgent(id: number): Promise<null> {
  return request<null>({
    url: `/api/agent-class-config/${id}`,
    method: 'DELETE',
    baseURL: CONFIG_API_BASE
  })
}

/** 兼容旧调用 */
export function deleteAgentClassConfig(id: number): Promise<null> {
  return deleteAgent(id)
}

/** 查询教学班额度 */
export function getClassQuota(classId: number): Promise<ClassQuotaInfo> {
  return request<ClassQuotaInfo>({
    url: `/api/quota/class/${classId}`,
    method: 'GET',
    baseURL: CONFIG_API_BASE
  })
}

/** 教师调整本教学班额度（受平台剩余可分配额度约束，操作人由登录身份确定） */
export function updateClassQuota(
  classId: number,
  totalTokenLimit: number
): Promise<ClassQuotaInfo> {
  return request<ClassQuotaInfo>({
    url: `/api/quota/class/${classId}`,
    method: 'PUT',
    data: { totalTokenLimit } as unknown as Record<string, unknown>,
    baseURL: CONFIG_API_BASE
  })
}

/** 平台总额度统计（管理员） */
export function getPlatformQuota(): Promise<PlatformQuotaStats> {
  return request<PlatformQuotaStats>({
    url: '/api/quota/platform',
    method: 'GET',
    baseURL: CONFIG_API_BASE
  })
}

/** 平台额度概览（管理员与教师均可查看） */
export function getPlatformQuotaOverview(): Promise<PlatformQuotaOverview> {
  return request<PlatformQuotaOverview>({
    url: '/api/quota/platform/overview',
    method: 'GET',
    baseURL: CONFIG_API_BASE
  })
}

/** 管理员调整平台总额度 */
export function updatePlatformQuota(totalTokenLimit: number): Promise<PlatformQuotaStats> {
  return request<PlatformQuotaStats>({
    url: '/api/quota/platform',
    method: 'PUT',
    data: { totalTokenLimit } as unknown as Record<string, unknown>,
    baseURL: CONFIG_API_BASE
  })
}
