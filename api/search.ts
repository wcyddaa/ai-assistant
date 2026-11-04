import { request } from './request'
import type { SearchRequest, SearchResult } from '@/types/api'

/**
 * 语义搜索
 */
export function search(params: SearchRequest) {
  return request<SearchResult[]>({
    url: '/api/textbooks/search',
    method: 'POST',
    data: params
  })
}