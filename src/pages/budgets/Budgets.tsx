import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Dialog } from '../../components/ui/dialog'
import { Plus, AlertTriangle, Trash2, Edit2 } from 'lucide-react'
import { useFinanceStore } from '../../store/financeStore'
import type { Budget } from '../../store/financeStore'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { calculateDailyAmortization } from '../../lib/utils'

export default function Budgets() {
  const { budgets, expenses, categories, deleteBudget, updateBudget, fetchData } = useFinanceStore()
  const { user } = useAuthStore()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)

  // Use the first category as default if none selected
  if (!categoryId && categories.length > 0) {
    setCategoryId(categories[0].id)
  }

  const openModal = (budget?: Budget) => {
    if (budget) {
      setEditingBudget(budget)
      setCategoryId(budget.category_id)
      setAmount(budget.amount.toString())
      setMonth(budget.month)
      setYear(budget.year)
    } else {
      setEditingBudget(null)
      setCategoryId(categories.length > 0 ? categories[0].id : '')
      setAmount('')
      setMonth(new Date().getMonth() + 1)
      setYear(new Date().getFullYear())
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)

    if (editingBudget) {
      await updateBudget(editingBudget.id, {
        category_id: categoryId,
        amount: parseFloat(amount),
        month: parseInt(month.toString()),
        year: parseInt(year.toString())
      })
      setLoading(false)
      setIsModalOpen(false)
      fetchData(user.id)
    } else {
      const { error } = await supabase.from('budgets').insert({
        user_id: user.id,
        category_id: categoryId,
        amount: parseFloat(amount),
        month: parseInt(month.toString()),
        year: parseInt(year.toString())
      })
      setLoading(false)
      if (!error) {
        setIsModalOpen(false)
        setAmount('')
        fetchData(user.id)
      } else {
        console.error(error)
        alert("Failed to create budget. This might be because a budget for this category and month already exists.")
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight text-foreground">Budgets</h1>
          <p className="text-muted-foreground mt-1">Manage your monthly spending limits.</p>
        </div>
        <Button onClick={() => openModal()} className="shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          New Budget
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => {
          // Calculate spent amount from expenses matching this category name, month and year
          // For distributed expenses, we check if the budget month falls within the allocation range,
          // and only add the EXACT amortized daily portion.
          
          let activeDistributedEndingDate = '';
          
          const spent = expenses
            .filter(e => {
              if (!e.date) return false;
              if (e.categories?.name !== budget.categories?.name) return false;
              
              if (e.expense_type === 'distributed' && e.end_date) {
                 const amortized = calculateDailyAmortization(e.amount, e.date, e.end_date, budget.month, budget.year);
                 if (amortized > 0) {
                   activeDistributedEndingDate = e.end_date;
                   return true;
                 }
                 return false;
              } else {
                 const [yearStr, monthStr] = e.date.split('-')
                 return parseInt(monthStr) === budget.month && parseInt(yearStr) === budget.year
              }
            })
            .reduce((sum, e) => {
              if (e.expense_type === 'distributed' && e.end_date) {
                return sum + calculateDailyAmortization(e.amount, e.date, e.end_date, budget.month, budget.year);
              }
              return sum + e.amount;
            }, 0)

          const usagePercent = Math.min((spent / budget.amount) * 100, 100)
          const isOver = spent > budget.amount
          const isNear = usagePercent > 80 && !isOver
          
          return (
            <Card key={budget.id} className={`relative group ${isOver ? "border-destructive/50 shadow-destructive/10" : ""}`}>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 hover:bg-secondary"
                  onClick={() => openModal(budget)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive hover:bg-destructive/10 h-8 w-8"
                  onClick={() => deleteBudget(budget.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-medium pr-8 truncate">
                    {budget.categories?.name || 'Category'}
                  </CardTitle>
                  {isOver && <AlertTriangle className="w-5 h-5 text-destructive animate-pulse flex-shrink-0" />}
                </div>
                <div className="text-xs text-muted-foreground">{budget.month}/{budget.year}</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-bold font-heading">₹{spent.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">of ₹{budget.amount.toLocaleString()}</span>
                </div>
                
                <div className="space-y-1">
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500`}
                      style={{ 
                        width: `${usagePercent}%`,
                        backgroundColor: isOver ? 'var(--destructive)' : isNear ? '#f59e0b' : budget.categories?.color || '#10b981' 
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-medium">
                    <span className={isOver ? "text-destructive" : "text-muted-foreground"}>
                      {usagePercent.toFixed(0)}% used
                      {activeDistributedEndingDate && <span className="block text-[10px] opacity-75 mt-0.5">Includes dist. expense ending {activeDistributedEndingDate}</span>}
                    </span>
                    <span className={isOver ? "text-destructive" : "text-muted-foreground"}>
                      {isOver ? `₹${(spent - budget.amount).toLocaleString(undefined, {maximumFractionDigits:0})} over limit` : `₹${(budget.amount - spent).toLocaleString(undefined, {maximumFractionDigits:0})} remaining`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {budgets.length === 0 && (
          <div className="col-span-full p-8 text-center text-muted-foreground border rounded-lg border-dashed">
            No budgets found. Create one to start managing your spending!
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-heading">{editingBudget ? 'Edit' : 'Create'} Budget</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select 
                id="category"
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {categories.map(c => <option key={c.id} value={c.id} className="bg-card text-foreground">{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Monthly Limit (₹)</Label>
              <Input id="amount" type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="month">Month (1-12)</Label>
                <Input id="month" type="number" min="1" max="12" required value={month} onChange={e => setMonth(parseInt(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input id="year" type="number" required value={year} onChange={e => setYear(parseInt(e.target.value))} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : editingBudget ? "Update Budget" : "Create Budget"}
            </Button>
          </form>
        </div>
      </Dialog>
    </div>
  )
}
