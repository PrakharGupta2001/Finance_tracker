import { create } from 'zustand'

interface UIState {
  isExpenseModalOpen: boolean
  setExpenseModalOpen: (open: boolean) => void
  isIncomeModalOpen: boolean
  setIncomeModalOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  isExpenseModalOpen: false,
  setExpenseModalOpen: (open) => set({ isExpenseModalOpen: open }),
  isIncomeModalOpen: false,
  setIncomeModalOpen: (open) => set({ isIncomeModalOpen: open })
}))
