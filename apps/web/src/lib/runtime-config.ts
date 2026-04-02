type RuntimeConfig = {
  apiBaseUrl: string
  apiPublicKey: string
  happyRobotDeploymentUrl: string
}

declare global {
  interface Window {
    __APP_CONFIG__?: {
      VITE_API_BASE_URL?: string
      VITE_API_PUBLIC_KEY?: string
      VITE_HAPPYROBOT_DEPLOYMENT_URL?: string
    }
  }
}

function fromWindow(key: keyof NonNullable<Window['__APP_CONFIG__']>): string {
  return window.__APP_CONFIG__?.[key] ?? ''
}

export const runtimeConfig: RuntimeConfig = {
  apiBaseUrl: fromWindow('VITE_API_BASE_URL') || import.meta.env.VITE_API_BASE_URL || '',
  apiPublicKey:
    fromWindow('VITE_API_PUBLIC_KEY') || import.meta.env.VITE_API_PUBLIC_KEY || '',
  happyRobotDeploymentUrl:
    fromWindow('VITE_HAPPYROBOT_DEPLOYMENT_URL') ||
    import.meta.env.VITE_HAPPYROBOT_DEPLOYMENT_URL ||
    '',
}

