import assert from 'node:assert/strict'
import test from 'node:test'

import { appConfig } from '../src/config'
import { normalizeIncomingCallPayload } from '../src/services/call-payload'
import { verifyCarrier } from '../src/services/carrier-verification'
import { searchLoads } from '../src/services/load-search'
import { negotiateOffer } from '../src/services/negotiation'
import type { CarrierRecord, LoadRecord } from '../src/types'

const loadsFixture: LoadRecord[] = [
  {
    id: 'LD-1001',
    referenceNumber: 'REF-1001',
    origin: { city: 'Chicago', state: 'IL' },
    destination: { city: 'Atlanta', state: 'GA' },
    pickupWindowStart: '2026-04-05T08:00:00.000Z',
    pickupWindowEnd: '2026-04-05T15:00:00.000Z',
    deliveryWindowEnd: '2026-04-07T18:00:00.000Z',
    equipmentType: 'dry_van',
    loadboardRate: 3000,
    minimumRate: 2800,
    miles: 720,
    weightLbs: 42000,
    commodityType: 'paper',
    numPieces: 18,
    dimensions: '53ft trailer',
    deadheadHintMiles: 15,
    notes: 'Exact lane match',
  },
  {
    id: 'LD-1002',
    referenceNumber: 'REF-1002',
    origin: { city: 'Joliet', state: 'IL' },
    destination: { city: 'Savannah', state: 'GA' },
    pickupWindowStart: '2026-04-05T10:00:00.000Z',
    pickupWindowEnd: '2026-04-05T17:00:00.000Z',
    deliveryWindowEnd: '2026-04-08T18:00:00.000Z',
    equipmentType: 'dry_van',
    loadboardRate: 2950,
    minimumRate: 2750,
    miles: 810,
    weightLbs: 41000,
    commodityType: 'packaged food',
    numPieces: 22,
    dimensions: '53ft trailer',
    deadheadHintMiles: 45,
    notes: 'Near lane match',
  },
]

const carriersFixture: CarrierRecord[] = [
  {
    mcNumber: '123456',
    carrierName: 'Atlas Freight',
    status: 'active',
    eligible: true,
    equipmentTypes: ['dry_van'],
    insuranceOnFile: true,
    authorityActive: true,
    safetyRating: 'satisfactory',
    notes: 'Preferred demo carrier',
  },
]

test('searchLoads ranks the strongest lane match first', () => {
  const result = searchLoads(loadsFixture, {
    origin: 'Chicago, IL',
    destination: 'Atlanta, GA',
    equipment_type: 'dry_van',
    pickup_date: '2026-04-05',
  })

  assert.equal(result.count, 2)
  assert.equal(result.loads[0]?.id, 'LD-1001')
  assert.match(result.loads[0]?.matchReasons.join(', ') ?? '', /origin exact/)
})

test('negotiateOffer counters early and rejects low final-round offers', () => {
  const counter = negotiateOffer(loadsFixture[0], {
    load_id: loadsFixture[0].id,
    carrier_offer: 2700,
    round_number: 1,
  })
  const rejection = negotiateOffer(loadsFixture[0], {
    load_id: loadsFixture[0].id,
    carrier_offer: 2700,
    round_number: 3,
  })

  assert.equal(counter.decision, 'counter')
  assert.equal(counter.counter_offer, 2925)
  assert.equal(rejection.decision, 'reject')
})

test('normalizeIncomingCallPayload trims aliases and ignores invalid numeric values', () => {
  const payload = normalizeIncomingCallPayload({
    run_id: ' run-123 ',
    carrier_name: ' Atlas Freight ',
    carrier_mc_number: 123456,
    negotiation_rounds: 2.9,
    final_agreed_rate: Number.NaN,
    outcome: ' booked ',
    sentiment: ' positive ',
  })

  assert.equal(payload.runId, 'run-123')
  assert.equal(payload.carrierName, 'Atlas Freight')
  assert.equal(payload.carrierMcNumber, '123456')
  assert.equal(payload.negotiationRounds, 2)
  assert.equal(payload.finalAgreedRate, undefined)
  assert.equal(payload.outcome, 'booked')
  assert.equal(payload.sentiment, 'positive')
})

test('verifyCarrier falls back to seeded data when FMCSA is unavailable', async () => {
  const originalFmcsaApiKey = appConfig.fmcsaApiKey
  const originalSeedFallback = appConfig.enableSeedCarrierFallback

  appConfig.fmcsaApiKey = ''
  appConfig.enableSeedCarrierFallback = true

  try {
    const verification = await verifyCarrier(carriersFixture, 'MC-123456')

    assert.equal(verification.eligible, true)
    assert.equal(verification.carrier_name, 'Atlas Freight')
    assert.equal(verification.mc_number, '123456')
  } finally {
    appConfig.fmcsaApiKey = originalFmcsaApiKey
    appConfig.enableSeedCarrierFallback = originalSeedFallback
  }
})
