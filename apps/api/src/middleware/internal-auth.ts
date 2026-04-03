import type { NextFunction, Request, Response } from 'express'

import { appConfig } from '../config'
import { secureCompare } from '../lib/http'

function unauthorized(response: Response): Response {
  return response.status(401).json({ error: 'Invalid internal API key.' })
}

function readInternalToken(request: Request): string {
  const authorization = request.header('authorization')

  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim()
  }

  return (
    request.header('x-internal-key') ??
    request.header('x-api-key') ??
    request.header('x-happyrobot-key') ??
    ''
  ).trim()
}

export function requireInternalAuth(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  if (!appConfig.internalApiKey) {
    next()
    return
  }

  if (!secureCompare(readInternalToken(request), appConfig.internalApiKey)) {
    unauthorized(response)
    return
  }

  next()
}
