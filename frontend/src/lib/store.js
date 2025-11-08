import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Auth Store
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
)

// Complaints Store
export const useComplaintsStore = create((set) => ({
  complaints: [],
  loading: false,
  error: null,

  setComplaints: (complaints) => set({ complaints }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  addComplaint: (complaint) => 
    set((state) => ({ complaints: [complaint, ...state.complaints] })),
  
  updateComplaint: (id, updates) =>
    set((state) => ({
      complaints: state.complaints.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),
  
  deleteComplaint: (id) =>
    set((state) => ({
      complaints: state.complaints.filter((c) => c.id !== id),
    })),
}))

// Zones Store
export const useZonesStore = create((set) => ({
  zones: [],
  loading: false,
  error: null,

  setZones: (zones) => set({ zones }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  addZone: (zone) => 
    set((state) => ({ zones: [...state.zones, zone] })),
  
  updateZone: (id, updates) =>
    set((state) => ({
      zones: state.zones.map((z) =>
        z.id === id ? { ...z, ...updates } : z
      ),
    })),
  
  deleteZone: (id) =>
    set((state) => ({
      zones: state.zones.filter((z) => z.id !== id),
    })),
}))

// Rewards Store
export const useRewardsStore = create((set) => ({
  points: 0,
  badges: [],
  level: 1,
  
  setPoints: (points) => set({ points }),
  addPoints: (amount) => set((state) => ({ points: state.points + amount })),
  
  setBadges: (badges) => set({ badges }),
  addBadge: (badge) => 
    set((state) => ({ badges: [...state.badges, badge] })),
  
  setLevel: (level) => set({ level }),
}))
