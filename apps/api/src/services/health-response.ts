import { appConfig } from '../config'

export interface PublicHealthResponse {
  ok: boolean
  service: string
  timestamp: string
  happyRobot: {
    configured: boolean
    env: string
  }
  seedData: {
    carrierCount: number
    loadCount: number
    savedCalls: number
  }
}

export function buildHealthResponse(seedData: {
  carrierCount: number
  loadCount: number
  savedCalls: number
}): PublicHealthResponse {
  return {
    ok: true,
    service: 'happyrobot-carrier-sales-api',
    timestamp: new Date().toISOString(),
    happyRobot: {
      configured: Boolean(appConfig.happyRobotApiKey && appConfig.happyRobotWorkflowId),
      env: appConfig.happyRobotEnv,
    },
    seedData,
  }
}
