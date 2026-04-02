import { Router } from 'express'

import { appendCallRecord, getCarriers, getLoads } from '../lib/data-store'
import { badRequest, isRecord } from '../lib/http'
import { requireInternalAuth } from '../middleware/internal-auth'
import { normalizeIncomingCallPayload } from '../services/call-payload'
import {
  normalizeMcNumber,
  verifyCarrier,
} from '../services/carrier-verification'
import { searchLoads } from '../services/load-search'
import { negotiateOffer } from '../services/negotiation'
import type {
  CreateCallRecordRequest,
  MockTransferRequest,
  NegotiateOfferRequest,
  SearchLoadsRequest,
  VerifyCarrierRequest,
} from '../types'

export const workflowRoutes = Router()

workflowRoutes.use(requireInternalAuth)

workflowRoutes.post('/carriers/verify', async (request, response) => {
  if (!isRecord(request.body)) {
    badRequest('Request body must be a JSON object.', response)
    return
  }

  const body = request.body as Partial<VerifyCarrierRequest>

  if (typeof body.mc_number !== 'string' || body.mc_number.trim().length === 0) {
    badRequest('mc_number is required.', response)
    return
  }

  const carriers = await getCarriers()
  response.json(await verifyCarrier(carriers, body.mc_number))
})

workflowRoutes.post('/loads/search', async (request, response) => {
  if (!isRecord(request.body)) {
    badRequest('Request body must be a JSON object.', response)
    return
  }

  const body = request.body as SearchLoadsRequest
  const loads = await getLoads()

  response.json(
    searchLoads(loads, {
      origin: typeof body.origin === 'string' ? body.origin : undefined,
      destination: typeof body.destination === 'string' ? body.destination : undefined,
      equipment_type: body.equipment_type,
      pickup_date: typeof body.pickup_date === 'string' ? body.pickup_date : undefined,
    }),
  )
})

workflowRoutes.post('/offers/negotiate', async (request, response) => {
  if (!isRecord(request.body)) {
    badRequest('Request body must be a JSON object.', response)
    return
  }

  const body = request.body as Partial<NegotiateOfferRequest>

  if (typeof body.load_id !== 'string' || body.load_id.trim().length === 0) {
    badRequest('load_id is required.', response)
    return
  }

  if (typeof body.carrier_offer !== 'number' || Number.isNaN(body.carrier_offer)) {
    badRequest('carrier_offer must be a valid number.', response)
    return
  }

  if (typeof body.round_number !== 'number' || Number.isNaN(body.round_number)) {
    badRequest('round_number must be a valid number.', response)
    return
  }

  const loads = await getLoads()
  const load = loads.find((candidate) => candidate.id === body.load_id)

  if (!load) {
    response.status(404).json({ error: `Load ${body.load_id} was not found.` })
    return
  }

  response.json(
    negotiateOffer(load, {
      load_id: load.id,
      carrier_offer: body.carrier_offer,
      round_number: body.round_number,
    }),
  )
})

workflowRoutes.post('/mock-transfer', async (request, response) => {
  if (!isRecord(request.body)) {
    badRequest('Request body must be a JSON object.', response)
    return
  }

  const body = request.body as Partial<MockTransferRequest>

  if (typeof body.load_id !== 'string' || body.load_id.trim().length === 0) {
    badRequest('load_id is required.', response)
    return
  }

  if (typeof body.final_rate !== 'number' || Number.isNaN(body.final_rate)) {
    badRequest('final_rate must be a valid number.', response)
    return
  }

  const loads = await getLoads()
  const load = loads.find((candidate) => candidate.id === body.load_id)

  if (!load) {
    response.status(404).json({ error: `Load ${body.load_id} was not found.` })
    return
  }

  response.json({
    success: true,
    load_id: load.id,
    final_rate: body.final_rate,
    message: `Transfer completed successfully for ${load.id} at $${body.final_rate}.`,
  })
})

workflowRoutes.post('/calls', async (request, response) => {
  if (!isRecord(request.body)) {
    badRequest('Request body must be a JSON object.', response)
    return
  }

  const payload = normalizeIncomingCallPayload(
    request.body as CreateCallRecordRequest & Record<string, unknown>,
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
