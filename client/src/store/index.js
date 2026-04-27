import { create } from 'zustand'

const isTokenValid = (token) => {
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 > Date.now()
  } catch { return false }
}

const storedToken = localStorage.getItem('execos_token')
const storedUser = localStorage.getItem('execos_user')
const initialToken = isTokenValid(storedToken) ? storedToken : null
const initialUser = initialToken ? (storedUser ? JSON.parse(storedUser) : null) : null

if (!initialToken && storedToken) {
  localStorage.removeItem('execos_token')
  localStorage.removeItem('execos_user')
}

export const useStore = create((set, get) => ({
  user: initialUser,
  token: initialToken,
  setAuth: (user, token) => {
    localStorage.setItem('execos_user', JSON.stringify(user))
    localStorage.setItem('execos_token', token)
    set({ user, token })
  },
  logout: () => {
    localStorage.removeItem('execos_user')
    localStorage.removeItem('execos_token')
    set({ user: null, token: null, activeTimer: null })
  },

  sidebarCollapsed: false,
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

  // Active timer shown in header bar
  activeTimer: null,
  setActiveTimer: (timer) => set({ activeTimer: timer }),

  checklist: JSON.parse(localStorage.getItem('execos_checklist_' + new Date().toDateString()) || '{}'),
  toggleCheck: (idx) => {
    const { checklist } = get()
    const next = { ...checklist, [idx]: !checklist[idx] }
    localStorage.setItem('execos_checklist_' + new Date().toDateString(), JSON.stringify(next))
    set({ checklist: next })
  },

  energy: parseInt(localStorage.getItem('execos_energy') || '7'),
  setEnergy: (v) => {
    localStorage.setItem('execos_energy', String(v))
    set({ energy: v })
  },
}))
