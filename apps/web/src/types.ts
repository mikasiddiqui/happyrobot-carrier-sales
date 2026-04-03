export interface HealthResponse {
  ok: boolean
  service: string
  timestamp: string
  happyRobot: {
    configured: boolean
    env: string
  }
  seedData: {
    carrierCount: number
    loadCount: number
    savedCalls: number
  }
}

export interface VoiceTokenResponse {
  url: string
  token: string
  room_name: string
  run_id: string
}

export interface DashboardSummary {
  totalCalls: number
  bookedLoads: number
  eligibleCarrierCalls: number
  disconnectedCalls: number
  followupRequiredCalls: number
  closeRateOnQualifiedCalls: number | null
  averageBookedRate: number | null
  averageNegotiationRoundsOnBookedCalls: number | null
  averageConcessionDelta: number | null
  outcomeBreakdown: Record<string, number>
  sentimentBreakdown: Record<string, number>
}

export interface CallRecord {
  id: string
  createdAt: string
  runId?: string
  carrierName?: string
  carrierMcNumber?: string
  loadId?: string
  finalAgreedRate?: number
  negotiationRounds: number
  outcome: string
  sentiment: string
}

export interface LoadRecord {
  id: string
  lane: string
  equipmentType: string
  pickupDate: string
  loadboardRate: number
  minimumRate: number
  commodityType: string
}

export interface DashboardPayload {
  summary: DashboardSummary | null
  calls: CallRecord[]
  loads: LoadRecord[]
}

export type CallStatus =
  | 'idle'
  | 'requesting_token'
  | 'connecting'
  | 'live'
  | 'ended'
  | 'error'

export interface StartCallInput {
  callerName: string
  brokerName: string
  scenario: string
}
