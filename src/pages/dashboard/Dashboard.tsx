import { useState } from 'react'
import { SummaryCards } from '../../components/dashboard/SummaryCards'
import { Charts } from '../../components/dashboard/Charts'

export default function Dashboard() {
  const [timeframe, setTimeframe] = useState<'monthly' | 'yearly'>('monthly')
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back. Here's your financial overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as 'monthly' | 'yearly')}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
          >
            <option value="monthly" className="bg-card text-foreground">Monthly View</option>
            <option value="yearly" className="bg-card text-foreground">Yearly View</option>
          </select>
        </div>
      </div>

      <SummaryCards timeframe={timeframe} />
      <Charts />
    </div>
  )
}
