import dotenv from 'dotenv'
import { HappyRobotClient } from '@happyrobot-ai/sdk'

import type { AppEnvironment } from './types'

dotenv.config()

function parsePort(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10)

  if (Number.isInteger(parsed) && parsed > 0 && parsed <= 65535) {
    return parsed
  }

  return fallback
}

function parseEnvironment(value: string | undefined): AppEnvironment {
  if (value === 'development' || value === 'staging' || value === 'production') {
    return value
  }

  return 'development'
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  const normalized = (value ?? '').trim().toLowerCase()

  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true
  }

  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false
  }

  return fallback
}

const port = parsePort(process.env.PORT, 3001)
const happyRobotApiKey = (process.env.HAPPYROBOT_API_KEY ?? '').trim()
const happyRobotWorkflowId = (process.env.HAPPYROBOT_WORKFLOW_ID ?? '').trim()
const happyRobotEnv = parseEnvironment((process.env.HAPPYROBOT_ENV ?? '').trim())
const fmcsaApiKey = (process.env.FMCSA_API_KEY ?? '').trim()
const internalApiKey = (process.env.API_INTERNAL_KEY ?? '').trim()
const publicApiKey = (process.env.API_PUBLIC_KEY ?? '').trim()
const corsAllowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const enableSeedCarrierFallback = parseBoolean(
  process.env.ENABLE_SEED_CARRIER_FALLBACK,
  happyRobotEnv !== 'production',
)

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

export function isProductionLike(): boolean {
  return process.env.NODE_ENV === 'production' || appConfig.happyRobotEnv === 'production'
}

export async function resolveHappyRobotWorkflowId(): Promise<string> {
  if (!happyRobotClient || !appConfig.happyRobotWorkflowId) {
    throw new Error('HappyRobot workflow is not configured.')
  }

  if (!resolvedWorkflowIdPromise) {
    resolvedWorkflowIdPromise = happyRobotClient.workflows
      .get(appConfig.happyRobotWorkflowId)
      .then((workflow) => workflow.id)
      .catch((error) => {
        resolvedWorkflowIdPromise = null
        throw error
      })
  }

  return resolvedWorkflowIdPromise
}
