import { openDB } from 'idb'

const DB_NAME = 'smileplan'
const DB_VERSION = 5

let dbPromise = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('patients')) {
          const s = db.createObjectStore('patients', { keyPath: 'id' })
          s.createIndex('name', 'fullName')
          s.createIndex('phone', 'phone')
          s.createIndex('createdAt', 'createdAt')
        }
        if (!db.objectStoreNames.contains('plans')) {
          const s = db.createObjectStore('plans', { keyPath: 'id' })
          s.createIndex('patientId', 'patientId')
          s.createIndex('createdAt', 'createdAt')
        }
        if (!db.objectStoreNames.contains('priceItems')) {
          const s = db.createObjectStore('priceItems', { keyPath: 'id' })
          s.createIndex('category', 'category')
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' })
        }
        if (!db.objectStoreNames.contains('appointments')) {
          const s = db.createObjectStore('appointments', { keyPath: 'id' })
          s.createIndex('patientId', 'patientId')
          s.createIndex('datetime', 'datetime')
        }
        // Medical records (per-visit карта)
        if (!db.objectStoreNames.contains('medRecords')) {
          const s = db.createObjectStore('medRecords', { keyPath: 'id' })
          s.createIndex('patientId', 'patientId')
          s.createIndex('date', 'date')
        }
        // Roadmaps (generated HTML дорожные карты)
        if (!db.objectStoreNames.contains('roadmaps')) {
          const s = db.createObjectStore('roadmaps', { keyPath: 'id' })
          s.createIndex('patientId', 'patientId')
          s.createIndex('createdAt', 'createdAt')
        }
      }
    })
  }
  return dbPromise
}

// ─── Patients ────────────────────────────────────────────────────────────────
export async function getPatients() { return (await getDB()).getAll('patients') }
export async function getPatient(id) { return (await getDB()).get('patients', id) }
export async function savePatient(p) { await (await getDB()).put('patients', p) }
export async function deletePatient(id) { await (await getDB()).delete('patients', id) }

// ─── Plans ────────────────────────────────────────────────────────────────────
export async function getPlans(patientId) {
  const db = await getDB()
  return patientId ? db.getAllFromIndex('plans', 'patientId', patientId) : db.getAll('plans')
}
export async function getPlan(id) { return (await getDB()).get('plans', id) }
export async function savePlan(plan) { await (await getDB()).put('plans', plan) }
export async function deletePlan(id) { await (await getDB()).delete('plans', id) }

// ─── Price Items ──────────────────────────────────────────────────────────────
export async function getPriceItems() { return (await getDB()).getAll('priceItems') }
export async function savePriceItem(item) { await (await getDB()).put('priceItems', item) }
export async function deletePriceItem(id) { await (await getDB()).delete('priceItems', id) }

// ─── Appointments ─────────────────────────────────────────────────────────────
export async function getAppointments() { return (await getDB()).getAll('appointments') }
export async function saveAppointment(a) { await (await getDB()).put('appointments', a) }
export async function deleteAppointmentDB(id) { await (await getDB()).delete('appointments', id) }

// ─── Medical Records ──────────────────────────────────────────────────────────
export async function getMedRecords(patientId) {
  const db = await getDB()
  return patientId ? db.getAllFromIndex('medRecords', 'patientId', patientId) : db.getAll('medRecords')
}
export async function saveMedRecord(r) { await (await getDB()).put('medRecords', r) }
export async function deleteMedRecord(id) { await (await getDB()).delete('medRecords', id) }

// ─── Roadmaps ─────────────────────────────────────────────────────────────────
export async function getRoadmaps(patientId) {
  const db = await getDB()
  return patientId ? db.getAllFromIndex('roadmaps', 'patientId', patientId) : db.getAll('roadmaps')
}
export async function saveRoadmap(r) { await (await getDB()).put('roadmaps', r) }
export async function deleteRoadmap(id) { await (await getDB()).delete('roadmaps', id) }

// ─── Settings ─────────────────────────────────────────────────────────────────
export async function getSetting(key, defaultValue = null) {
  const db = await getDB()
  const row = await db.get('settings', key)
  return row ? row.value : defaultValue
}
export async function setSetting(key, value) {
  await (await getDB()).put('settings', { key, value })
}
export async function getAllSettings() {
  const all = await (await getDB()).getAll('settings')
  return Object.fromEntries(all.map(r => [r.key, r.value]))
}
