import type { LoadRecord, RankedLoad, SearchLoadsRequest, SearchLoadsResponse } from '../types'

function normalizeText(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

function compactLane(value: string | undefined): string {
  return normalizeText(value).replace(/[^a-z0-9]+/g, ' ')
}

export function formatLane(load: LoadRecord): string {
  return `${load.origin.city}, ${load.origin.state} -> ${load.destination.city}, ${load.destination.state}`
}

export function searchLoads(
  loads: LoadRecord[],
  criteria: SearchLoadsRequest,
): SearchLoadsResponse {
  const origin = compactLane(criteria.origin)
  const destination = compactLane(criteria.destination)
  const pickupDate = criteria.pickup_date?.slice(0, 10)

  const rankedLoads = loads
    .filter((load) =>
      criteria.equipment_type ? load.equipmentType === criteria.equipment_type : true,
    )
    .map((load) => {
      const matchReasons: string[] = []
      let score = 0

      if (criteria.equipment_type && load.equipmentType === criteria.equipment_type) {
        score += 120
        matchReasons.push('equipment match')
      }

      const loadOrigin = compactLane(`${load.origin.city} ${load.origin.state}`)
      const loadDestination = compactLane(
        `${load.destination.city} ${load.destination.state}`,
      )

      if (!origin) {
        score += 10
      } else if (loadOrigin === origin) {
        score += 95
        matchReasons.push('origin exact')
      } else if (loadOrigin.includes(origin) || origin.includes(loadOrigin)) {
        score += 60
        matchReasons.push('origin near match')
      } else if (load.origin.state.toLowerCase() === origin) {
        score += 20
        matchReasons.push('origin state match')
      }

      if (!destination) {
        score += 10
      } else if (loadDestination === destination) {
        score += 95
        matchReasons.push('destination exact')
      } else if (
        loadDestination.includes(destination) ||
        destination.includes(loadDestination)
      ) {
        score += 60
        matchReasons.push('destination near match')
      } else if (load.destination.state.toLowerCase() === destination) {
        score += 20
        matchReasons.push('destination state match')
      }

      if (!pickupDate) {
        score += 5
      } else if (load.pickupWindowStart.startsWith(pickupDate)) {
        score += 25
        matchReasons.push('pickup date fit')
      }

      score += Math.max(0, 35 - load.deadheadHintMiles)

      return {
        ...load,
        lane: formatLane(load),
        pickupDate: load.pickupWindowStart.slice(0, 10),
        matchReasons: matchReasons.length > 0 ? matchReasons : ['general availability'],
        score,
      } satisfies RankedLoad
    })
    .filter((load) => load.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)

  return {
    count: rankedLoads.length,
    loads: rankedLoads,
  }
}
