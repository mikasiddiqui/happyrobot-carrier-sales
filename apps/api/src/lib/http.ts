import { timingSafeEqual } from 'crypto'

import type { EquipmentType } from '../types'

export class HttpError extends Error {
  readonly statusCode: number
  readonly expose: boolean

  constructor(
    statusCode: number,
    message: string,
    options?: {
      cause?: unknown
      expose?: boolean
    },
  ) {
    super(message)
    this.name = 'HttpError'
    this.statusCode = statusCode
    this.expose = options?.expose ?? statusCode < 500

    if (options?.cause !== undefined) {
      this.cause = options.cause
    }
  }
}

export function httpError(
  statusCode: number,
  message: string,
  options?: {
    cause?: unknown
    expose?: boolean
  },
): HttpError {
  return new HttpError(statusCode, message, options)
}

export function badRequest(message: string): HttpError {
  return httpError(400, message)
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function asEquipmentType(value: unknown): EquipmentType | undefined {
  return value === 'dry_van' || value === 'reefer' || value === 'flatbed'
    ? value
    : undefined
}

export function secureCompare(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual)
  const expectedBuffer = Buffer.from(expected)

  if (actualBuffer.length !== expectedBuffer.length) {
    return false
  }

  return timingSafeEqual(actualBuffer, expectedBuffer)
}
