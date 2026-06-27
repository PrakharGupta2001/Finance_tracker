import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Dialog } from '../../components/ui/dialog'
import { Plus, Target, Calendar, Trash2, Edit2 } from 'lucide-react'
import { useFinanceStore } from '../../store/financeStore'
import type { Goal } from '../../store/financeStore'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { Check } from 'lucide-react'

export default function Goals() {
  const { goals, deleteGoal, updateGoal, fetchData, incomes, expenses, categories } = useFinanceStore()
  const { user } = useAuthStore()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'active' | 'achieved'>('active')

  // Unified Savings Calculation
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0)
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const totalSavings = Math.max(0, totalIncome - totalExpenses)

  const handleClaimGoal = async (goal: Goal) => {
    if (!user) return
    setLoading(true)
    
    // 1. Find or create 'Goal' category
    let goalCategory = categories.find(c => c.name.toLowerCase() === 'goal')
    if (!goalCategory) {
      const { data } = await supabase.from('categories').insert({
        user_id: user.id,
        name: 'Goal',
        color: '#fcd34d',
        icon: 'target',
        type: 'expense',
        is_default: false
      }).select().single()
      
      if (data) goalCategory = data
    }

    // 2. Create an expense to deduct the savings
    const { error: expError } = await supabase.from('expenses').insert({
      user_id: user.id,
      amount: goal.target_amount,
      expense_name: `Goal Achieved: ${goal.name}`,
      payment_method: 'Savings',
      expense_type: 'one-time',
      date: new Date().toISOString().split('T')[0],
      category_id: goalCategory?.id || null,
      allocated_months: 1
    })
    
    if (expError) {
      alert("Failed to claim goal: " + expError.message)
      setLoading(false)
      return
    }
    
    // 2. Mark the goal as achieved instead of deleting it
    await updateGoal(goal.id, { status: 'achieved' })
    
    // 3. Refresh
    await fetchData(user.id)
    setLoading(false)
  }

  const openModal = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal)
      setName(goal.name)
      setTargetAmount(goal.target_amount.toString())
      setTargetDate(goal.target_date ? new Date(goal.target_date).toISOString().split('T')[0] : '')
    } else {
      setEditingGoal(null)
      setName('')
      setTargetAmount('')
      setTargetDate('')
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)

    if (editingGoal) {
      await updateGoal(editingGoal.id, {
        name,
        target_amount: parseFloat(targetAmount),
        target_date: targetDate || undefined
      })
      setLoading(false)
      setIsModalOpen(false)
    } else {
      const { error } = await supabase.from('goals').insert({
        user_id: user.id,
        name,
        target_amount: parseFloat(targetAmount),
        target_date: targetDate || undefined,
        current_amount: 0
      })
      setLoading(false)
      if (!error) {
        setIsModalOpen(false)
        fetchData(user.id)
      } else {
        console.error(error)
        alert("Failed to create goal")
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight text-foreground">Savings Goals</h1>
          <p className="text-muted-foreground mt-1">Track progress towards your dreams.</p>
          <div className="mt-4 px-4 py-2 bg-primary/10 rounded-lg inline-block border border-primary/20">
            <span className="text-sm font-medium text-muted-foreground mr-2">Total Unified Savings:</span>
            <span className="text-xl font-bold text-primary font-heading">₹{totalSavings.toLocaleString()}</span>
          </div>
        </div>
        <Button onClick={() => openModal()} className="shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          New Goal
        </Button>
      </div>

      <div className="flex space-x-2 border-b border-border pb-4">
        <Button variant={filter === 'active' ? 'default' : 'outline'} onClick={() => setFilter('active')}>
          Current Goals
        </Button>
        <Button variant={filter === 'achieved' ? 'default' : 'outline'} onClick={() => setFilter('achieved')}>
          Achieved Goals
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {goals.filter(g => filter === 'active' ? g.status !== 'achieved' : g.status === 'achieved').map((goal) => {
          const isAchieved = goal.status === 'achieved'
          const progressPercent = isAchieved ? 100 : Math.min((totalSavings / goal.target_amount) * 100, 100)
          const isCompleted = isAchieved || totalSavings >= goal.target_amount
          
          return (
            <Card key={goal.id} className={`relative group ${isCompleted ? "border-primary/50 shadow-primary/10 bg-primary/5" : ""}`}>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
                {!isAchieved && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-secondary"
                    onClick={() => openModal(goal)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive hover:bg-destructive/10 h-8 w-8"
                  onClick={() => deleteGoal(goal.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-medium flex items-center gap-2 pr-8">
                    <Target className={`w-5 h-5 flex-shrink-0 ${isCompleted ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="truncate">{goal.name}</span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-bold font-heading text-primary">₹{(isAchieved ? goal.target_amount : totalSavings).toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">of ₹{goal.target_amount.toLocaleString()}</span>
                </div>
                
                <div className="space-y-1">
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 bg-primary`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">
                      {progressPercent.toFixed(1)}% {isCompleted ? 'Completed! 🎉' : ''}
                    </span>
                    {!isCompleted && goal.target_date && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(goal.target_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {!isAchieved && isCompleted && (
                  <Button 
                    className="w-full mt-2" 
                    variant="default"
                    onClick={() => handleClaimGoal(goal)}
                    disabled={loading}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Claim Goal
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
        {goals.length === 0 && (
          <div className="col-span-full p-8 text-center text-muted-foreground border rounded-lg border-dashed">
            No goals found. Create one to start saving!
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-heading">{editingGoal ? 'Edit' : 'Create'} Savings Goal</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Goal Name</Label>
              <Input id="name" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Emergency Fund" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target">Target Amount (₹)</Label>
                <Input id="target" type="number" step="0.01" required value={targetAmount} onChange={e => setTargetAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Target Date</Label>
                <Input id="date" type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : editingGoal ? "Update Goal" : "Create Goal"}
            </Button>
          </form>
        </div>
      </Dialog>
    </div>
  )
}
