import { appConfig } from '../config'
import { isRecord } from '../lib/http'
import type { CarrierRecord, VerifyCarrierResponse } from '../types'

const FMCSA_BASE_URL = 'https://mobile.fmcsa.dot.gov/qc/services'

interface FmcsaCarrierSnapshot {
  allowToOperate?: boolean
  outOfService?: boolean
  outOfServiceDate?: string
  dotNumber?: string
  mcNumber?: string
  legalName?: string
  dbaName?: string
}

type FmcsaLookupResult =
  | {
      kind: 'found'
      snapshot: FmcsaCarrierSnapshot
    }
  | {
      kind: 'not_found'
    }
  | {
      kind: 'unavailable'
      reason: string
    }

export function normalizeMcNumber(input: string): string {
  return input.replace(/\D/g, '')
}

export async function verifyCarrier(
  carriers: CarrierRecord[],
  mcNumberInput: string,
): Promise<VerifyCarrierResponse> {
  const mcNumber = normalizeMcNumber(mcNumberInput)

  if (mcNumber.length === 0) {
    return {
      eligible: false,
      carrier_name: null,
      mc_number: mcNumber,
      status: 'invalid_format',
      reason: 'MC number must contain at least one digit.',
    }
  }

  const seedCarrier = findSeedCarrier(carriers, mcNumber)

  if (!appConfig.fmcsaApiKey) {
    return (
      buildSeedFallback(seedCarrier, mcNumber, 'FMCSA_API_KEY is not configured.') ??
      buildUnavailableVerification(
        mcNumber,
        'FMCSA verification is not configured. Add an FMCSA WebKey before booking this carrier.',
      )
    )
  }

  const lookupResult = await lookupCarrierInFmcsa(mcNumber, appConfig.fmcsaApiKey)

  if (lookupResult.kind === 'found') {
    return mapFmcsaVerification(lookupResult.snapshot, seedCarrier, mcNumber)
  }

  if (lookupResult.kind === 'not_found') {
    return (
      buildSeedFallback(seedCarrier, mcNumber, 'FMCSA returned no live carrier for this MC number.') ??
      {
        eligible: false,
        carrier_name: null,
        mc_number: mcNumber,
        status: 'not_found',
        reason: 'FMCSA did not return a carrier for this MC number.',
      }
    )
  }

  return (
    buildSeedFallback(seedCarrier, mcNumber, lookupResult.reason) ??
    buildUnavailableVerification(
      mcNumber,
      'FMCSA verification is currently unavailable. Confirm the WebKey and retry before booking this carrier.',
    )
  )
}

function findSeedCarrier(
  carriers: CarrierRecord[],
  mcNumber: string,
): CarrierRecord | undefined {
  return carriers.find((candidate) => candidate.mcNumber === mcNumber)
}

function buildSeedFallback(
  carrier: CarrierRecord | undefined,
  mcNumber: string,
  failureReason: string,
): VerifyCarrierResponse | null {
  if (!carrier || !appConfig.enableSeedCarrierFallback) {
    return null
  }

  console.warn(
    `[carrier-verification] Falling back to seeded carrier data for MC ${mcNumber}: ${failureReason}`,
  )

  return buildSeedVerification(carrier, mcNumber)
}

function buildSeedVerification(
  carrier: CarrierRecord,
  mcNumber: string,
): VerifyCarrierResponse {
  if (!carrier.eligible) {
    return {
      eligible: false,
      carrier_name: carrier.carrierName,
      mc_number: mcNumber,
      status: carrier.status,
      reason:
        carrier.reasonIfIneligible ??
        'Carrier is not currently approved to book this freight.',
      equipment_types: carrier.equipmentTypes,
    }
  }

  return {
    eligible: true,
    carrier_name: carrier.carrierName,
    mc_number: mcNumber,
    status: carrier.status,
    reason: 'Authority is active and insurance is on file.',
    equipment_types: carrier.equipmentTypes,
  }
}

function buildUnavailableVerification(
  mcNumber: string,
  reason: string,
): VerifyCarrierResponse {
  return {
    eligible: false,
    carrier_name: null,
    mc_number: mcNumber,
    status: 'verification_unavailable',
    reason,
  }
}

async function lookupCarrierInFmcsa(
  mcNumber: string,
  webKey: string,
): Promise<FmcsaLookupResult> {
  const url = new URL(`${FMCSA_BASE_URL}/carriers/docket-number/${mcNumber}`)
  url.searchParams.set('webKey', webKey)

  let response: Response

  try {
    response = await fetch(url, {
      headers: {
        accept: 'application/json',
      },
    })
  } catch (error) {
    return {
      kind: 'unavailable',
      reason:
        error instanceof Error
          ? error.message
          : 'Unable to reach the FMCSA API.',
    }
  }

  if (response.status === 404) {
    return { kind: 'not_found' }
  }

  const rawBody = await response.text()

  if (!response.ok) {
    return {
      kind: 'unavailable',
      reason: `FMCSA request failed with status ${response.status}.`,
    }
  }

  if (rawBody.trim().length === 0) {
    return { kind: 'not_found' }
  }

  let payload: unknown

  try {
    payload = JSON.parse(rawBody)
  } catch {
    return {
      kind: 'unavailable',
      reason: 'FMCSA returned a non-JSON response.',
    }
  }

  const snapshot = findFmcsaCarrierSnapshot(payload)

  if (!snapshot) {
    return { kind: 'not_found' }
  }

  return {
    kind: 'found',
    snapshot,
  }
}

function findFmcsaCarrierSnapshot(payload: unknown): FmcsaCarrierSnapshot | null {
  return walkCarrierSnapshot(payload, new Set<object>())
}

function walkCarrierSnapshot(
  value: unknown,
  visited: Set<object>,
): FmcsaCarrierSnapshot | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const snapshot = walkCarrierSnapshot(item, visited)

      if (snapshot) {
        return snapshot
      }
    }

    return null
  }

  if (!isRecord(value)) {
    return null
  }

  if (visited.has(value)) {
    return null
  }

  visited.add(value)

  if (looksLikeFmcsaCarrierRecord(value)) {
    return {
      allowToOperate: normalizeYesNo(value.allowToOperate),
      outOfService: normalizeYesNo(value.outOfService),
      outOfServiceDate: readOptionalString(value.outOfServiceDate),
      dotNumber: readOptionalIdentifier(value.dotNumber),
      mcNumber: readOptionalIdentifier(value.mcNumber),
      legalName: readOptionalString(value.legalName),
      dbaName: readOptionalString(value.dbaName),
    }
  }

  for (const nestedValue of Object.values(value)) {
    const snapshot = walkCarrierSnapshot(nestedValue, visited)

    if (snapshot) {
      return snapshot
    }
  }

  return null
}

function looksLikeFmcsaCarrierRecord(value: Record<string, unknown>): boolean {
  const hasIdentity =
    value.mcNumber !== undefined ||
    value.dotNumber !== undefined ||
    value.legalName !== undefined ||
    value.dbaName !== undefined
  const hasStatusSignal =
    value.allowToOperate !== undefined || value.outOfService !== undefined

  return hasIdentity && hasStatusSignal
}

function normalizeYesNo(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim().toUpperCase()

  if (normalized === 'Y' || normalized === 'YES' || normalized === 'TRUE') {
    return true
  }

  if (normalized === 'N' || normalized === 'NO' || normalized === 'FALSE') {
    return false
  }

  return undefined
}

function readOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

function readOptionalIdentifier(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  return readOptionalString(value)
}

function mapFmcsaVerification(
  snapshot: FmcsaCarrierSnapshot,
  seedCarrier: CarrierRecord | undefined,
  requestedMcNumber: string,
): VerifyCarrierResponse {
  const carrierName =
    snapshot.legalName ?? snapshot.dbaName ?? seedCarrier?.carrierName ?? null
  const mcNumber =
    normalizeMcNumber(snapshot.mcNumber ?? requestedMcNumber) || requestedMcNumber
  const equipmentTypes = seedCarrier?.equipmentTypes

  if (snapshot.outOfService === true) {
    const outOfServiceReason = snapshot.outOfServiceDate
      ? `FMCSA lists this carrier as out of service as of ${snapshot.outOfServiceDate}.`
      : 'FMCSA lists this carrier as out of service.'

    return {
      eligible: false,
      carrier_name: carrierName,
      mc_number: mcNumber,
      status: 'out_of_service',
      reason: outOfServiceReason,
      equipment_types: equipmentTypes,
    }
  }

  if (snapshot.allowToOperate === true) {
    return {
      eligible: true,
      carrier_name: carrierName,
      mc_number: mcNumber,
      status: 'active',
      reason: 'FMCSA reports this carrier is allowed to operate.',
      equipment_types: equipmentTypes,
    }
  }

  if (snapshot.allowToOperate === false) {
    return {
      eligible: false,
      carrier_name: carrierName,
      mc_number: mcNumber,
      status: 'inactive',
      reason: 'FMCSA does not show this carrier as allowed to operate.',
      equipment_types: equipmentTypes,
    }
  }

  return {
    eligible: false,
    carrier_name: carrierName,
    mc_number: mcNumber,
    status: 'review_required',
    reason:
      'FMCSA returned the carrier record, but its operating status could not be confirmed automatically.',
    equipment_types: equipmentTypes,
  }
}
