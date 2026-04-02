import { ExternalLink, Mic, Radio } from 'lucide-react'

import type { HealthResponse } from '../types'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'

interface CallTesterProps {
  health: HealthResponse | null
  hostedDeploymentUrl?: string
}

export function CallTester({ health, hostedDeploymentUrl }: CallTesterProps) {
  const hostedCallReady = Boolean(hostedDeploymentUrl)
  const workflowReady = health?.happyRobot.configured ?? false

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <Badge variant="outline" className="w-fit uppercase tracking-[0.18em] text-[10px]">
              Live call
            </Badge>
            <CardTitle className="text-3xl tracking-[-0.03em]">
              Carrier desk
            </CardTitle>
            <CardDescription className="max-w-xl text-base">
              Run the inbound carrier workflow inside this page. Completed calls
              appear in the activity feed automatically.
            </CardDescription>
          </div>

          <Badge variant={workflowReady && hostedCallReady ? 'success' : 'warning'} className="gap-2 self-start">
            <Radio className="h-3.5 w-3.5" />
            {workflowReady && hostedCallReady ? 'Ready' : 'Unavailable'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Carrier verification</Badge>
          <Badge variant="secondary">Load search</Badge>
          <Badge variant="secondary">Negotiation</Badge>
        </div>

        <div className="overflow-hidden rounded-[1.35rem] border border-[var(--border)] bg-white p-2 shadow-[0_22px_44px_rgba(0,0,0,0.18)]">
          {hostedDeploymentUrl ? (
            <iframe
              className="min-h-[640px] w-full rounded-[1rem] border-0 bg-white md:min-h-[720px]"
              src={hostedDeploymentUrl}
              title="HappyRobot hosted carrier sales call"
              allow="microphone; autoplay"
            />
          ) : (
            <div className="flex min-h-[520px] flex-col items-center justify-center gap-4 rounded-[1rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <div className="rounded-full bg-slate-200 p-4 text-slate-700">
                <Mic className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-slate-900">
                  Hosted call not configured
                </p>
                <p className="max-w-md text-sm text-slate-600">
                  Add <code>VITE_HAPPYROBOT_DEPLOYMENT_URL</code> to render the
                  live call inside the dashboard.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {hostedDeploymentUrl ? (
            <Button asChild variant="secondary" size="lg">
              <a href={hostedDeploymentUrl} target="_blank" rel="noreferrer">
                Open in new tab
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          ) : null}

          <div className="text-sm text-[var(--muted-foreground)]">
            If the embedded call is blocked by the browser, open the same call in a new tab.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
