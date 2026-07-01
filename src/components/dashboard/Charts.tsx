import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useFinanceStore } from '../../store/financeStore'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6', '#64748b']

export function Charts({ selectedMonth = new Date().getMonth(), selectedYear = new Date().getFullYear() }: { selectedMonth?: number, selectedYear?: number }) {
  const { expenses, incomes } = useFinanceStore()
  
  // Calculate category totals
  const catTotals = expenses.reduce((acc, curr) => {
    const catName = curr.categories?.name || 'Other'
    acc[catName] = (acc[catName] || 0) + curr.amount
    return acc
  }, {} as Record<string, number>)
  
  let pieData = Object.entries(catTotals).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value)
  if (pieData.length === 0) pieData = [{ name: 'No Expenses', value: 1 }]

  // Calculate Area Chart data by splitting the current month into 4 weeks
  const currentMonth = selectedMonth
  const currentYear = selectedYear

  const data = [
    { name: 'Week 1', expense: 0, income: 0 },
    { name: 'Week 2', expense: 0, income: 0 },
    { name: 'Week 3', expense: 0, income: 0 },
    { name: 'Week 4', expense: 0, income: 0 },
  ]

  expenses.forEach(e => {
    if (!e.date) return
    const [y, m, d] = e.date.split('-').map(Number)
    if (m - 1 === currentMonth && y === currentYear) {
      if (d <= 7) data[0].expense += e.amount
      else if (d <= 14) data[1].expense += e.amount
      else if (d <= 21) data[2].expense += e.amount
      else data[3].expense += e.amount
    }
  })

  incomes.forEach(i => {
    if (!i.date) return
    const [y, m, d] = i.date.split('-').map(Number)
    if (m - 1 === currentMonth && y === currentYear) {
      if (d <= 7) data[0].income += i.amount
      else if (d <= 14) data[1].income += i.amount
      else if (d <= 21) data[2].income += i.amount
      else data[3].income += i.amount
    }
  })
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Cash Flow Overview</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                <Tooltip />
                <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Top Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-sm mt-2">
             {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-muted-foreground">{entry.name}</span>
                </div>
             ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
