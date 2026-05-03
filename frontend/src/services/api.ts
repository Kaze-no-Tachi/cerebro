// Thin typed wrapper over the cerebro backend API documented in docs/api.md.
// Every endpoint returns the common envelope `{ status: int, body: any }`.
//
// On auth failure cerebro returns status 303 in the envelope (not an HTTP
// redirect) so the frontend can detect it and route to /login itself.

export interface CerebroResponse<T> {
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
  constructor(public status: number, public body: unknown) {
    super(`API ${status}`)
    this.name = 'ApiError'
  }
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
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

  const envelope: CerebroResponse<T> = await response.json()
  if (envelope.status === 303) {
    throw new AuthRequiredError()
  }
  return envelope.body
}

export const api = {
  get:    <T>(path: string) => request<T>('GET', path),
  post:   <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put:    <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}
