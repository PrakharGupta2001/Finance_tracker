import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Sidebar } from '../components/layout/Sidebar'
import { MobileNav } from '../components/layout/MobileNav'
import { ExpenseEntryModal } from '../components/expenses/ExpenseEntryModal'
import { IncomeEntryModal } from '../components/expenses/IncomeEntryModal'
import { Button } from '../components/ui/button'
import { Plus } from 'lucide-react'
import { useUIStore } from '../store/uiStore'
import { useFinanceStore } from '../store/financeStore'
import { useEffect } from 'react'

export function MainLayout() {
  const { user, initialized } = useAuthStore()
  const { setExpenseModalOpen } = useUIStore()
  const { fetchData } = useFinanceStore()

  useEffect(() => {
    if (user && initialized) {
      fetchData(user.id)
    }
  }, [user, initialized, fetchData])

  if (!initialized) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground animate-pulse">Loading FinancePro...</p></div>
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen bg-background flex md:flex-row pb-20 md:pb-0">
      <Sidebar />
      <main className="flex-1 overflow-y-auto max-w-full relative">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
        
        {/* Desktop FAB */}
        <Button 
          size="icon" 
          className="hidden md:flex fixed bottom-8 right-8 w-14 h-14 rounded-full shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
          onClick={() => setExpenseModalOpen(true)}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </main>
      <MobileNav />
      <ExpenseEntryModal />
      <IncomeEntryModal />
    </div>
  )
}
