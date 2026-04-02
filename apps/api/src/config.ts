import dotenv from 'dotenv'
import { HappyRobotClient } from '@happyrobot-ai/sdk'

import type { AppEnvironment } from './types'

dotenv.config()

const port = Number(process.env.PORT ?? 3001)
const happyRobotApiKey = (process.env.HAPPYROBOT_API_KEY ?? '').trim()
const happyRobotWorkflowId = (process.env.HAPPYROBOT_WORKFLOW_ID ?? '').trim()
const happyRobotEnv = ((process.env.HAPPYROBOT_ENV ?? 'development').trim() ||
  'development') as AppEnvironment
const fmcsaApiKey = (process.env.FMCSA_API_KEY ?? '').trim()
const internalApiKey = (process.env.API_INTERNAL_KEY ?? '').trim()
const publicApiKey = (process.env.API_PUBLIC_KEY ?? '').trim()
const corsAllowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const enableSeedCarrierFallback =
  (process.env.ENABLE_SEED_CARRIER_FALLBACK ??
    (happyRobotEnv === 'production' ? 'false' : 'true')) === 'true'

export const appConfig = {
  port,
  internalApiKey,
  publicApiKey,
  fmcsaApiKey,
  corsAllowedOrigins,
  enableSeedCarrierFallback,
  happyRobotApiKey,
  happyRobotWorkflowId,
  happyRobotEnv,
}

export const happyRobotClient = happyRobotApiKey
  ? new HappyRobotClient({ apiKey: happyRobotApiKey })
  : null

let resolvedWorkflowIdPromise: Promise<string> | null = null

export function isHappyRobotConfigured(): boolean {
  return Boolean(happyRobotClient && appConfig.happyRobotWorkflowId)
}

export async function resolveHappyRobotWorkflowId(): Promise<string> {
  if (!happyRobotClient || !appConfig.happyRobotWorkflowId) {
    throw new Error('HappyRobot workflow is not configured.')
  }

  if (!resolvedWorkflowIdPromise) {
    resolvedWorkflowIdPromise = happyRobotClient.workflows
      .get(appConfig.happyRobotWorkflowId)
      .then((workflow) => workflow.id)
  }

  return resolvedWorkflowIdPromise
}
