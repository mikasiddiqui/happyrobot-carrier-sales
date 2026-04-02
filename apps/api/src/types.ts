export type AppEnvironment = 'development' | 'staging' | 'production'
export type EquipmentType = 'dry_van' | 'reefer' | 'flatbed'

export interface LoadLocation {
  city: string
  state: string
}

export interface CarrierRecord {
  mcNumber: string
  carrierName: string
  status: string
  eligible: boolean
  equipmentTypes: EquipmentType[]
  insuranceOnFile: boolean
  authorityActive: boolean
  safetyRating: string
  notes: string
  reasonIfIneligible?: string
}

export interface LoadRecord {
  id: string
  referenceNumber: string
  origin: LoadLocation
  destination: LoadLocation
  pickupWindowStart: string
  pickupWindowEnd: string
  deliveryWindowEnd: string
  equipmentType: EquipmentType
  loadboardRate: number
  minimumRate: number
  miles: number
  weightLbs: number
  commodityType: string
  numPieces: number
  dimensions: string
  deadheadHintMiles: number
  notes: string
}

export interface VerifyCarrierRequest {
  mc_number: string
}

export interface VerifyCarrierResponse {
  eligible: boolean
  carrier_name: string | null
  mc_number: string
  status: string
  reason: string
  equipment_types?: EquipmentType[]
}

export interface SearchLoadsRequest {
  origin?: string
  destination?: string
  equipment_type?: EquipmentType
  pickup_date?: string
}

export interface RankedLoad extends LoadRecord {
  score: number
  lane: string
  pickupDate: string
  matchReasons: string[]
}

export interface SearchLoadsResponse {
  count: number
  loads: RankedLoad[]
}

export interface NegotiateOfferRequest {
  load_id: string
  carrier_offer: number
  round_number: number
}

export interface NegotiateOfferResponse {
  decision: 'accept' | 'counter' | 'reject'
  counter_offer: number | null
  message_hint: string
  rounds_remaining: number
  load_id: string
  loadboard_rate: number
  minimum_rate: number
}

export interface MockTransferRequest {
  load_id: string
  final_rate: number
}

export interface MockTransferResponse {
  success: boolean
  load_id: string
  final_rate: number
  message: string
}

export interface StoredCallRecord {
  id: string
  createdAt: string
  updatedAt: string
  runId?: string
  carrierMcNumber?: string
  carrierName?: string
  carrierEligible?: boolean
  loadId?: string
  equipmentType?: EquipmentType
  loadboardRate?: number
  carrierInitialOffer?: number
  finalAgreedRate?: number
  negotiationRounds: number
  outcome: string
  sentiment: string
  summary?: string
  accepted?: boolean
  rejectionReason?: string
  needsHumanFollowup?: boolean
}

export interface CreateCallRecordRequest {
  runId?: string
  carrierMcNumber?: string
  carrierName?: string
  carrierEligible?: boolean
  loadId?: string
  equipmentType?: EquipmentType
  loadboardRate?: number
  carrierInitialOffer?: number
  finalAgreedRate?: number
  negotiationRounds?: number
  outcome?: string
  sentiment?: string
  summary?: string
  accepted?: boolean
  rejectionReason?: string
  needsHumanFollowup?: boolean
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
