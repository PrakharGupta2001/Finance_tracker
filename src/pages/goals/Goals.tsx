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

export default function Goals() {
  const { goals, deleteGoal, updateGoal, fetchData } = useFinanceStore()
  const { user } = useAuthStore()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [loading, setLoading] = useState(false)

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
        </div>
        <Button onClick={() => openModal()} className="shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          New Goal
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => {
          const progressPercent = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
          const isCompleted = goal.current_amount >= goal.target_amount
          
          return (
            <Card key={goal.id} className={isCompleted ? "border-primary/50 shadow-primary/10 bg-primary/5" : "relative group"}>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 hover:bg-secondary"
                  onClick={() => openModal(goal)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
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
                  <span className="text-2xl font-bold font-heading">₹{goal.current_amount.toLocaleString()}</span>
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
