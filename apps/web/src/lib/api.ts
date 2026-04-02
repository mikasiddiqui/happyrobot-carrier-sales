import type {
  CallRecord,
  DashboardSummary,
  HealthResponse,
  LoadRecord,
  VoiceTokenResponse,
} from '../types'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''
const apiPublicKey = import.meta.env.VITE_API_PUBLIC_KEY ?? ''

function apiUrl(path: string): string {
  return apiBaseUrl ? `${apiBaseUrl}${path}` : path
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)

  if (apiPublicKey && !headers.has('x-api-key')) {
    headers.set('x-api-key', apiPublicKey)
  }

  const response = await fetch(apiUrl(path), {
    ...init,
    headers,
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string; details?: string }
      | null
    throw new Error(payload?.details ?? payload?.error ?? `Request failed for ${path}.`)
  }

  return (await response.json()) as T
}

export function fetchHealth(): Promise<HealthResponse> {
  return fetchJson<HealthResponse>('/api/health')
}

export function fetchDashboardSummary(): Promise<DashboardSummary> {
  return fetchJson<DashboardSummary>('/api/dashboard/summary')
}

export async function fetchRecentCalls(limit = 5): Promise<CallRecord[]> {
  const payload = await fetchJson<{ calls: CallRecord[] }>(`/api/calls?limit=${limit}`)
  return payload.calls
}

export async function fetchLoads(limit = 4): Promise<LoadRecord[]> {
  const payload = await fetchJson<{ loads: LoadRecord[] }>('/api/loads')
  return payload.loads.slice(0, limit)
}

export function resetSavedCalls(): Promise<{ ok: boolean; message: string }> {
  return fetchJson<{ ok: boolean; message: string }>('/api/calls', {
    method: 'DELETE',
  })
}

export function createVoiceToken(body: {
  callerName: string
  brokerName: string
  scenario: string
}): Promise<VoiceTokenResponse> {
  return fetchJson<VoiceTokenResponse>('/api/voice/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}
