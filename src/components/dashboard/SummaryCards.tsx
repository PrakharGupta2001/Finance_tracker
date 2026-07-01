import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { ArrowDownIcon, ArrowUpIcon, Wallet, PiggyBank } from 'lucide-react'
import { useFinanceStore } from '../../store/financeStore'
import { calculateDailyAmortization } from '../../lib/utils'

export function SummaryCards({ timeframe = 'monthly', selectedMonth = new Date().getMonth(), selectedYear = new Date().getFullYear() }: { timeframe?: 'monthly' | 'yearly', selectedMonth?: number, selectedYear?: number }) {
  const { expenses, incomes } = useFinanceStore()
  
  const currentMonth = selectedMonth
  const currentYear = selectedYear
  
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

  const yearlyExpense = expenses
    .filter(e => {
      if (!e.date) return false;
      if (e.expense_type === 'distributed' && e.end_date) {
        for (let m = 1; m <= 12; m++) {
          if (calculateDailyAmortization(e.amount, e.date, e.end_date, m, currentYear) > 0) return true;
        }
        return false;
      }
      const [yearStr] = e.date.split('-')
      return parseInt(yearStr) === currentYear
    })
    .reduce((sum, e) => {
      if (e.expense_type === 'distributed' && e.end_date) {
        let amortizedSum = 0;
        for (let m = 1; m <= 12; m++) {
          amortizedSum += calculateDailyAmortization(e.amount, e.date, e.end_date, m, currentYear)
        }
        return sum + amortizedSum;
      }
      return sum + e.amount;
    }, 0)
    
  const yearlyIncome = incomes
    .filter(i => {
      if (!i.date) return false;
      const [yearStr] = i.date.split('-')
      return parseInt(yearStr) === currentYear
    })
    .reduce((sum, i) => sum + i.amount, 0)

  const displayIncome = timeframe === 'monthly' ? monthlyIncome : yearlyIncome
  const displayExpense = timeframe === 'monthly' ? monthlyExpense : yearlyExpense
  const netSavings = displayIncome - displayExpense
  const savingsRate = displayIncome > 0 ? (netSavings / displayIncome) * 100 : 0

  const labelSuffix = timeframe === 'monthly' ? 'Monthly' : 'Yearly'
  const subtitleSuffix = timeframe === 'monthly' ? 'Current month' : currentYear.toString()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{labelSuffix} Income</CardTitle>
          <ArrowUpIcon className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-heading text-primary">₹{displayIncome.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">{timeframe === 'monthly' ? 'Fixed' : subtitleSuffix}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{labelSuffix} Expense</CardTitle>
          <ArrowDownIcon className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-heading">₹{Math.round(displayExpense).toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">{timeframe === 'monthly' ? 'Current month spending' : subtitleSuffix}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
          <PiggyBank className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-heading text-primary">₹{Math.round(netSavings).toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">{subtitleSuffix}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-heading">{savingsRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">{labelSuffix} target: &gt; 50%</p>
        </CardContent>
      </Card>
    </div>
  )
}
