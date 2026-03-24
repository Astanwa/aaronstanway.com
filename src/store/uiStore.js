import { create } from 'zustand'

export const useUIStore = create((set) => ({
  activeProject: null,
  currentSection: 0,
  setActiveProject: (project) => set({ activeProject: project }),
  clearActiveProject: () => set({ activeProject: null }),
  setCurrentSection: (index) => set({ currentSection: index }),
}))
