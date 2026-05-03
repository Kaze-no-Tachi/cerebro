// Shape of the response from POST /overview, mirroring
// app/models/overview/ClusterOverview.scala. Fields here are the ones the UI
// actually consumes today; any not yet rendered are typed as `unknown` so
// they're explicit when picked up later.

export type ClusterStatus = 'green' | 'yellow' | 'red'

export interface OverviewNode {
  id: string
  current_master: boolean
  name: string
  host: string | null
  ip: string | null
  es_version: string
  jvm_version: string | null
  load_average: number
  available_processors: number
  cpu_percent: number
  master: boolean
  data: boolean
  coordinating: boolean
  ingest: boolean
  heap: { used: number; committed: number; used_percent: number; max: number }
  disk: { total: number; free: number; used_percent: number }
  attributes: Record<string, unknown>
}

export interface OverviewIndex {
  name: string
  closed: boolean
  special: boolean
  unhealthy: boolean
  doc_count?: number
  deleted_docs?: number
  size_in_bytes?: number
  total_size_in_bytes?: number
  aliases: string[]
  num_shards?: number
  num_replicas?: number
  shards?: Record<string, unknown>
}

export interface ClusterOverview {
  cluster_name: string
  status: ClusterStatus
  number_of_nodes: number
  active_primary_shards: number
  active_shards: number
  relocating_shards: number
  initializing_shards: number
  unassigned_shards: number
  docs_count: number
  size_in_bytes: number
  total_indices: number
  closed_indices: number
  special_indices: number
  indices: OverviewIndex[]
  nodes: OverviewNode[]
  shard_allocation: boolean
}
