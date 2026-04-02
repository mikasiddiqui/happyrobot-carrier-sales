import type { DashboardSummary, LoadRecord, StoredCallRecord } from '../types'

export function buildDashboardSummary(
  records: StoredCallRecord[],
  loads: LoadRecord[],
): DashboardSummary {
  if (records.length === 0) {
    return {
      totalCalls: 0,
      bookedLoads: 0,
      eligibleCarrierCalls: 0,
      disconnectedCalls: 0,
      followupRequiredCalls: 0,
      closeRateOnQualifiedCalls: null,
      averageBookedRate: null,
      averageNegotiationRoundsOnBookedCalls: null,
      averageConcessionDelta: null,
      outcomeBreakdown: {},
      sentimentBreakdown: {},
    }
  }

  const loadMap = new Map(loads.map((load) => [load.id, load]))
  let bookedCount = 0
  let eligibleCarrierCount = 0
  let disconnectedCount = 0
  let followupRequiredCount = 0
  let qualifiedOpportunityCount = 0
  let bookedFinalRateTotal = 0
  let bookedFinalRateCount = 0
  let bookedRoundsTotal = 0
  let concessionTotal = 0
  let concessionCount = 0

  const outcomeBreakdown: Record<string, number> = {}
  const sentimentBreakdown: Record<string, number> = {}

  for (const record of records) {
    outcomeBreakdown[record.outcome] = (outcomeBreakdown[record.outcome] ?? 0) + 1
    sentimentBreakdown[record.sentiment] = (sentimentBreakdown[record.sentiment] ?? 0) + 1

    if (record.carrierEligible) {
      eligibleCarrierCount += 1
    }

    if (record.outcome === 'caller_disconnected') {
      disconnectedCount += 1
    }

    if (record.needsHumanFollowup || record.outcome === 'human_followup_needed') {
      followupRequiredCount += 1
    }

    const isQualifiedOpportunity =
      record.carrierEligible ||
      record.outcome === 'booked' ||
      record.outcome === 'no_matching_load' ||
      record.outcome === 'rate_not_accepted' ||
      record.outcome === 'human_followup_needed'

    if (isQualifiedOpportunity) {
      qualifiedOpportunityCount += 1
    }

    const isBooked = record.outcome === 'booked' || record.accepted

    if (isBooked) {
      bookedCount += 1
      bookedRoundsTotal += record.negotiationRounds

      if (typeof record.finalAgreedRate === 'number' && record.finalAgreedRate > 0) {
        bookedFinalRateTotal += record.finalAgreedRate
        bookedFinalRateCount += 1
      }
    }

    const sourceLoad = record.loadId ? loadMap.get(record.loadId) : undefined
    const loadboardRate = record.loadboardRate ?? sourceLoad?.loadboardRate

    if (
      isBooked &&
      typeof loadboardRate === 'number' &&
      typeof record.finalAgreedRate === 'number' &&
      record.finalAgreedRate > 0
    ) {
      concessionTotal += loadboardRate - record.finalAgreedRate
      concessionCount += 1
    }
  }

  return {
    totalCalls: records.length,
    bookedLoads: bookedCount,
    eligibleCarrierCalls: eligibleCarrierCount,
    disconnectedCalls: disconnectedCount,
    followupRequiredCalls: followupRequiredCount,
    closeRateOnQualifiedCalls:
      qualifiedOpportunityCount > 0
        ? Number(((bookedCount / qualifiedOpportunityCount) * 100).toFixed(1))
        : null,
    averageBookedRate:
      bookedFinalRateCount > 0
        ? Math.round(bookedFinalRateTotal / bookedFinalRateCount)
        : null,
    averageNegotiationRoundsOnBookedCalls:
      bookedCount > 0 ? Number((bookedRoundsTotal / bookedCount).toFixed(1)) : null,
    averageConcessionDelta:
      concessionCount > 0 ? Math.round(concessionTotal / concessionCount) : null,
    outcomeBreakdown,
    sentimentBreakdown,
  }
}
