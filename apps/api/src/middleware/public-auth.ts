import type { NextFunction, Request, Response } from 'express'

import { appConfig } from '../config'
import { secureCompare } from '../lib/http'

function unauthorized(response: Response): Response {
  return response.status(401).json({ error: 'Invalid public API key.' })
}

function readPublicToken(request: Request): string {
  const authorization = request.header('authorization')

  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim()
  }

  return (request.header('x-api-key') ?? '').trim()
}

export function requirePublicApiAuth(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  if (!appConfig.publicApiKey) {
    next()
    return
  }

  if (!secureCompare(readPublicToken(request), appConfig.publicApiKey)) {
    unauthorized(response)
    return
  }

  next()
}
