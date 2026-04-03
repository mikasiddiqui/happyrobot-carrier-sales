import { randomUUID } from 'crypto'
import { promises as fs } from 'fs'
import { resolve } from 'path'

import type { CarrierRecord, CreateCallRecordRequest, LoadRecord, StoredCallRecord } from '../types'

const repoRoot = resolve(__dirname, '../../../../')
const dataDirectory = resolve(repoRoot, 'data')
const runtimeDirectory = resolve(dataDirectory, 'runtime')
const callsFilePath = resolve(runtimeDirectory, 'calls.json')
const carriersFilePath = resolve(dataDirectory, 'carriers.json')
const loadsFilePath = resolve(dataDirectory, 'loads.json')

let carriersCache: CarrierRecord[] | null = null
let loadsCache: LoadRecord[] | null = null
let callStoreMutation: Promise<void> = Promise.resolve()

async function readJsonFile<T>(filePath: string): Promise<T> {
  const contents = await fs.readFile(filePath, 'utf8')
  return JSON.parse(contents) as T
}

async function writeJsonFileAtomic(
  filePath: string,
  payload: unknown,
): Promise<void> {
  const tempFilePath = `${filePath}.tmp`
  await fs.writeFile(tempFilePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  await fs.rename(tempFilePath, filePath)
}

function queueCallStoreMutation<T>(operation: () => Promise<T>): Promise<T> {
  const queuedOperation = callStoreMutation.then(operation, operation)

  callStoreMutation = queuedOperation.then(
    () => undefined,
    () => undefined,
  )

  return queuedOperation
}

export async function ensureRuntimeStore(): Promise<void> {
  await fs.mkdir(runtimeDirectory, { recursive: true })

  try {
    await fs.access(callsFilePath)
  } catch {
    await fs.writeFile(callsFilePath, '[]\n', 'utf8')
  }
}

export async function getCarriers(): Promise<CarrierRecord[]> {
  if (!carriersCache) {
    carriersCache = await readJsonFile<CarrierRecord[]>(carriersFilePath)
  }

  return carriersCache
}

export async function getLoads(): Promise<LoadRecord[]> {
  if (!loadsCache) {
    loadsCache = await readJsonFile<LoadRecord[]>(loadsFilePath)
  }

  return loadsCache
}

export async function listCallRecords(): Promise<StoredCallRecord[]> {
  await ensureRuntimeStore()
  const records = await readJsonFile<StoredCallRecord[]>(callsFilePath)

  return records.sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  )
}

export async function resetCallRecords(): Promise<void> {
  await queueCallStoreMutation(async () => {
    await ensureRuntimeStore()
    await writeJsonFileAtomic(callsFilePath, [])
  })
}

export async function appendCallRecord(
  payload: CreateCallRecordRequest,
): Promise<StoredCallRecord> {
  return queueCallStoreMutation(async () => {
    await ensureRuntimeStore()

    const now = new Date().toISOString()
    const records = await listCallRecords()

    const record: StoredCallRecord = {
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      runId: payload.runId,
      carrierMcNumber: payload.carrierMcNumber,
      carrierName: payload.carrierName,
      carrierEligible: payload.carrierEligible,
      loadId: payload.loadId,
      equipmentType: payload.equipmentType,
      loadboardRate: payload.loadboardRate,
      carrierInitialOffer: payload.carrierInitialOffer,
      finalAgreedRate: payload.finalAgreedRate,
      negotiationRounds: payload.negotiationRounds ?? 0,
      outcome: payload.outcome ?? 'unknown',
      sentiment: payload.sentiment ?? 'neutral',
      summary: payload.summary,
      accepted: payload.accepted,
      rejectionReason: payload.rejectionReason,
      needsHumanFollowup: payload.needsHumanFollowup ?? false,
    }

    const nextRecords = [record, ...records]
    await writeJsonFileAtomic(callsFilePath, nextRecords)

    return record
  })
}
