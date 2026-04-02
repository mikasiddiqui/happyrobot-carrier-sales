import { CallTester } from './components/call-tester'
import { DashboardPreview } from './components/dashboard-preview'
import { Badge } from './components/ui/badge'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from './components/ui/card'
import { useDashboardData } from './hooks/use-dashboard-data'
import { runtimeConfig } from './lib/runtime-config'

function App() {
  const hostedDeploymentUrl = runtimeConfig.happyRobotDeploymentUrl

  const { health, dashboard, dashboardError, dashboardLoading, clearSavedCalls } = useDashboardData()

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1460px] flex-col gap-4 p-4 md:p-5">
      <Card className="overflow-hidden">
        <CardHeader className="gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl space-y-3">
            <Badge variant="outline" className="w-fit uppercase tracking-[0.18em] text-[10px]">
              Inbound carrier sales
            </Badge>
            <CardTitle className="text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
              Inbound Carrier Sales Console
            </CardTitle>
            <CardDescription className="max-w-2xl text-base leading-7">
              Launch live inbound calls and track booking, verification, and negotiation performance in real time.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(460px,0.88fr)_minmax(0,1.12fr)]">
        <CallTester
          health={health}
          hostedDeploymentUrl={hostedDeploymentUrl || undefined}
        />

        <div className="grid gap-4">
          <DashboardPreview
            dashboard={dashboard}
            loading={dashboardLoading}
            error={dashboardError}
            onResetSavedCalls={() => void clearSavedCalls()}
          />
        </div>
      </div>
    </div>
  )
}

export default App
