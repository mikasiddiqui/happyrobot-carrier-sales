import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

import { appConfig } from './config'
import { errorHandler } from './middleware/error-handler'
import { publicRoutes } from './routes/public-routes'
import { voiceRoutes } from './routes/voice-routes'
import { workflowRoutes } from './routes/workflow-routes'

export function createApp() {
  const app = express()
  const allowedOrigins = appConfig.corsAllowedOrigins

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  )
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
          callback(null, true)
          return
        }

        callback(new Error(`Origin ${origin} is not allowed by CORS.`))
      },
      credentials: false,
    }),
  )
  app.use(express.json())

  app.use('/api', publicRoutes)
  app.use('/api', voiceRoutes)
  app.use('/api', workflowRoutes)
  app.use(errorHandler)

  return app
}
