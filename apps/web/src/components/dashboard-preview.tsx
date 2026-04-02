import {
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Clock3,
  PhoneCall,
  ShieldCheck,
  Siren,
  SmilePlus,
  Target,
  TrendingUp,
  Truck,
} from 'lucide-react'
import { useState } from 'react'

import { timeLabel, titleLabel } from '../lib/format'
import type { DashboardPayload } from '../types'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import {
  CardAction,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './ui/tooltip'

interface DashboardPreviewProps {
  dashboard: DashboardPayload
  loading: boolean
  error: string
  onResetSavedCalls: () => void
}

function outcomeVariant(outcome: string) {
  switch (outcome) {
    case 'booked':
      return 'booked' as const
    case 'human_followup_needed':
      return 'warning' as const
    default:
      return 'secondary' as const
  }
}

function sentimentVariant(sentiment: string) {
  switch (sentiment) {
    case 'positive':
      return 'success' as const
    case 'neutral':
      return 'warning' as const
    case 'negative':
      return 'destructive' as const
    default:
      return 'outline' as const
  }
}

function compactMetricValue(value: number | null, prefix = '') {
  if (value === null || value === undefined) {
    return '—'
  }

  return `${prefix}${value.toLocaleString()}`
}

function activityTitle(call: DashboardPayload['calls'][number]) {
  if (call.carrierName?.trim()) {
    return call.carrierName
  }

  return 'Not verified'
}

export function DashboardPreview({
  dashboard,
  loading,
  error,
  onResetSavedCalls,
}: DashboardPreviewProps) {
  const [loadsOpen, setLoadsOpen] = useState(false)
  const summary = dashboard.summary

  const visibleCalls = dashboard.calls.filter(
    (call) =>
      call.outcome !== 'caller_disconnected' ||
      Boolean(call.carrierName) ||
      Boolean(call.loadId) ||
      Boolean(call.carrierMcNumber),
  )

  const outcomeCounts = Object.entries(summary?.outcomeBreakdown ?? {}).filter(
    ([, count]) => count > 0,
  )
  const sentimentCounts = Object.entries(summary?.sentimentBreakdown ?? {}).filter(
    ([, count]) => count > 0,
  )

  const showLoadingState =
    loading && !summary && dashboard.calls.length === 0 && dashboard.loads.length === 0

  const primaryMetrics = [
    {
      label: 'Calls',
      value: String(summary?.totalCalls ?? 0),
      icon: PhoneCall,
      tint: 'bg-sky-500/12 text-sky-300',
    },
    {
      label: 'Booked',
      value: String(summary?.bookedLoads ?? 0),
      icon: Target,
      tint: 'bg-emerald-500/12 text-emerald-300',
    },
    {
      label: 'Close rate',
      value:
        summary?.closeRateOnQualifiedCalls === null ||
        summary?.closeRateOnQualifiedCalls === undefined
          ? '—'
          : `${summary.closeRateOnQualifiedCalls}%`,
      icon: TrendingUp,
      tint: 'bg-violet-500/12 text-violet-300',
    },
    {
      label: 'Avg booked rate',
      value: compactMetricValue(summary?.averageBookedRate ?? null, '$'),
      icon: CircleDollarSign,
      tint: 'bg-amber-500/12 text-amber-300',
    },
  ]

  const secondaryMetrics = [
    {
      label: 'Verified',
      value: String(summary?.eligibleCarrierCalls ?? 0),
      icon: ShieldCheck,
      tint: 'bg-cyan-500/12 text-cyan-300',
      description: 'Carriers that passed eligibility checks before a load was offered.',
    },
    {
      label: 'Avg concession',
      value: compactMetricValue(summary?.averageConcessionDelta ?? null, '$'),
      icon: ArrowDownRight,
      tint: 'bg-rose-500/12 text-rose-300',
      description: 'Average difference between the posted rate and the final booked rate.',
    },
    {
      label: 'Avg rounds',
      value: compactMetricValue(summary?.averageNegotiationRoundsOnBookedCalls ?? null),
      icon: SmilePlus,
      tint: 'bg-slate-500/12 text-slate-100',
      description: 'Average negotiation rounds on loads that were successfully booked.',
    },
    {
      label: 'Follow-up',
      value: String(summary?.followupRequiredCalls ?? 0),
      icon: Siren,
      tint: 'bg-amber-500/12 text-amber-300',
      description: 'Calls that ended with a manual handoff or broker follow-up needed.',
    },
  ]

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="space-y-2">
          <Badge variant="outline" className="w-fit uppercase tracking-[0.18em] text-[10px]">
            Operations
          </Badge>
          <CardTitle className="text-3xl tracking-[-0.03em]">Performance overview</CardTitle>
          <CardDescription className="max-w-xl text-base">
            Bookings, negotiation results, and carrier quality from completed calls.
          </CardDescription>
        </div>

        <CardAction>
          <Button variant="outline" size="default" className="h-10 px-4" onClick={onResetSavedCalls}>
            Clear records
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        {error ? (
          <p className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </p>
        ) : null}

        {showLoadingState ? (
          <p className="text-sm text-[var(--muted-foreground)]">Loading dashboard data…</p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {primaryMetrics.map((metric) => (
            <Card key={metric.label} className="border-white/6 bg-white/[0.03]">
              <CardContent className="flex min-h-[112px] items-center justify-between gap-4 p-4">
                <div className="space-y-1">
                  <p className="text-sm text-[var(--muted-foreground)]">{metric.label}</p>
                  <p className="text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
                    {metric.value}
                  </p>
                </div>
                <div className={`rounded-2xl p-2.5 ${metric.tint}`}>
                  <metric.icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-white/6 bg-white/[0.03]">
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
            {secondaryMetrics.map((metric) => (
              <div
                key={metric.label}
                className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel-soft)] px-4 py-3 text-left"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={`${metric.label} info`}
                      className={`rounded-xl p-2.5 transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 ${metric.tint}`}
                    >
                      <metric.icon className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={10}>
                    {metric.description}
                  </TooltipContent>
                </Tooltip>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    {metric.label}
                  </p>
                  <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">
                    {metric.value}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.24fr)_minmax(300px,0.76fr)]">
          <Card className="border-white/6 bg-white/[0.03] xl:h-[640px] xl:overflow-hidden">
            <CardHeader className="space-y-4 pb-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1.5">
                  <Clock3 className="h-3.5 w-3.5" />
                  Recent calls
                </Badge>
              </div>

              <div className="space-y-3">
                <CardTitle className="text-2xl">Activity feed</CardTitle>

                <div className="flex flex-wrap gap-2">
                  {outcomeCounts.map(([label, count]) => (
                    <Badge key={label} variant={outcomeVariant(label)} className="gap-2">
                      {titleLabel(label)}
                      <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[11px] leading-none">
                        {count}
                      </span>
                    </Badge>
                  ))}

                  {sentimentCounts.map(([label, count]) => (
                    <Badge key={label} variant={sentimentVariant(label)} className="gap-2">
                      {titleLabel(label)}
                      <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[11px] leading-none">
                        {count}
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="xl:min-h-0">
              {visibleCalls.length === 0 ? (
                <p className="text-sm leading-7 text-[var(--muted-foreground)]">
                  Completed calls will appear here automatically once the first
                  conversation posts back into the dashboard.
                </p>
              ) : (
                <div className="space-y-3 xl:h-[392px] xl:overflow-y-auto xl:pr-1">
                  {visibleCalls.map((call) => (
                    <article
                      key={call.id}
                      className="rounded-2xl border border-[var(--border)] bg-white/4 p-4"
                    >
                      <div className="space-y-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0 space-y-2">
                            <div className="min-w-0 space-y-1">
                              <p className="truncate text-lg font-semibold text-[var(--foreground)]">
                                {activityTitle(call)}
                              </p>
                              <p className="text-sm text-[var(--muted-foreground)]">
                                {timeLabel(call.createdAt)}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Badge variant={outcomeVariant(call.outcome)}>
                                {titleLabel(call.outcome)}
                              </Badge>
                              <Badge variant={sentimentVariant(call.sentiment)}>
                                {titleLabel(call.sentiment)}
                              </Badge>
                              <Badge variant="secondary">
                                {call.negotiationRounds} round{call.negotiationRounds === 1 ? '' : 's'}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-5 md:shrink-0">
                            <div className="text-left md:text-right">
                              <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                                Rate
                              </p>
                              <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">
                                {typeof call.finalAgreedRate === 'number'
                                  ? `$${call.finalAgreedRate.toLocaleString()}`
                                : '—'}
                              </p>
                            </div>

                            <div className="hidden h-10 w-px bg-[var(--border)] md:block" />

                            <div className="text-left md:text-right">
                              <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                                Load
                              </p>
                              <p className="mt-1 whitespace-nowrap text-lg font-semibold text-[var(--foreground)]">
                                {call.loadId ?? '—'}
                              </p>
                            </div>
                          </div>
                        </div>

                      </div>
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Collapsible open={loadsOpen} onOpenChange={setLoadsOpen}>
            <Card className="border-white/6 bg-white/[0.03] xl:h-[640px] xl:overflow-hidden">
              <CardHeader className="gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl">Open loads</CardTitle>
                    <CardDescription>Current freight inventory for live matching.</CardDescription>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Toggle open loads">
                      {loadsOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </CardHeader>

              <CollapsibleContent>
                <CardContent className="space-y-3 xl:h-[484px] xl:overflow-y-auto xl:pr-1">
                  {dashboard.loads.map((load) => (
                    <div
                      key={load.id}
                      className="rounded-2xl border border-[var(--border)] bg-white/4 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-2">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 shrink-0 text-[var(--accent-soft)]" />
                            <p className="font-semibold text-[var(--foreground)]">{load.id}</p>
                          </div>
                          <p className="break-words text-sm leading-6 text-[var(--muted-foreground)]">
                            {load.lane}
                          </p>
                        </div>

                        <p className="text-lg font-semibold text-[var(--foreground)]">
                          ${load.loadboardRate.toLocaleString()}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="secondary">{load.equipmentType}</Badge>
                        <Badge variant="outline">{load.pickupDate}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  )
}
