import type { Response } from 'express'

import type { EquipmentType } from '../types'

export function badRequest(message: string, response: Response): Response {
  return response.status(400).json({ error: message })
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function asEquipmentType(value: unknown): EquipmentType | undefined {
  return value === 'dry_van' || value === 'reefer' || value === 'flatbed'
    ? value
    : undefined
}
