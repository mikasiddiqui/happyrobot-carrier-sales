import { Router } from 'express'

import { appendCallRecord, getCarriers, getLoads } from '../lib/data-store'
import { requireInternalAuth } from '../middleware/internal-auth'
import { normalizeIncomingCallPayload } from '../services/call-payload'
import {
  normalizeMcNumber,
  verifyCarrier,
} from '../services/carrier-verification'
import { searchLoads } from '../services/load-search'
import { negotiateOffer } from '../services/negotiation'
import {
  ensureRecordBody,
  readOptionalEquipmentType,
  readOptionalIsoDate,
  readOptionalTrimmedString,
  readRequiredFiniteNumber,
  readRequiredInteger,
  readRequiredTrimmedString,
} from '../lib/request-validation'
import type {
  CreateCallRecordRequest,
} from '../types'

export const workflowRoutes = Router()

workflowRoutes.use(requireInternalAuth)

workflowRoutes.post('/carriers/verify', async (request, response) => {
  const body = ensureRecordBody(request.body)
  const mcNumber = readRequiredTrimmedString(body, 'mc_number', 'mc_number is required.')

  const carriers = await getCarriers()
  response.json(await verifyCarrier(carriers, mcNumber))
})

workflowRoutes.post('/loads/search', async (request, response) => {
  const body = ensureRecordBody(request.body)
  const loads = await getLoads()

  response.json(
    searchLoads(loads, {
      origin: readOptionalTrimmedString(body, 'origin'),
      destination: readOptionalTrimmedString(body, 'destination'),
      equipment_type: readOptionalEquipmentType(body, 'equipment_type'),
      pickup_date: readOptionalIsoDate(body, 'pickup_date'),
    }),
  )
})

workflowRoutes.post('/offers/negotiate', async (request, response) => {
  const body = ensureRecordBody(request.body)
  const loadId = readRequiredTrimmedString(body, 'load_id', 'load_id is required.')
  const carrierOffer = readRequiredFiniteNumber(
    body,
    'carrier_offer',
    'carrier_offer must be a valid number.',
  )
  const roundNumber = readRequiredInteger(
    body,
    'round_number',
    'round_number must be a valid integer.',
  )

  const loads = await getLoads()
  const load = loads.find((candidate) => candidate.id === loadId)

  if (!load) {
    response.status(404).json({ error: `Load ${loadId} was not found.` })
    return
  }

  response.json(
    negotiateOffer(load, {
      load_id: load.id,
      carrier_offer: carrierOffer,
      round_number: roundNumber,
    }),
  )
})

workflowRoutes.post('/mock-transfer', async (request, response) => {
  const body = ensureRecordBody(request.body)
  const loadId = readRequiredTrimmedString(body, 'load_id', 'load_id is required.')
  const finalRate = readRequiredFiniteNumber(
    body,
    'final_rate',
    'final_rate must be a valid number.',
  )

  const loads = await getLoads()
  const load = loads.find((candidate) => candidate.id === loadId)

  if (!load) {
    response.status(404).json({ error: `Load ${loadId} was not found.` })
    return
  }

  response.json({
    success: true,
    load_id: load.id,
    final_rate: finalRate,
    message: `Transfer completed successfully for ${load.id} at $${finalRate}.`,
  })
})

workflowRoutes.post('/calls', async (request, response) => {
  const body = ensureRecordBody(request.body)
  const payload = normalizeIncomingCallPayload(
    body as CreateCallRecordRequest & Record<string, unknown>,
  )
  const loads = await getLoads()
  const load = payload.loadId
    ? loads.find((candidate) => candidate.id === payload.loadId)
    : undefined

  const record = await appendCallRecord({
    ...payload,
    carrierMcNumber:
      typeof payload.carrierMcNumber === 'string'
        ? normalizeMcNumber(payload.carrierMcNumber)
        : undefined,
    loadboardRate: payload.loadboardRate ?? load?.loadboardRate,
  })

  response.status(201).json(record)
})
