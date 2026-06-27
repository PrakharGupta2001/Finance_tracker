import { useState } from 'react'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Search, Plus, Trash2 } from 'lucide-react'
import { useFinanceStore } from '../../store/financeStore'
import { useUIStore } from '../../store/uiStore'

export default function Expenses() {
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'expenses' | 'income'>('expenses')
  const { expenses, incomes, deleteExpense, deleteIncome } = useFinanceStore()
  const { setIncomeModalOpen, setExpenseModalOpen } = useUIStore()
  
  const filteredExpenses = expenses.filter(e => e.expense_name.toLowerCase().includes(search.toLowerCase()))
  const filteredIncomes = incomes.filter(i => i.source.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight text-foreground">Transactions</h1>
          <p className="text-muted-foreground mt-1">View and manage your financial history.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIncomeModalOpen(true)} variant="outline" className="shadow-sm border-primary text-primary hover:bg-primary/10">
            <Plus className="w-4 h-4 mr-2" />
            Log Income
          </Button>
          <Button onClick={() => setExpenseModalOpen(true)} className="shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Log Expense
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex rounded-md bg-secondary p-1">
            <button
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${view === 'expenses' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
              onClick={() => setView('expenses')}
            >
              Expenses
            </button>
            <button
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${view === 'income' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
              onClick={() => setView('income')}
            >
              Income
            </button>
          </div>
          
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={`Search ${view}...`}
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {view === 'expenses' ? (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Transaction</th>
                    <th className="px-6 py-4 font-medium">Category</th>
                    <th className="px-6 py-4 font-medium">Mode</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium text-right">Amount</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">{new Date(expense.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-medium">{expense.expense_name}</td>
                      <td className="px-6 py-4">
                        <span 
                          className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium text-white"
                          style={{ backgroundColor: expense.categories?.color || '#94a3b8' }}
                        >
                          {expense.categories?.name || 'Other'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{expense.payment_method || '-'}</td>
                      <td className="px-6 py-4 text-muted-foreground capitalize">{expense.expense_type}</td>
                      <td className="px-6 py-4 font-bold text-right text-foreground">₹{expense.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" onClick={() => deleteExpense(expense.id)} className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">No expenses found.</td></tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Source</th>
                    <th className="px-6 py-4 font-medium">Mode</th>
                    <th className="px-6 py-4 font-medium">Notes</th>
                    <th className="px-6 py-4 font-medium text-right">Amount</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredIncomes.map((income) => (
                    <tr key={income.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">{new Date(income.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-medium">{income.source}</td>
                      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{income.payment_method || '-'}</td>
                      <td className="px-6 py-4 text-muted-foreground">{income.notes || '-'}</td>
                      <td className="px-6 py-4 font-bold text-right text-primary">₹{income.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" onClick={() => deleteIncome(income.id)} className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredIncomes.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No income records found.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
