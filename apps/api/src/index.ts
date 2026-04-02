import { createApp } from './app'
import { appConfig } from './config'
import { ensureRuntimeStore } from './lib/data-store'

async function start(): Promise<void> {
  await ensureRuntimeStore()

  const app = createApp()

  app.listen(appConfig.port, () => {
    console.log(
      `happyrobot-carrier-sales api listening on http://localhost:${appConfig.port} (${appConfig.happyRobotEnv})`,
    )
  })
}

void start()
