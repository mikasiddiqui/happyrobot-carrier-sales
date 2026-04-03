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

function readOptionalFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function readOptionalNonNegativeInteger(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined
  }

  return Math.max(0, Math.trunc(value))
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
      readOptionalFiniteNumber(input.loadboardRate) ??
      readOptionalFiniteNumber(input.loadboard_rate),
    carrierInitialOffer:
      readOptionalFiniteNumber(input.carrierInitialOffer) ??
      readOptionalFiniteNumber(input.carrier_initial_offer),
    finalAgreedRate:
      readOptionalFiniteNumber(input.finalAgreedRate) ??
      readOptionalFiniteNumber(input.final_agreed_rate),
    negotiationRounds:
      readOptionalNonNegativeInteger(input.negotiationRounds) ??
      readOptionalNonNegativeInteger(input.negotiation_rounds),
    outcome: readOptionalString(input.outcome),
    sentiment: readOptionalString(input.sentiment),
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
