import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Receipt, Wallet, Plus, Target, Menu, Repeat, Settings, LogOut, TrendingUp } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useUIStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'
import { Dialog } from '../ui/dialog'
import { ThemeToggle } from '../ui/theme-toggle'

const MOBILE_ITEMS = [
  { name: 'Home', path: '/', icon: LayoutDashboard },
  { name: 'Expenses', path: '/expenses', icon: Receipt },
  { name: 'Add', action: 'open_modal', icon: Plus, isFab: true },
  { name: 'Budgets', path: '/budgets', icon: Wallet },
  { name: 'Menu', action: 'open_menu', icon: Menu },
]

export function MobileNav() {
  const { setExpenseModalOpen } = useUIStore()
  const { signOut } = useAuthStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
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

          if (item.action === 'open_menu') {
            return (
              <button
                key={item.name}
                onClick={() => setIsMenuOpen(true)}
                className="flex flex-col items-center gap-1 p-2 min-w-[64px] transition-colors text-muted-foreground hover:text-foreground"
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.name}</span>
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

      <Dialog open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-bold font-heading">Menu</h2>
            <ThemeToggle />
          </div>
          
          <div className="flex flex-col gap-2">
            <NavLink to="/goals" onClick={() => setIsMenuOpen(false)} className={({isActive}) => cn("flex items-center p-3 rounded-md", isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent text-foreground font-medium")}>
              <Target className="w-5 h-5 mr-3" /> Goals
            </NavLink>
            <NavLink to="/recurring" onClick={() => setIsMenuOpen(false)} className={({isActive}) => cn("flex items-center p-3 rounded-md", isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent text-foreground font-medium")}>
              <Repeat className="w-5 h-5 mr-3" /> Recurring
            </NavLink>
            <NavLink to="/investments" onClick={() => setIsMenuOpen(false)} className={({isActive}) => cn("flex items-center p-3 rounded-md", isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent text-foreground font-medium")}>
              <TrendingUp className="w-5 h-5 mr-3" /> Investments
            </NavLink>
            <NavLink to="/settings" onClick={() => setIsMenuOpen(false)} className={({isActive}) => cn("flex items-center p-3 rounded-md", isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent text-foreground font-medium")}>
              <Settings className="w-5 h-5 mr-3" /> Settings
            </NavLink>
          </div>
          
          <button 
            onClick={() => { setIsMenuOpen(false); signOut(); }}
            className="flex items-center p-3 mt-4 text-destructive hover:bg-destructive/10 rounded-md w-full font-medium"
          >
            <LogOut className="w-5 h-5 mr-3" /> Sign Out
          </button>
        </div>
      </Dialog>
    </>
  )
}
