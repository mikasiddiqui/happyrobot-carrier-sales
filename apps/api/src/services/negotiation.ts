import type { LoadRecord, NegotiateOfferRequest, NegotiateOfferResponse } from '../types'

function roundCurrency(value: number): number {
  return Math.round(value / 25) * 25
}

export function negotiateOffer(
  load: LoadRecord,
  request: NegotiateOfferRequest,
): NegotiateOfferResponse {
  const roundNumber = Math.min(Math.max(Math.trunc(request.round_number || 1), 1), 3)
  const carrierOffer = roundCurrency(request.carrier_offer)
  const roundAcceptanceThresholds = [
    roundCurrency(load.loadboardRate * 0.97),
    roundCurrency(load.minimumRate + 50),
    roundCurrency(load.minimumRate),
  ]
  const counterTargets = [
    roundCurrency(Math.max(load.minimumRate + 125, load.loadboardRate - 100)),
    roundCurrency(Math.max(load.minimumRate + 50, load.loadboardRate - 50)),
  ]

  const acceptanceThreshold = roundAcceptanceThresholds[roundNumber - 1]

  if (carrierOffer >= acceptanceThreshold) {
    return {
      decision: 'accept',
      counter_offer: null,
      message_hint:
        'Accept the offer, confirm the final agreed rate clearly, and move toward transfer.',
      rounds_remaining: Math.max(0, 3 - roundNumber),
      load_id: load.id,
      loadboard_rate: load.loadboardRate,
      minimum_rate: load.minimumRate,
    }
  }

  if (roundNumber >= 3) {
    return {
      decision: 'reject',
      counter_offer: null,
      message_hint:
        'Politely decline, explain that you cannot meet the requested rate, and close professionally.',
      rounds_remaining: 0,
      load_id: load.id,
      loadboard_rate: load.loadboardRate,
      minimum_rate: load.minimumRate,
    }
  }

  const counterTarget = counterTargets[roundNumber - 1]
  const counterOffer = roundCurrency(Math.max(counterTarget, carrierOffer + 25))

  return {
    decision: 'counter',
    counter_offer: counterOffer,
    message_hint:
      'Counter confidently, anchor on the market rate, and ask if the carrier can move on your number.',
    rounds_remaining: 3 - roundNumber,
    load_id: load.id,
    loadboard_rate: load.loadboardRate,
    minimum_rate: load.minimumRate,
  }
}
