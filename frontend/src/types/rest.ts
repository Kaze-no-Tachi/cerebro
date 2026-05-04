export type RestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface RestHistoryEntry {
  created_at: string
  host: string
  method: RestMethod
  path: string
  body?: string | null
}

export interface RestResponse {
  status: number
  body: unknown
}
