import assert from 'node:assert/strict'
import test from 'node:test'

import { appConfig } from '../src/config'
import { requireInternalAuth } from '../src/middleware/internal-auth'
import { requirePublicApiAuth } from '../src/middleware/public-auth'
import {
  ensureRecordBody,
  parsePositiveInteger,
  readOptionalEquipmentType,
} from '../src/lib/request-validation'
import { buildHealthResponse } from '../src/services/health-response'

function createRequest(headers: Record<string, string> = {}) {
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  )

  return {
    header(name: string) {
      return normalizedHeaders[name.toLowerCase()]
    },
  }
}

function createResponse() {
  return {
    statusCode: 200,
    payload: null as unknown,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(payload: unknown) {
      this.payload = payload
      return this
    },
  }
}

test('public auth rejects incorrect API keys', () => {
  const originalPublicApiKey = appConfig.publicApiKey
  appConfig.publicApiKey = 'public-test-key'

  try {
    const request = createRequest({ 'x-api-key': 'wrong-key' })
    const response = createResponse()
    let nextCalled = false

    requirePublicApiAuth(
      request as never,
      response as never,
      () => {
        nextCalled = true
      },
    )

    assert.equal(nextCalled, false)
    assert.equal(response.statusCode, 401)
    assert.deepEqual(response.payload, { error: 'Invalid public API key.' })
  } finally {
    appConfig.publicApiKey = originalPublicApiKey
  }
})

test('internal auth accepts bearer tokens after trimming', () => {
  const originalInternalApiKey = appConfig.internalApiKey
  appConfig.internalApiKey = 'internal-test-key'

  try {
    const request = createRequest({
      authorization: 'Bearer internal-test-key   ',
    })
    const response = createResponse()
    let nextCalled = false

    requireInternalAuth(
      request as never,
      response as never,
      () => {
        nextCalled = true
      },
    )

    assert.equal(nextCalled, true)
    assert.equal(response.statusCode, 200)
  } finally {
    appConfig.internalApiKey = originalInternalApiKey
  }
})

test('request validation rejects invalid equipment types', () => {
  assert.throws(
    () =>
      readOptionalEquipmentType(
        ensureRecordBody({ equipment_type: 'stepdeck' }),
        'equipment_type',
      ),
    /equipment_type must be one of/i,
  )
})

test('query parsing falls back cleanly on invalid limits', () => {
  assert.equal(parsePositiveInteger('not-a-number', 8, { min: 1, max: 50 }), 8)
  assert.equal(parsePositiveInteger('55', 8, { min: 1, max: 50 }), 8)
  assert.equal(parsePositiveInteger('5', 8, { min: 1, max: 50 }), 5)
})

test('health response stays lean and excludes detailed config flags', () => {
  const payload = buildHealthResponse({
    carrierCount: 2,
    loadCount: 3,
    savedCalls: 4,
  }) as Record<string, unknown> & {
    happyRobot: Record<string, unknown>
  }

  assert.equal('internalAuthEnabled' in payload, false)
  assert.equal('publicAuthEnabled' in payload, false)
  assert.equal('apiKeyPresent' in payload.happyRobot, false)
  assert.equal('workflowIdPresent' in payload.happyRobot, false)
  assert.deepEqual(payload.seedData, {
    carrierCount: 2,
    loadCount: 3,
    savedCalls: 4,
  })
})
