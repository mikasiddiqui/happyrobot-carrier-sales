import { asEquipmentType } from '../lib/http'
import type { CreateCallRecordRequest } from '../types'

function readOptionalString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const normalized = value.trim()
    return normalized.length > 0 ? normalized : undefined
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  return undefined
}

export function normalizeIncomingCallPayload(
  input: CreateCallRecordRequest & Record<string, unknown>,
): CreateCallRecordRequest {
  return {
    runId:
      readOptionalString(input.runId) ??
      readOptionalString(input.run_id),
    carrierMcNumber:
      readOptionalString(input.carrierMcNumber) ??
      readOptionalString(input.carrier_mc_number),
    carrierName:
      readOptionalString(input.carrierName) ??
      readOptionalString(input.carrier_name),
    carrierEligible:
      typeof input.carrierEligible === 'boolean'
        ? input.carrierEligible
        : typeof input.carrier_eligible === 'boolean'
          ? input.carrier_eligible
          : undefined,
    loadId:
      readOptionalString(input.loadId) ??
      readOptionalString(input.load_id),
    equipmentType: asEquipmentType(input.equipmentType ?? input.equipment_type),
    loadboardRate:
      typeof input.loadboardRate === 'number'
        ? input.loadboardRate
        : typeof input.loadboard_rate === 'number'
          ? input.loadboard_rate
          : undefined,
    carrierInitialOffer:
      typeof input.carrierInitialOffer === 'number'
        ? input.carrierInitialOffer
        : typeof input.carrier_initial_offer === 'number'
          ? input.carrier_initial_offer
          : undefined,
    finalAgreedRate:
      typeof input.finalAgreedRate === 'number'
        ? input.finalAgreedRate
        : typeof input.final_agreed_rate === 'number'
          ? input.final_agreed_rate
          : undefined,
    negotiationRounds:
      typeof input.negotiationRounds === 'number'
        ? input.negotiationRounds
        : typeof input.negotiation_rounds === 'number'
          ? input.negotiation_rounds
          : undefined,
    outcome: typeof input.outcome === 'string' ? input.outcome : undefined,
    sentiment: typeof input.sentiment === 'string' ? input.sentiment : undefined,
    summary:
      readOptionalString(input.summary) ??
      readOptionalString(input.call_summary),
    accepted: typeof input.accepted === 'boolean' ? input.accepted : undefined,
    rejectionReason:
      readOptionalString(input.rejectionReason) ??
      readOptionalString(input.rejection_reason),
    needsHumanFollowup:
      typeof input.needsHumanFollowup === 'boolean'
        ? input.needsHumanFollowup
        : typeof input.needs_human_followup === 'boolean'
          ? input.needs_human_followup
          : undefined,
  }
}
