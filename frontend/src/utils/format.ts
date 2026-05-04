// Display-only formatters shared across views.

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || isNaN(bytes)) return '—'
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB', 'PB']
  let size = bytes / 1024
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(size >= 100 ? 0 : size >= 10 ? 1 : 2)} ${units[unitIndex]}`
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—'
  return n.toLocaleString()
}

export function formatPercent(n: number | null | undefined, digits = 0): string {
  if (n == null || isNaN(n)) return '—'
  return `${n.toFixed(digits)}%`
}

// "1d 4h 32m" for a millisecond duration. Used by the Nodes view to render
// `uptime`, which the backend returns as raw ms.
export function formatDuration(ms: number | null | undefined): string {
  if (ms == null || isNaN(ms) || ms < 0) return '—'
  const sec = Math.floor(ms / 1000)
  const days = Math.floor(sec / 86400)
  const hours = Math.floor((sec % 86400) / 3600)
  const mins = Math.floor((sec % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  if (mins > 0) return `${mins}m`
  return `${sec}s`
}
