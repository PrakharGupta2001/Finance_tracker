import React, { useState } from 'react'
import { format } from 'date-fns'
import { Dialog } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { useUIStore } from '../../store/uiStore'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useFinanceStore } from '../../store/financeStore'
import { PaymentMethodSelector } from '../ui/PaymentMethodSelector'

export function IncomeEntryModal() {
  const { isIncomeModalOpen, setIncomeModalOpen } = useUIStore()
  const { user } = useAuthStore()
  const { fetchData } = useFinanceStore()
  
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [paymentMethod, setPaymentMethod] = useState('Bank - NEFT')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    
    const { error } = await supabase.from('income').insert({
      user_id: user.id,
      amount: parseFloat(amount),
      source: source,
      date: date,
      payment_method: paymentMethod,
      notes: notes
    })
    
    setLoading(false)
    if (!error) {
      fetchData(user.id)
      setIncomeModalOpen(false)
      setAmount('')
      setSource('')
      setDate(format(new Date(), 'yyyy-MM-dd'))
      setNotes('')
    } else {
      console.error(error)
      alert("Failed to save income")
    }
  }

  return (
    <Dialog open={isIncomeModalOpen} onOpenChange={setIncomeModalOpen}>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-primary">Log Income</h2>
          <p className="text-sm text-muted-foreground">Add salary or other earnings.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label htmlFor="inc-amount">Amount (₹)</Label>
              <Input id="inc-amount" type="number" step="0.01" required autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} className="text-lg font-bold h-12" placeholder="0.00" />
            </div>
            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label htmlFor="inc-date">Date</Label>
              <Input id="inc-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="h-12" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="inc-source">Income Source</Label>
            <Input id="inc-source" type="text" required value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Monthly Salary, Freelance" className="h-12" />
          </div>
          
          <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
          
          <div className="space-y-2">
            <Label htmlFor="inc-notes">Notes (Optional)</Label>
            <Input id="inc-notes" type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="h-12" />
          </div>

          <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
            {loading ? "Saving..." : "Save Income"}
          </Button>
        </form>
      </div>
    </Dialog>
  )
}
