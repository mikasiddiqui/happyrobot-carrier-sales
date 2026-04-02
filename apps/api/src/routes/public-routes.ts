import { Router } from 'express'

import { appConfig } from '../config'
import {
  getCarriers,
  getLoads,
  listCallRecords,
  resetCallRecords,
} from '../lib/data-store'
import { requirePublicApiAuth } from '../middleware/public-auth'
import { buildDashboardSummary } from '../services/dashboard-summary'
import { formatLane } from '../services/load-search'

export const publicRoutes = Router()

publicRoutes.get('/health', requirePublicApiAuth, async (_request, response) => {
  const [loads, carriers, calls] = await Promise.all([
    getLoads(),
    getCarriers(),
    listCallRecords(),
  ])

  response.json({
    ok: true,
    service: 'happyrobot-carrier-sales-api',
    timestamp: new Date().toISOString(),
    happyRobot: {
      configured: Boolean(
        appConfig.happyRobotApiKey && appConfig.happyRobotWorkflowId,
      ),
      env: appConfig.happyRobotEnv,
      apiKeyPresent: Boolean(appConfig.happyRobotApiKey),
      workflowIdPresent: Boolean(appConfig.happyRobotWorkflowId),
    },
    seedData: {
      carrierCount: carriers.length,
      loadCount: loads.length,
      savedCalls: calls.length,
    },
    internalAuthEnabled: Boolean(appConfig.internalApiKey),
    publicAuthEnabled: Boolean(appConfig.publicApiKey),
  })
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
  const limit = Math.max(1, Math.min(Number(request.query.limit ?? 8), 50))
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
