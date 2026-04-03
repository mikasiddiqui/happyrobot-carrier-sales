import { asEquipmentType, badRequest, isRecord } from './http'
import type { EquipmentType } from '../types'

type RequestRecord = Record<string, unknown>

export function ensureRecordBody(value: unknown): RequestRecord {
  if (!isRecord(value)) {
    throw badRequest('Request body must be a JSON object.')
  }

  return value
}

export function readRequiredTrimmedString(
  record: RequestRecord,
  key: string,
  message = `${key} is required.`,
): string {
  const value = record[key]

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw badRequest(message)
  }

  return value.trim()
}

export function readOptionalTrimmedString(
  record: RequestRecord,
  key: string,
): string | undefined {
  const value = record[key]

  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

export function readRequiredFiniteNumber(
  record: RequestRecord,
  key: string,
  message = `${key} must be a valid number.`,
): number {
  const value = record[key]

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw badRequest(message)
  }

  return value
}

export function readRequiredInteger(
  record: RequestRecord,
  key: string,
  message = `${key} must be a valid integer.`,
): number {
  const value = readRequiredFiniteNumber(record, key, message)

  if (!Number.isInteger(value)) {
    throw badRequest(message)
  }

  return value
}

export function readOptionalEquipmentType(
  record: RequestRecord,
  key: string,
): EquipmentType | undefined {
  const value = record[key]

  if (value === undefined || value === null || value === '') {
    return undefined
  }

  const equipmentType = asEquipmentType(value)

  if (!equipmentType) {
    throw badRequest(`${key} must be one of: dry_van, reefer, flatbed.`)
  }

  return equipmentType
}

export function readOptionalIsoDate(
  record: RequestRecord,
  key: string,
): string | undefined {
  const value = readOptionalTrimmedString(record, key)

  if (!value) {
    return undefined
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw badRequest(`${key} must be a date in YYYY-MM-DD format.`)
  }

  return value
}

export function parsePositiveInteger(
  value: unknown,
  fallback: number,
  options?: {
    min?: number
    max?: number
  },
): number {
  const min = options?.min ?? 1
  const max = options?.max ?? Number.MAX_SAFE_INTEGER
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim().length > 0
        ? Number.parseInt(value, 10)
        : Number.NaN

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return fallback
  }

  return parsed
}
