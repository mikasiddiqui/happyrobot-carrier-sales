import type { NextFunction, Request, Response } from 'express'

import { isProductionLike } from '../config'
import { HttpError } from '../lib/http'

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  if (error instanceof HttpError) {
    response.status(error.statusCode).json({ error: error.message })
    return
  }

  console.error('[api-error]', error)

  const message =
    !isProductionLike() && error instanceof Error
      ? error.message
      : 'Internal server error.'

  response.status(500).json({ error: message })
}
