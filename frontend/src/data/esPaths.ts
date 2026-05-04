// Curated list of common Elasticsearch / OpenSearch REST paths surfaced as
// path autocompletions in the REST view. Patterns containing `{}` are
// placeholders that the user fills in (e.g. `{index}/_search`).

export const ES_PATHS: readonly string[] = [
  // Search
  '_search',
  '_search?pretty',
  '_msearch',
  '{index}/_search',
  '{index}/_count',
  '{index}/_explain/{id}',

  // Indexing
  '{index}/_doc',
  '{index}/_doc/{id}',
  '{index}/_create/{id}',
  '{index}/_update/{id}',
  '{index}/_bulk',
  '_bulk',

  // Index management
  '{index}',
  '{index}/_settings',
  '{index}/_mapping',
  '{index}/_alias/{alias}',
  '{index}/_close',
  '{index}/_open',
  '{index}/_refresh',
  '{index}/_flush',
  '{index}/_forcemerge',
  '{index}/_clone/{target}',
  '{index}/_rollover',

  // Mapping / settings
  '_mapping',
  '_settings',
  '_aliases',
  '_alias',
  '_alias/{alias}',

  // Templates
  '_template',
  '_template/{name}',
  '_index_template',
  '_index_template/{name}',
  '_component_template',
  '_component_template/{name}',

  // Cluster
  '_cluster/health',
  '_cluster/health?level=indices',
  '_cluster/health?level=shards',
  '_cluster/state',
  '_cluster/settings',
  '_cluster/stats',
  '_cluster/pending_tasks',
  '_cluster/reroute',
  '_cluster/allocation/explain',

  // Nodes
  '_nodes',
  '_nodes/_local',
  '_nodes/stats',
  '_nodes/hot_threads',
  '_nodes/{node}/stats',

  // Cat
  '_cat/aliases?v',
  '_cat/allocation?v',
  '_cat/count?v',
  '_cat/health?v',
  '_cat/indices?v',
  '_cat/master?v',
  '_cat/cluster_manager?v',
  '_cat/nodeattrs?v',
  '_cat/nodes?v',
  '_cat/pending_tasks?v',
  '_cat/plugins?v',
  '_cat/recovery?v',
  '_cat/repositories?v',
  '_cat/segments?v',
  '_cat/shards?v',
  '_cat/snapshots/{repo}?v',
  '_cat/templates?v',
  '_cat/thread_pool?v',

  // Snapshots
  '_snapshot',
  '_snapshot/_status',
  '_snapshot/{repository}',
  '_snapshot/{repository}/{snapshot}',
  '_snapshot/{repository}/{snapshot}/_restore',

  // Ingest
  '_ingest/pipeline',
  '_ingest/pipeline/{name}',

  // Reindex / tasks
  '_reindex',
  '_tasks',
  '_tasks/{task_id}',
  '_tasks/_cancel',

  // Misc
  '_analyze',
  '{index}/_analyze',
  '_validate/query',
  '{index}/_validate/query',
  '_search_shards',
  '{index}/_search_shards',
  '_field_caps',
  '{index}/_field_caps',
]
