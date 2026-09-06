import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import {
  getPatients, savePatient, deletePatient,
  getPlans, savePlan, deletePlan,
  getPriceItems, savePriceItem, deletePriceItem,
  getAllSettings, setSetting,
  getAppointments, saveAppointment, deleteAppointmentDB,
  getMedRecords, saveMedRecord, deleteMedRecord,
  getRoadmaps, saveRoadmap, deleteRoadmap,
} from '../services/db'
import { DEFAULT_PRICE_LIST } from '../data/defaultPriceList'

export const useStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  patients: [],
  plans: [],
  priceItems: [],
  appointments: [],
  medRecords: [],
  roadmaps: [],
  settings: {},
  isLoaded: false,

  // ── Init ───────────────────────────────────────────────────────────────────
  async init() {
    try {
      const [patients, plans, priceItems, appointments, medRecords, roadmaps, settings] = await Promise.all([
        getPatients(),
        getPlans(),
        getPriceItems(),
        getAppointments(),
        getMedRecords(),
        getRoadmaps(),
        getAllSettings()
      ])

      if (priceItems.length === 0) {
        const seeded = DEFAULT_PRICE_LIST.map(item => ({
          ...item,
          id: uuidv4(),
          isActive: true,
          createdAt: Date.now()
        }))
        for (const item of seeded) await savePriceItem(item)
        set({ patients, plans, priceItems: seeded, appointments, medRecords, roadmaps, settings, isLoaded: true })
      } else {
        set({ patients, plans, priceItems, appointments, medRecords, roadmaps, settings, isLoaded: true })
      }
    } catch (err) {
      console.error('SmilePlan init error:', err)
      set({ isLoaded: true })
    }
  },

  canAddPatient() { return true },

  // ── Patients ───────────────────────────────────────────────────────────────
  async addPatient(data) {
    const patient = {
      id: uuidv4(),
      fullName:  data.fullName  || '',
      phone:     data.phone     || '',
      birthDate: data.birthDate || '',
      gender:    data.gender    || '',
      source:    data.source    || '',
      allergies: data.allergies || '',
      notes:     data.notes     || '',
      photos: [],
      archived: false,
      createdAt: Date.now()
    }
    await savePatient(patient)
    set(s => ({ patients: [...s.patients, patient] }))
    return patient
  },
  async updatePatient(id, data) {
    const patient = { ...get().patients.find(p => p.id === id), ...data }
    await savePatient(patient)
    set(s => ({ patients: s.patients.map(p => p.id === id ? patient : p) }))
  },
  async archivePatient(id) {
    await get().updatePatient(id, { archived: true })
  },
  async removePatient(id) {
    await deletePatient(id)
    set(s => ({
      patients: s.patients.filter(p => p.id !== id),
      plans: s.plans.filter(pl => pl.patientId !== id)
    }))
  },

  // ── Plans ──────────────────────────────────────────────────────────────────
  async addPlan(patientId, items, note = '') {
    const plan = {
      id: uuidv4(),
      patientId,
      items,      // [{ toothId, serviceId, serviceName, price, icon }]
      note,
      total: items.reduce((sum, i) => sum + i.price, 0),
      createdAt: Date.now()
    }
    await savePlan(plan)
    set(s => ({ plans: [...s.plans, plan] }))
    return plan
  },
  async updatePlan(id, data) {
    const plan = { ...get().plans.find(p => p.id === id), ...data }
    plan.total = (plan.items || []).reduce((sum, i) => sum + i.price, 0)
    await savePlan(plan)
    set(s => ({ plans: s.plans.map(p => p.id === id ? plan : p) }))
  },
  async removePlan(id) {
    await deletePlan(id)
    set(s => ({ plans: s.plans.filter(p => p.id !== id) }))
  },

  // ── Price Items ────────────────────────────────────────────────────────────
  async addPriceItem(data) {
    const item = { id: uuidv4(), isActive: true, createdAt: Date.now(), ...data }
    await savePriceItem(item)
    set(s => ({ priceItems: [...s.priceItems, item] }))
    return item
  },
  async updatePriceItem(id, data) {
    const item = { ...get().priceItems.find(i => i.id === id), ...data }
    await savePriceItem(item)
    set(s => ({ priceItems: s.priceItems.map(i => i.id === id ? item : i) }))
  },
  async removePriceItem(id) {
    await deletePriceItem(id)
    set(s => ({ priceItems: s.priceItems.filter(i => i.id !== id) }))
  },

  // ── Appointments ───────────────────────────────────────────────────────────
  async addAppointment(appt) {
    await saveAppointment(appt)
    set(s => ({ appointments: [...s.appointments, appt] }))
  },
  async updateAppointment(appt) {
    await saveAppointment(appt)
    set(s => ({ appointments: s.appointments.map(a => a.id === appt.id ? appt : a) }))
  },
  async deleteAppointment(id) {
    await deleteAppointmentDB(id)
    set(s => ({ appointments: s.appointments.filter(a => a.id !== id) }))
  },

  // ── Medical Records ────────────────────────────────────────────────────────
  async addMedRecord(data) {
    const rec = { id: uuidv4(), createdAt: Date.now(), date: Date.now(), ...data }
    await saveMedRecord(rec)
    set(s => ({ medRecords: [...s.medRecords, rec] }))
    return rec
  },
  async updateMedRecord(id, data) {
    const existing = get().medRecords.find(r => r.id === id)
    const history = existing?.editHistory || []
    const snapshot = { at: Date.now(), fields: { ...existing } }
    delete snapshot.fields.editHistory
    const rec = { ...existing, ...data, editHistory: [...history, snapshot] }
    await saveMedRecord(rec)
    set(s => ({ medRecords: s.medRecords.map(r => r.id === id ? rec : r) }))
  },
  async removeMedRecord(id) {
    await deleteMedRecord(id)
    set(s => ({ medRecords: s.medRecords.filter(r => r.id !== id) }))
  },

  // ── Roadmaps ───────────────────────────────────────────────────────────────
  async addRoadmap(data) {
    const rm = { id: uuidv4(), createdAt: Date.now(), ...data }
    await saveRoadmap(rm)
    set(s => ({ roadmaps: [...s.roadmaps, rm] }))
    return rm
  },
  async removeRoadmap(id) {
    await deleteRoadmap(id)
    set(s => ({ roadmaps: s.roadmaps.filter(r => r.id !== id) }))
  },

  // ── Settings ───────────────────────────────────────────────────────────────
  async updateSettings(data) {
    for (const [k, v] of Object.entries(data)) {
      await setSetting(k, v)
    }
    set(s => ({ settings: { ...s.settings, ...data } }))
  }
}))
