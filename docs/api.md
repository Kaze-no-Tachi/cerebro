# Cerebro API Specification

Complete API contract for Cerebro Elasticsearch GUI. All endpoints return `{ "status": int, "body": any }`.

---

## 1. Connection / Hosts

### GET `/connect/hosts`
Get configured Elasticsearch hosts.
- **Auth**: Required
- **Response**: `[string]` — array of host names

### POST `/connect`
Connect to Elasticsearch cluster.
- **Auth**: Required
- **Request**: `{ "host": string, "username"?: string, "password"?: string }`
- **Response**: Elasticsearch `_cluster/health` JSON
- **Notes**: Forwards to Elasticsearch; uses host config with optional auth override

---

## 2. Overview (Cluster Dashboard)

### POST `/overview`
Get cluster overview dashboard data.
- **Auth**: Required
- **Request**: `{ "host": string }`
- **Response**: Aggregated cluster (cluster_name, status, nodes, shards, indices[])

### POST `/overview/disable_shard_allocation`
Disable shard allocation.
- **Auth**: Required
- **Request**: `{ "host": string, "kind"?: string }`
- **Response**: Raw Elasticsearch

### POST `/overview/enable_shard_allocation`
Enable shard allocation.
- **Auth**: Required
- **Response**: Raw Elasticsearch

### POST `/overview/close_indices`
Close indices.
- **Auth**: Required
- **Request**: `{ "host": string, "indices": string (comma-delimited) }`
- **Response**: Raw Elasticsearch

### POST `/overview/open_indices`
Open closed indices.
- **Auth**: Required
- **Response**: Raw Elasticsearch

### POST `/overview/force_merge`, `/overview/clear_indices_cache`, `/overview/refresh_indices`, `/overview/flush_indices`
Index operations.
- **Auth**: Required
- **Request**: `{ "host": string, "indices": string (comma-delimited) }`
- **Response**: Raw Elasticsearch

### POST `/overview/delete_indices`
Delete indices.
- **Auth**: Required
- **Response**: Raw Elasticsearch

### POST `/overview/get_shard_stats`
Get shard stats and recovery info.
- **Auth**: Required
- **Request**: `{ "host": string, "index": string, "shard": int, "node": string }`
- **Response**: Merged shard stats + recovery data

### POST `/overview/relocate_shard`
Relocate shard to node.
- **Auth**: Required
- **Request**: `{ "host": string, "index": string, "shard": int, "from": string, "to": string }`
- **Response**: Raw Elasticsearch

---

## 3. Cluster Changes

### POST `/cluster_changes`
Get cluster event log.
- **Auth**: Required
- **Response**: Cluster changes (indices + nodes with metadata)

---

## 4. Nodes

### POST `/nodes`
Get all nodes with stats.
- **Auth**: Required
- **Response**: Array of node objects with is_master, jvm, os, fs, process stats

---

## 5. REST Client

### POST `/rest`
Get indices for autocomplete.
- **Auth**: Required
- **Response**: Object with indices array and host

### POST `/rest/request`
Execute REST request, save to history.
- **Auth**: Required
- **Request**: method, path, data
- **Response**: Raw Elasticsearch
- **Notes**: Auto-saves user-scoped request history

### POST `/rest/history`
Get request history.
- **Auth**: Required
- **Response**: Array of past requests (user-scoped)

---

## 6. Indices

### POST `/commons/indices`
Get all index names.
- **Auth**: Required
- **Response**: String array

### POST `/commons/get_index_stats`
Get index statistics.
- **Auth**: Required
- **Response**: Raw Elasticsearch

### POST `/commons/get_index_mapping`
Get index mapping (fields).
- **Auth**: Required
- **Response**: Raw Elasticsearch

### POST `/create_index/get_index_metadata`
Get index template.
- **Auth**: Required
- **Response**: Object with mappings and settings

### POST `/create_index/create`
Create index.
- **Auth**: Required
- **Response**: Raw Elasticsearch

---

## 7. Index Settings

### POST `/index_settings`
Get flattened index settings.
- **Auth**: Required
- **Response**: Raw Elasticsearch (flattened)

### POST `/index_settings/update`
Update index settings.
- **Auth**: Required
- **Response**: Raw Elasticsearch

---

## 8. Cluster Settings

### POST `/cluster_settings`
Get cluster settings.
- **Auth**: Required
- **Response**: Raw Elasticsearch

### POST `/cluster_settings/save`
Save cluster settings.
- **Auth**: Required
- **Response**: Raw Elasticsearch

---

## 9. Templates

### POST `/templates`
Get all templates.
- **Auth**: Required
- **Response**: Array of template objects

### POST `/templates/create`
Create template.
- **Auth**: Required
- **Response**: Raw Elasticsearch

### POST `/templates/delete`
Delete template.
- **Auth**: Required
- **Response**: Raw Elasticsearch

---

## 10. Aliases

### POST `/aliases/get_aliases`
Get all aliases.
- **Auth**: Required
- **Response**: Array of alias objects

### POST `/aliases/update_aliases`
Update aliases.
- **Auth**: Required
- **Response**: Raw Elasticsearch

---

## 11. Snapshots / Repositories

### POST `/repositories`
Get snapshot repositories.
- **Auth**: Required
- **Response**: Array of repository objects

### POST `/repositories/create`
Create repository.
- **Auth**: Required
- **Response**: Raw Elasticsearch

### POST `/repositories/delete`
Delete repository.
- **Auth**: Required
- **Response**: Raw Elasticsearch

### POST `/snapshots`
Get snapshots UI data.
- **Auth**: Required
- **Response**: Object with indices and repositories arrays

### POST `/snapshots/load`
Get snapshots in repo.
- **Auth**: Required
- **Response**: Array of snapshot objects

### POST `/snapshots/create`
Create snapshot.
- **Auth**: Required
- **Response**: Raw Elasticsearch

### POST `/snapshots/delete`
Delete snapshot.
- **Auth**: Required
- **Response**: Raw Elasticsearch

### POST `/snapshots/restore`
Restore snapshot.
- **Auth**: Required
- **Response**: Raw Elasticsearch

---

## 12. Analysis

### POST `/analysis/indices`
Get open indices.
- **Auth**: Required
- **Response**: String array

### POST `/analysis/analyzers`
Get index analyzers.
- **Auth**: Required
- **Response**: String array of analyzer names

### POST `/analysis/fields`
Get analyzable fields.
- **Auth**: Required
- **Response**: String array (handles nested, multi-fields)

### POST `/analysis/analyze/analyzer`
Analyze text with analyzer.
- **Auth**: Required
- **Response**: Token array

### POST `/analysis/analyze/field`
Analyze text with field.
- **Auth**: Required
- **Response**: Token array

---

## 13. Auth

### GET `/login`
Login page.
- **Auth**: Not required
- **Response**: HTML or 303 redirect

### POST `/auth/login`
Authenticate.
- **Auth**: Not required
- **Response**: 303 redirect + session cookie

### POST `/auth/logout`
Logout.
- **Auth**: Not required
- **Response**: 303 redirect to login

---

## 14. Misc.

### GET `/`
SPA entry point.
- **Auth**: Required
- **Response**: HTML

### POST `/navbar`
Get cluster health + username.
- **Auth**: Required
- **Response**: Elasticsearch health + optional username

### POST `/commons/nodes`
Get node names.
- **Auth**: Required
- **Response**: String array

### POST `/commons/get_node_stats`
Get node stats.
- **Auth**: Required
- **Response**: Raw Elasticsearch

### POST `/commons/get_index_settings`
Get index settings (raw).
- **Auth**: Required
- **Response**: Raw Elasticsearch

### POST `/cat`
Proxy to _cat API.
- **Auth**: Required
- **Response**: Raw Elasticsearch

### GET `/public/*file` and `/*file`
Static assets.
- **Auth**: Not required
- **Response**: Asset or 404

---

## Response Format

All POST endpoints return wrapper:

Standard: `{ "status": 200, "body": { "data": "here" } }`

Auth failure: `{ "status": 303, "body": null }` (HTTP 200, frontend checks status)

Error: `{ "status": 400, "body": { "error": "message" } }`

---

## Key Implementation Details

- All POST endpoints wrapped in `AuthAction` (unless auth disabled)
- Session-based auth via username cookie
- CerebroRequest parses host, username, password from request body
- Host lookup via configuration with optional header whitelist
- BaseController.process() catches exceptions, censors passwords in logs
- RestController auto-saves requests to RestHistory database (user-scoped)
- ElasticClient is single point of contact with Elasticsearch
- Models transform Elasticsearch JSON into UI-friendly shapes
- OverviewDataService aggregates multiple ES calls into single response

Generated from Scala/Play codebase: `conf/routes` (all endpoints), `app/controllers/` (request handlers), `app/models/` (response transformations).

