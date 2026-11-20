import { COUNTRY_NAMES } from './tokens'

export async function fetchWithRetry(url: string, retries = 5, delayMs = 2000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url)
    // retry on 401 (Payload session not ready) and 404 (Turbopack cold-start compile delay)
    if ((res.status !== 401 && res.status !== 404) || i === retries - 1) return res
    await new Promise((r) => setTimeout(r, delayMs))
  }
  return fetch(url)
}

export function fmt(n: number): string {
  return n.toLocaleString()
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (days  > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins  > 0) return `${mins}m ago`
  return 'just now'
}

export function countryName(code: string | null): string {
  if (!code) return 'Unknown'
  return COUNTRY_NAMES[code.toUpperCase()] ?? code.toUpperCase()
}
