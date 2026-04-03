import { Router } from 'express'

import {
  getCarriers,
  getLoads,
  listCallRecords,
  resetCallRecords,
} from '../lib/data-store'
import { parsePositiveInteger } from '../lib/request-validation'
import { requirePublicApiAuth } from '../middleware/public-auth'
import { buildDashboardSummary } from '../services/dashboard-summary'
import { buildHealthResponse } from '../services/health-response'
import { formatLane } from '../services/load-search'

export const publicRoutes = Router()

publicRoutes.get('/health', requirePublicApiAuth, async (_request, response) => {
  const [loads, carriers, calls] = await Promise.all([
    getLoads(),
    getCarriers(),
    listCallRecords(),
  ])

  response.json(
    buildHealthResponse({
      carrierCount: carriers.length,
      loadCount: loads.length,
      savedCalls: calls.length,
    }),
  )
})

publicRoutes.get('/loads', requirePublicApiAuth, async (_request, response) => {
  const loads = await getLoads()

  response.json({
    count: loads.length,
    loads: loads.map((load) => ({
      ...load,
      lane: formatLane(load),
      pickupDate: load.pickupWindowStart.slice(0, 10),
    })),
  })
})

publicRoutes.get('/calls', requirePublicApiAuth, async (request, response) => {
  const limit = parsePositiveInteger(request.query.limit, 8, { min: 1, max: 50 })
  const calls = await listCallRecords()

  response.json({
    count: Math.min(limit, calls.length),
    calls: calls.slice(0, limit),
  })
})

publicRoutes.delete('/calls', requirePublicApiAuth, async (_request, response) => {
  await resetCallRecords()
  response.json({
    ok: true,
    message: 'Saved call records cleared.',
  })
})

publicRoutes.get(
  '/dashboard/summary',
  requirePublicApiAuth,
  async (_request, response) => {
    const [records, loads] = await Promise.all([listCallRecords(), getLoads()])
    response.json(buildDashboardSummary(records, loads))
  },
)
