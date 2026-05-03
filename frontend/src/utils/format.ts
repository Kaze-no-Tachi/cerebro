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
