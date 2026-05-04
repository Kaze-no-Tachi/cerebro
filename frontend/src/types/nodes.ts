// Shape of POST /nodes — see app/models/nodes/Node.scala. Fields named
// without `_in_bytes` are human-formatted strings ("256mb") because
// _nodes/stats is queried with ?human=true.

export interface NodeRow {
  id: string
  current_master: boolean
  name: string
  host: string | null
  heap: { max: string; used: string; percent: number }
  disk: { total: number; available: number; percent: number } | null
  cpu: { process: number; os: number; load: number | null }
  uptime: number
  jvm: string | null
  attributes: Record<string, string>
  version: string
  master: boolean
  coordinating: boolean
  ingest: boolean
  data: boolean
}
