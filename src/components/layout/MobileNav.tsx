import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Receipt, Wallet, Plus, Target } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useUIStore } from '../../store/uiStore'

const MOBILE_ITEMS = [
  { name: 'Home', path: '/', icon: LayoutDashboard },
  { name: 'Expenses', path: '/expenses', icon: Receipt },
  { name: 'Add', action: 'open_modal', icon: Plus, isFab: true },
  { name: 'Budgets', path: '/budgets', icon: Wallet },
  { name: 'Goals', path: '/goals', icon: Target },
]

export function MobileNav() {
  const { setExpenseModalOpen } = useUIStore()
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-2 pb-2 z-50">
      {MOBILE_ITEMS.map((item) => {
        if (item.isFab) {
          return (
            <button key={item.name} onClick={() => setExpenseModalOpen(true)} className="relative -top-5">
              <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary/90 transition-transform active:scale-95">
                <item.icon className="w-7 h-7" />
              </div>
            </button>
          )
        }

        return (
          <NavLink
            key={item.path}
            to={item.path!}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 p-2 min-w-[64px] transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.name}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
