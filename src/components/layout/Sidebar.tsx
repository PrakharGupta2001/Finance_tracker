import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Receipt, Wallet, Target, Repeat, Settings, LogOut, TrendingUp } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/button'
import { ThemeToggle } from '../ui/theme-toggle'

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Expenses', path: '/expenses', icon: Receipt },
  { name: 'Budgets', path: '/budgets', icon: Wallet },
  { name: 'Goals', path: '/goals', icon: Target },
  { name: 'Recurring', path: '/recurring', icon: Repeat },
  { name: 'Investments', path: '/investments', icon: TrendingUp },
  { name: 'Settings', path: '/settings', icon: Settings },
]

export function Sidebar() {
  const { signOut } = useAuthStore()

  return (
    <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
          <Wallet className="text-primary-foreground w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-foreground font-heading tracking-tight flex-1">FinancePro</h2>
        <ThemeToggle />
      </div>
      
      <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <item.icon className="w-4 h-4" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={() => signOut()}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  )
}
