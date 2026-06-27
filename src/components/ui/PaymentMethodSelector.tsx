import { useState, useEffect } from 'react'
import { Label } from './label'

const paymentModes = {
  Cash: ['Offline'],
  UPI: ['Google Pay', 'PhonePe', 'Paytm', 'Amazon Pay', 'BHIM', 'Other'],
  Bank: ['NEFT', 'IMPS', 'RTGS', 'Cheque', 'Direct Transfer', 'Other'],
  Card: ['Credit Card', 'Debit Card'],
  Other: ['Cashback', 'Voucher', 'Wallet', 'Online']
}

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export function PaymentMethodSelector({ value, onChange }: Props) {
  // Parse initial value (e.g., "UPI - Google Pay")
  const initialMode = Object.keys(paymentModes).find(mode => value.startsWith(mode)) || 'UPI'
  const initialSub = value.includes(' - ') ? value.split(' - ')[1] : paymentModes[initialMode as keyof typeof paymentModes][0]

  const [mode, setMode] = useState(initialMode)
  const [subMode, setSubMode] = useState(initialSub)

  useEffect(() => {
    if (mode === 'Cash') {
      onChange('Cash')
    } else {
      onChange(`${mode} - ${subMode}`)
    }
  }, [mode, subMode, onChange])

  const handleModeChange = (newMode: string) => {
    setMode(newMode)
    setSubMode(paymentModes[newMode as keyof typeof paymentModes][0])
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="paymentMode">Payment Mode</Label>
        <select 
          id="paymentMode"
          value={mode}
          onChange={(e) => handleModeChange(e.target.value)}
          className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {Object.keys(paymentModes).map(m => (
            <option key={m} value={m} className="bg-card text-foreground">{m}</option>
          ))}
        </select>
      </div>
      
      {mode !== 'Cash' && (
        <div className="space-y-2">
          <Label htmlFor="paymentSubMode">From / Via</Label>
          <select 
            id="paymentSubMode"
            value={subMode}
            onChange={(e) => setSubMode(e.target.value)}
            className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {paymentModes[mode as keyof typeof paymentModes].map(sm => (
              <option key={sm} value={sm} className="bg-card text-foreground">{sm}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
