import { create } from 'zustand';

interface AppState {
  isHydrated: boolean;
  setHydrated: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isHydrated: false,
  setHydrated: () => set({ isHydrated: true }),
}));
