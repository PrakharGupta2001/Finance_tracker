import { useState } from 'react'
import { SummaryCards } from '../../components/dashboard/SummaryCards'
import { Charts } from '../../components/dashboard/Charts'

export default function Dashboard() {
  const [timeframe, setTimeframe] = useState<'monthly' | 'yearly'>('monthly')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back. Here's your financial overview.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {timeframe === 'monthly' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i} value={i} className="bg-card text-foreground">
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          )}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
          >
            {Array.from({ length: 10 }).map((_, i) => {
              const year = new Date().getFullYear() - 5 + i;
              return <option key={year} value={year} className="bg-card text-foreground">{year}</option>
            })}
          </select>
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

      <SummaryCards timeframe={timeframe} selectedMonth={selectedMonth} selectedYear={selectedYear} />
      <Charts selectedMonth={selectedMonth} selectedYear={selectedYear} />
    </div>
  )
}
