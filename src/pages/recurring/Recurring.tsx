import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Dialog } from '../../components/ui/dialog'
import { CalendarClock, Plus, Trash2, Edit2 } from 'lucide-react'
import { useFinanceStore } from '../../store/financeStore'
import type { RecurringExpense } from '../../store/financeStore'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'

export default function Recurring() {
  const { recurring, deleteRecurring, updateRecurring, categories, fetchData } = useFinanceStore()
  const { user } = useAuthStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState<RecurringExpense | null>(null)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState('monthly')
  const [nextDate, setNextDate] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [loading, setLoading] = useState(false)

  if (!categoryId && categories.length > 0) {
    setCategoryId(categories[0].id)
  }

  const openModal = (item?: RecurringExpense) => {
    if (item) {
      setEditingRecurring(item)
      setName(item.name)
      setAmount(item.amount.toString())
      setFrequency(item.frequency)
      setNextDate(new Date(item.next_due_date).toISOString().split('T')[0])
      setCategoryId(item.category_id)
    } else {
      setEditingRecurring(null)
      setName('')
      setAmount('')
      setFrequency('monthly')
      setNextDate('')
      setCategoryId(categories.length > 0 ? categories[0].id : '')
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)

    if (editingRecurring) {
      await updateRecurring(editingRecurring.id, {
        name,
        amount: parseFloat(amount),
        frequency,
        next_due_date: nextDate,
        category_id: categoryId
      })
      setLoading(false)
      setIsModalOpen(false)
      fetchData(user.id)
    } else {
      const { error } = await supabase.from('recurring_expenses').insert({
        user_id: user.id,
        name,
        amount: parseFloat(amount),
        frequency,
        next_due_date: nextDate,
        category_id: categoryId,
        is_active: true
      })

      setLoading(false)
      if (!error) {
        setIsModalOpen(false)
        setName('')
        setAmount('')
        setNextDate('')
        fetchData(user.id)
      } else {
        console.error(error)
        alert("Failed to create recurring expense")
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight text-foreground">Recurring Expenses</h1>
          <p className="text-muted-foreground mt-1">Track your subscriptions and regular payments.</p>
        </div>
        <Button onClick={() => openModal()} className="shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          New Subscription
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recurring.map((sub) => (
          <Card key={sub.id} className="relative group">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-secondary"
                onClick={() => openModal(sub)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-destructive hover:bg-destructive/10 h-8 w-8"
                onClick={() => deleteRecurring(sub.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-medium pr-8 truncate">{sub.name}</CardTitle>
                <span className="text-xs font-medium px-2 py-1 bg-secondary text-secondary-foreground rounded-full capitalize shrink-0">
                  {sub.frequency}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-heading mb-4 text-foreground">₹{sub.amount.toLocaleString()}</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 p-2 rounded-md w-full">
                  <CalendarClock className="w-4 h-4 text-primary" />
                  <span>Next: <strong className="text-foreground">{new Date(sub.next_due_date).toLocaleDateString()}</strong></span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {recurring.length === 0 && (
          <div className="col-span-full p-8 text-center text-muted-foreground border rounded-lg border-dashed">
            No recurring expenses found. Add your subscriptions here!
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-heading">{editingRecurring ? 'Edit' : 'Add'} Subscription</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Netflix, Rent" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input id="amount" type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="freq">Frequency</Label>
                <select 
                  id="freq"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="weekly" className="bg-card text-foreground">Weekly</option>
                  <option value="monthly" className="bg-card text-foreground">Monthly</option>
                  <option value="yearly" className="bg-card text-foreground">Yearly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nextDate">Next Due Date</Label>
                <Input id="nextDate" type="date" required value={nextDate} onChange={e => setNextDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select 
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {categories.map(c => <option key={c.id} value={c.id} className="bg-card text-foreground">{c.name}</option>)}
                </select>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : editingRecurring ? "Update Subscription" : "Add Subscription"}
            </Button>
          </form>
        </div>
      </Dialog>
    </div>
  )
}
