import { SummaryCards } from '../../components/dashboard/SummaryCards'
import { Charts } from '../../components/dashboard/Charts'
import { Button } from '../../components/ui/button'
import { Filter } from 'lucide-react'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back. Here's your financial overview.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Dual Dashboard Views Toggle (Cash Flow vs Monthly Impact) */}
          <select className="hidden md:flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <option value="cash-flow" className="bg-card text-foreground">Cash Flow View</option>
            <option value="monthly-impact" className="bg-card text-foreground">Monthly Impact View</option>
          </select>
          <Button variant="outline" size="icon" className="md:hidden">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <SummaryCards />
      <Charts />
    </div>
  )
}
