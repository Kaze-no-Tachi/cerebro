// Thin typed wrapper over the cerebro backend API documented in docs/api.md.
// Every endpoint returns the common envelope `{ status: int, body: any }`.
//
// Two layers of auth to be aware of:
//   - status 303 = cerebro itself requires login (LDAP / basic). Always thrown
//     as AuthRequiredError so the app router can redirect to /login.
//   - status 401 = the upstream Elasticsearch / OpenSearch cluster requires
//     auth. Surfaced via the envelope so the Connect view can prompt for
//     cluster credentials.
//
// Non-2xx HTTP responses (network / Play errors) throw ApiError.

export interface CerebroEnvelope<T> {
  status: number
  body: T
}

export class AuthRequiredError extends Error {
  constructor() {
    super('Authentication required')
    this.name = 'AuthRequiredError'
  }
}

export class ApiError extends Error {
  status: number
  body: unknown
  constructor(status: number, body: unknown) {
    super(`API ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<CerebroEnvelope<T>> {
  const response = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new ApiError(response.status, text)
  }

  const envelope: CerebroEnvelope<T> = await response.json()
  if (envelope.status === 303) throw new AuthRequiredError()
  return envelope
}

export const api = {
  get:    <T>(path: string) => request<T>('GET', path),
  post:   <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put:    <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}

// Convenience: returns only the body, throwing on non-2xx envelope status.
// Use for endpoints whose only failure mode is "actually failed."
export async function unwrap<T>(p: Promise<CerebroEnvelope<T>>): Promise<T> {
  const env = await p
  if (env.status >= 200 && env.status < 300) return env.body
  throw new ApiError(env.status, env.body)
}
