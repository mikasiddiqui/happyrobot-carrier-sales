import { Router } from 'express'

import {
  appConfig,
  happyRobotClient,
  isHappyRobotConfigured,
  resolveHappyRobotWorkflowId,
} from '../config'
import {
  ensureRecordBody,
  readOptionalTrimmedString,
} from '../lib/request-validation'
import { requirePublicApiAuth } from '../middleware/public-auth'

export const voiceRoutes = Router()

voiceRoutes.post('/voice/token', requirePublicApiAuth, async (request, response) => {
  if (!isHappyRobotConfigured() || !happyRobotClient) {
    response.status(503).json({
      error:
        'HappyRobot is not configured yet. Add HAPPYROBOT_API_KEY and HAPPYROBOT_WORKFLOW_ID in apps/api/.env.',
    })
    return
  }

  const body = ensureRecordBody(request.body)
  const callerName = readOptionalTrimmedString(body, 'callerName') ?? ''
  const brokerName = readOptionalTrimmedString(body, 'brokerName') ?? ''
  const scenario = readOptionalTrimmedString(body, 'scenario') ?? ''

  try {
    const workflowId = await resolveHappyRobotWorkflowId()
    const token = await happyRobotClient.voice.createToken({
      workflow_id: workflowId,
      env: appConfig.happyRobotEnv,
      data: {
        caller_name: callerName || 'Challenge carrier',
        broker_name: brokerName || 'HappyRobot Brokerage',
        test_scenario: scenario || 'happy_path',
        source: 'browser_call_tester',
      },
    })

    response.json(token)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown token error.'
    response.status(502).json({
      error: 'Failed to create HappyRobot voice token.',
      details: message,
    })
  }
})
