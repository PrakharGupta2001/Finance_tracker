import { useState } from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Dialog } from '../../components/ui/dialog'
import { Plus, Trash2, TrendingUp, TrendingDown, RefreshCw, DollarSign } from 'lucide-react'
import { useFinanceStore } from '../../store/financeStore'
import type { Investment } from '../../store/financeStore'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'

export default function Investments() {
  const { investments, deleteInvestment, updateInvestment, addInvestment, categories, fetchData } = useFinanceStore()
  const { user } = useAuthStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'create' | 'buy' | 'sell' | 'update'>('create')
  const [activeInvestment, setActiveInvestment] = useState<Investment | null>(null)

  const [name, setName] = useState('')
  const [type, setType] = useState('Stock')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(false)

  const totalInvested = investments.reduce((sum, inv) => sum + inv.invested_amount, 0)
  const totalValue = investments.reduce((sum, inv) => sum + inv.current_value, 0)
  const totalProfit = totalValue - totalInvested
  const profitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0

  const openCreateModal = () => {
    setModalType('create')
    setName('')
    setType('Stock')
    setAmount('')
    setDate(format(new Date(), 'yyyy-MM-dd'))
    setActiveInvestment(null)
    setIsModalOpen(true)
  }

  const openActionModal = (inv: Investment, type: 'buy' | 'sell' | 'update') => {
    setModalType(type)
    setActiveInvestment(inv)
    setAmount(type === 'update' ? inv.current_value.toString() : '')
    setDate(format(new Date(), 'yyyy-MM-dd'))
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)

    try {
      if (modalType === 'create') {
        await addInvestment({
          name,
          type,
          invested_amount: parseFloat(amount) || 0,
          current_value: parseFloat(amount) || 0
        })

        if (parseFloat(amount) > 0) {
          let cat = categories.find(c => c.name.toLowerCase() === 'investment')
          if (!cat) {
            const { data } = await supabase.from('categories').insert({
              user_id: user.id,
              name: 'Investment',
              color: '#8b5cf6',
              icon: 'trending-up',
              type: 'expense',
              is_default: true
            }).select().single()
            if (data) {
              cat = data
              fetchData(user.id)
            }
          }

          await supabase.from('expenses').insert({
            user_id: user.id,
            amount: parseFloat(amount),
            expense_name: `Investment: ${name}`,
            payment_method: 'Auto-logged',
            expense_type: 'one-time',
            date: date,
            category_id: cat?.id || null,
            allocated_months: 1
          })
        }
      } else if (activeInvestment) {
        const val = parseFloat(amount)
        if (modalType === 'update') {
          await updateInvestment(activeInvestment.id, { current_value: val })
        } else if (modalType === 'buy') {
          await updateInvestment(activeInvestment.id, {
            invested_amount: activeInvestment.invested_amount + val,
            current_value: activeInvestment.current_value + val
          })
          
          let cat = categories.find(c => c.name.toLowerCase() === 'investment')
          if (!cat) {
            const { data } = await supabase.from('categories').insert({
              user_id: user.id,
              name: 'Investment',
              color: '#8b5cf6',
              icon: 'trending-up',
              type: 'expense',
              is_default: true
            }).select().single()
            if (data) {
              cat = data
              fetchData(user.id)
            }
          }

          await supabase.from('expenses').insert({
            user_id: user.id,
            amount: val,
            expense_name: `Investment Buy: ${activeInvestment.name}`,
            payment_method: 'Auto-logged',
            expense_type: 'one-time',
            date: date,
            category_id: cat?.id || null,
            allocated_months: 1
          })
        } else if (modalType === 'sell') {
          await updateInvestment(activeInvestment.id, {
            invested_amount: Math.max(0, activeInvestment.invested_amount - val),
            current_value: Math.max(0, activeInvestment.current_value - val)
          })
          
          await supabase.from('income').insert({
            user_id: user.id,
            amount: val,
            source: `Investment Sell: ${activeInvestment.name}`,
            date: date,
            notes: 'Auto-logged from Investments tab'
          })
        }
      }
      
      await fetchData(user.id)
      setIsModalOpen(false)
    } catch (err: any) {
      alert("Error saving data: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight text-foreground">Portfolio</h1>
          <p className="text-muted-foreground mt-1">Track and manage your investments.</p>
        </div>
        <Button onClick={openCreateModal} className="shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Asset
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Invested</p>
            <p className="text-2xl font-bold font-heading text-foreground">₹{totalInvested.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Current Value</p>
            <p className="text-2xl font-bold font-heading text-primary">₹{totalValue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Return</p>
            <div className="flex items-baseline gap-2">
              <p className={`text-2xl font-bold font-heading ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalProfit >= 0 ? '+' : ''}₹{totalProfit.toLocaleString()}
              </p>
              <span className={`text-sm font-medium ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ({profitPercentage.toFixed(2)}%)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {investments.map((inv) => {
          const profit = inv.current_value - inv.invested_amount
          const percent = inv.invested_amount > 0 ? (profit / inv.invested_amount) * 100 : 0
          
          return (
            <Card key={inv.id} className="relative group">
              <div className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive hover:bg-destructive/10 h-8 w-8"
                  onClick={() => deleteInvestment(inv.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-medium pr-8 truncate">{inv.name}</CardTitle>
                  <span className="text-xs font-medium px-2 py-1 bg-secondary text-secondary-foreground rounded-full capitalize shrink-0">
                    {inv.type}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Value</p>
                    <p className="text-2xl font-bold font-heading text-foreground">₹{inv.current_value.toLocaleString()}</p>
                  </div>
                  <div className={`text-right ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    <p className="text-sm font-bold flex items-center justify-end">
                      {profit >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {profit >= 0 ? '+' : ''}₹{Math.abs(profit).toLocaleString()}
                    </p>
                    <p className="text-xs font-medium">{profit >= 0 ? '+' : ''}{percent.toFixed(2)}%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                  <span className="text-muted-foreground">Invested: ₹{inv.invested_amount.toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => openActionModal(inv, 'buy')} className="w-full text-xs h-8">
                    <Plus className="w-3 h-3 mr-1" /> Buy
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openActionModal(inv, 'sell')} className="w-full text-xs h-8">
                    <DollarSign className="w-3 h-3 mr-1" /> Sell
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => openActionModal(inv, 'update')} className="w-full text-xs h-8">
                    <RefreshCw className="w-3 h-3 mr-1" /> Update
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {investments.length === 0 && (
          <div className="col-span-full p-8 text-center text-muted-foreground border rounded-lg border-dashed">
            No investments found. Add an asset to start tracking your portfolio!
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-heading capitalize">
            {modalType === 'create' ? 'Add New Asset' : `${modalType} Asset`}
          </h2>
          {activeInvestment && (
            <p className="text-sm text-muted-foreground">
              Asset: <span className="font-bold text-foreground">{activeInvestment.name}</span>
            </p>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {modalType === 'create' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Asset Name</Label>
                  <Input id="name" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Apple Stock, HDFC SIP" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Asset Type</Label>
                  <select 
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="Stock" className="bg-card text-foreground">Stock</option>
                    <option value="SIP" className="bg-card text-foreground">SIP / Mutual Fund</option>
                    <option value="Crypto" className="bg-card text-foreground">Crypto</option>
                    <option value="FD" className="bg-card text-foreground">Fixed Deposit</option>
                    <option value="Other" className="bg-card text-foreground">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Initial Investment (₹)</Label>
                  <Input id="amount" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" required value={date} onChange={e => setDate(e.target.value)} />
                </div>
              </>
            )}

            {modalType !== 'create' && (
              <div className="space-y-2">
                <Label htmlFor="amount">
                  {modalType === 'update' ? 'New Current Value (₹)' : `${modalType === 'buy' ? 'Buy' : 'Sell'} Amount (₹)`}
                </Label>
                <Input id="amount" type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
                {modalType !== 'update' && (
                  <div className="pt-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" required value={date} onChange={e => setDate(e.target.value)} className="mt-1" />
                  </div>
                )}
                {modalType === 'buy' && <p className="text-xs text-muted-foreground mt-1">This will automatically log an expense and deduct from your unified savings.</p>}
                {modalType === 'sell' && <p className="text-xs text-muted-foreground mt-1">This will automatically log an income and add to your unified savings.</p>}
                {modalType === 'update' && <p className="text-xs text-muted-foreground mt-1">Update this when the market goes up or down to track your profits.</p>}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Confirm"}
            </Button>
          </form>
        </div>
      </Dialog>
    </div>
  )
}
