import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Dialog } from '../../components/ui/dialog'
import { Plus, AlertTriangle, Trash2, Edit2, ArrowLeft } from 'lucide-react'
import { useFinanceStore } from '../../store/financeStore'
import type { Budget } from '../../store/financeStore'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { calculateDailyAmortization } from '../../lib/utils'

export default function Budgets() {
  const { budgets, expenses, categories, deleteBudget, updateBudget, fetchData } = useFinanceStore()
  const { user } = useAuthStore()
  
  const [viewTab, setViewTab] = useState<'current' | 'previous'>('current')
  const [selectedPrevDate, setSelectedPrevDate] = useState<{ month: number, year: number } | null>(null)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const activeMonth = viewTab === 'current' ? currentMonth : (selectedPrevDate ? selectedPrevDate.month : prevMonth);
  const activeYear = viewTab === 'current' ? currentYear : (selectedPrevDate ? selectedPrevDate.year : prevYear);

  const [month, setMonth] = useState(activeMonth)
  const [year, setYear] = useState(activeYear)
  const [loading, setLoading] = useState(false)

  // Use the first category as default if none selected
  if (!categoryId && categories.length > 0) {
    setCategoryId(categories[0].id)
  }

  const pastMonths = useMemo(() => {
    let earliestYear = currentYear;
    let earliestMonth = currentMonth;
    budgets.forEach(b => {
      if (b.year < earliestYear || (b.year === earliestYear && b.month < earliestMonth)) {
        earliestYear = b.year;
        earliestMonth = b.month;
      }
    });
    
    const months = [];
    let y = earliestYear;
    let m = earliestMonth;
    while (y < currentYear || (y === currentYear && m < currentMonth)) {
      months.push({ year: y, month: m });
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }
    if (months.length === 0) {
      months.push({ year: prevYear, month: prevMonth });
    }
    return months.reverse(); 
  }, [budgets, currentMonth, currentYear, prevMonth, prevYear]);

  const effectiveBudgets = useMemo(() => {
    const active: Budget[] = [];
    const uniqueCategoryIds = Array.from(new Set(budgets.map(b => b.category_id)));

    for (const catId of uniqueCategoryIds) {
      const catBudgets = budgets.filter(b => b.category_id === catId);
      let match = catBudgets.find(b => b.month === activeMonth && b.year === activeYear);
      
      if (!match) {
        const pastBudgets = catBudgets.filter(b => b.year < activeYear || (b.year === activeYear && b.month < activeMonth));
        if (pastBudgets.length > 0) {
          pastBudgets.sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
          });
          match = { ...pastBudgets[0], id: 'synthetic_' + pastBudgets[0].id, month: activeMonth, year: activeYear };
        }
      }
      
      if (match) {
        active.push(match);
      }
    }
    return active;
  }, [budgets, activeMonth, activeYear]);

  const openModal = (budget?: Budget) => {
    if (budget && !budget.id.startsWith('synthetic_')) {
      setEditingBudget(budget)
      setCategoryId(budget.category_id)
      setAmount(budget.amount.toString())
      setMonth(budget.month)
      setYear(budget.year)
    } else if (budget && budget.id.startsWith('synthetic_')) {
      setEditingBudget(null)
      setCategoryId(budget.category_id)
      setAmount(budget.amount.toString())
      setMonth(activeMonth)
      setYear(activeYear)
    } else {
      setEditingBudget(null)
      setCategoryId(categories.length > 0 ? categories[0].id : '')
      setAmount('')
      setMonth(activeMonth)
      setYear(activeYear)
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight text-foreground">Budgets</h1>
          <p className="text-muted-foreground mt-1">Manage your monthly spending limits.</p>
        </div>
        <div className="flex items-center gap-2">
          {viewTab === 'previous' && selectedPrevDate && (
            <Button variant="outline" onClick={() => setSelectedPrevDate(null)} className="mr-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Months
            </Button>
          )}
          <div className="flex rounded-md bg-secondary p-1 mr-2">
            <button
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewTab === 'previous' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
              onClick={() => { setViewTab('previous'); setSelectedPrevDate(null); }}
            >
              Previous
            </button>
            <button
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewTab === 'current' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
              onClick={() => { setViewTab('current'); setSelectedPrevDate(null); }}
            >
              Current
            </button>
          </div>
          <Button onClick={() => openModal()} className="shadow-sm">
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">New Budget</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {viewTab === 'previous' && !selectedPrevDate ? (
          pastMonths.map((pm, idx) => (
            <Card key={idx} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedPrevDate(pm)}>
              <CardHeader>
                <CardTitle>{new Date(pm.year, pm.month - 1).toLocaleString('default', { month: 'long' })} {pm.year}</CardTitle>
              </CardHeader>
            </Card>
          ))
        ) : effectiveBudgets.map((budget) => {
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
              <div className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10 flex gap-1">
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
                  onClick={() => {
                    if (budget.id.startsWith('synthetic_')) {
                      alert("This budget is carried over from a previous month. To change the limit for this month, click Edit instead. You can set it to 0 if you no longer need it.")
                    } else {
                      deleteBudget(budget.id)
                    }
                  }}
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
                <div className="text-xs text-muted-foreground">
                  {new Date(budget.year, budget.month - 1).toLocaleString('default', { month: 'short' })} {budget.year}
                </div>
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
        {((viewTab === 'current') || (viewTab === 'previous' && selectedPrevDate)) && effectiveBudgets.length === 0 && (
          <div className="col-span-full p-8 text-center text-muted-foreground border rounded-lg border-dashed">
            No budgets found for this month. Create one to start managing your spending!
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
