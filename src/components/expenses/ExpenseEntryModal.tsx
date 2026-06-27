import React, { useState, useEffect } from 'react'
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

export function ExpenseEntryModal() {
  const { isExpenseModalOpen, setExpenseModalOpen } = useUIStore()
  const { user } = useAuthStore()
  const { categories, fetchData } = useFinanceStore()
  
  const [amount, setAmount] = useState('')
  const [name, setName] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [category, setCategory] = useState('Other')
  const [paymentMethod, setPaymentMethod] = useState('UPI - Google Pay')
  const [expenseType, setExpenseType] = useState('one-time')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)

  // Smart categorization logic (basic rule-based)
  useEffect(() => {
    const text = name.toLowerCase()
    if (text.includes('milk') || text.includes('grocery') || text.includes('vegetables')) setCategory('Groceries')
    else if (text.includes('zomato') || text.includes('swiggy') || text.includes('pizza') || text.includes('restaurant')) setCategory('Food and Dining')
    else if (text.includes('uber') || text.includes('ola') || text.includes('petrol') || text.includes('fuel')) setCategory('Transportation')
    else if (text.includes('gym') || text.includes('protein')) setCategory('Fitness')
    else if (text.includes('netflix') || text.includes('prime') || text.includes('movie') || text.includes('sports')) setCategory('Sports and Entertainment')
    else if (text.includes('medicine') || text.includes('doctor') || text.includes('hospital') || text.includes('pharmacy')) setCategory('Medical')
    else if (text.includes('rent')) setCategory('Rents')
    else if (text.includes('bill') || text.includes('emi')) setCategory('Bills and Emi')
  }, [name])

  const isBackdated = date !== format(new Date(), 'yyyy-MM-dd')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    
    const cat = categories.find(c => c.name === category)
    const category_id = cat ? cat.id : (categories.length > 0 ? categories[0].id : null)

    let allocated_months = 1;
    if (expenseType === 'distributed' && endDate) {
      const d1 = new Date(date);
      const d2 = new Date(endDate);
      const months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()) + 1;
      allocated_months = Math.max(1, months);
    }

    const { error } = await supabase.from('expenses').insert({
      user_id: user.id,
      amount: parseFloat(amount),
      expense_name: name,
      payment_method: paymentMethod,
      expense_type: expenseType,
      date: date,
      category_id: category_id,
      allocated_months: allocated_months,
      end_date: expenseType === 'distributed' && endDate ? endDate : null
    })
    
    if (!error && expenseType === 'recurring') {
      const d = new Date(date)
      d.setMonth(d.getMonth() + 1) // Set next due date to +1 month
      const nextDueDate = format(d, 'yyyy-MM-dd')
      
      await supabase.from('recurring_expenses').insert({
        user_id: user.id,
        category_id: category_id,
        name: name,
        amount: parseFloat(amount),
        frequency: 'monthly',
        next_due_date: nextDueDate,
        is_active: true
      })
    }
    
    setLoading(false)
    if (!error) {
      fetchData(user.id) // Refresh global state
      setExpenseModalOpen(false)
      // Reset form
      setAmount('')
      setName('')
      setDate(format(new Date(), 'yyyy-MM-dd'))
      setEndDate('')
      setCategory('Other')
    } else {
      console.error(error)
      alert("Failed to save expense: " + error.message)
    }
  }

  return (
    <Dialog open={isExpenseModalOpen} onOpenChange={setExpenseModalOpen}>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold font-heading">Add Expense</h2>
          {isBackdated ? (
            <p className="text-sm font-medium text-destructive">You are making a backdated entry.</p>
          ) : (
            <p className="text-sm text-muted-foreground">Quick entry mode</p>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input 
                id="amount" 
                type="number" 
                step="0.01" 
                required 
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg font-bold h-12"
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label htmlFor="date">Date</Label>
              <Input 
                id="date" 
                type="date" 
                required 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={isBackdated ? "border-destructive text-destructive h-12 focus-visible:ring-destructive" : "h-12"}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Expense Name</Label>
            <Input 
              id="name" 
              type="text" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Zomato lunch, Uber ride"
              className="h-12"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category (Auto-detect)</Label>
              <select 
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {categories.map(c => <option key={c.id} value={c.name} className="bg-card text-foreground">{c.name}</option>)}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expenseType">Expense Type</Label>
              <select 
                id="expenseType"
                value={expenseType}
                onChange={(e) => setExpenseType(e.target.value)}
                className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="one-time" className="bg-card text-foreground">One-Time</option>
                <option value="recurring" className="bg-card text-foreground">Recurring</option>
                <option value="distributed" className="bg-card text-foreground">Distributed</option>
              </select>
            </div>
          </div>
          
          <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
          
          {expenseType === 'distributed' && (
            <div className="space-y-2">
              <Label htmlFor="endDate">Distribution End Date</Label>
              <Input 
                id="endDate" 
                type="date" 
                required 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={date}
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">This expense will be evenly spread across your monthly budgets until the end date.</p>
            </div>
          )}

          <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
            {loading ? "Saving..." : "Save Expense"}
          </Button>
        </form>
      </div>
    </Dialog>
  )
}
