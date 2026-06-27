import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { ArrowDownIcon, ArrowUpIcon, Wallet, PiggyBank } from 'lucide-react'
import { useFinanceStore } from '../../store/financeStore'
import { calculateDailyAmortization } from '../../lib/utils'

export function SummaryCards() {
  const { expenses, incomes } = useFinanceStore()
  
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const monthlyExpense = expenses
    .filter(e => {
      if (!e.date) return false;
      if (e.expense_type === 'distributed' && e.end_date) {
        return calculateDailyAmortization(e.amount, e.date, e.end_date, currentMonth + 1, currentYear) > 0;
      }
      const [yearStr, monthStr] = e.date.split('-')
      return parseInt(monthStr) - 1 === currentMonth && parseInt(yearStr) === currentYear
    })
    .reduce((sum, e) => {
      if (e.expense_type === 'distributed' && e.end_date) {
        return sum + calculateDailyAmortization(e.amount, e.date, e.end_date, currentMonth + 1, currentYear);
      }
      return sum + e.amount;
    }, 0)
    
  const monthlyIncome = incomes
    .filter(i => {
      if (!i.date) return false;
      const [yearStr, monthStr] = i.date.split('-')
      return parseInt(monthStr) - 1 === currentMonth && parseInt(yearStr) === currentYear
    })
    .reduce((sum, i) => sum + i.amount, 0)

  const netSavings = monthlyIncome - monthlyExpense
  const savingsRate = monthlyIncome > 0 ? (netSavings / monthlyIncome) * 100 : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
          <ArrowUpIcon className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-heading text-primary">₹{monthlyIncome.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Fixed</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Expense</CardTitle>
          <ArrowDownIcon className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-heading">₹{monthlyExpense.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Current month spending</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
          <PiggyBank className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-heading text-primary">₹{netSavings.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Current month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-heading">{savingsRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">Target: &gt; 50%</p>
        </CardContent>
      </Card>
    </div>
  )
}
