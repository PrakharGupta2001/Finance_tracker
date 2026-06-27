import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Download, UploadCloud, Moon, Sun, AlertTriangle } from 'lucide-react'
import { useTheme } from '../../components/theme-provider'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useFinanceStore } from '../../store/financeStore'
import { Dialog } from '../../components/ui/dialog'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function parseCSVRow(str: string) {
  const result = [];
  let inQuotes = false;
  let currentVal = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (inQuotes) {
      if (char === '"') {
        if (i < str.length - 1 && str[i+1] === '"') {
          currentVal += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(currentVal);
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
  }
  result.push(currentVal);
  return result;
}

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const { user, signOut } = useAuthStore()
  const { expenses, incomes, categories, fetchData } = useFinanceStore()
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    setDeleteError(null)
    const { error } = await supabase.rpc('delete_user')
    if (error) {
      setDeleteError(error.message)
      setIsDeleting(false)
    } else {
      await signOut()
    }
  }

  const handleExportCSV = () => {
    const rows = [['Date', 'Category', 'Description', 'Payment Method', 'Debit', 'Credit']]
    const allData = [
      ...expenses.map(e => ({ ...e, recordType: 'Expense' })),
      ...incomes.map(i => ({ ...i, recordType: 'Income' }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    let totalDebitCSV = 0
    let totalCreditCSV = 0

    allData.forEach(item => {
      const anyItem = item as any
      const catName = item.recordType === 'Expense' ? anyItem.categories?.name || 'Other' : 'Income'
      const name = item.recordType === 'Expense' ? anyItem.expense_name : anyItem.source
      const method = anyItem.payment_method || '-'
      
      const debitStr = item.recordType === 'Expense' ? anyItem.amount.toString() : ''
      const creditStr = item.recordType === 'Income' ? anyItem.amount.toString() : ''
      
      if (item.recordType === 'Expense') totalDebitCSV += anyItem.amount
      if (item.recordType === 'Income') totalCreditCSV += anyItem.amount
      
      rows.push([
        item.date,
        catName,
        `"${name.replace(/"/g, '""')}"`,
        method,
        debitStr,
        creditStr
      ])
    })
    
    rows.push(['', '', 'TOTAL', '', totalDebitCSV.toString(), totalCreditCSV.toString()])
    rows.push(['', '', 'NET SAVINGS', '', '', (totalCreditCSV - totalDebitCSV).toString()])
    
    const csvContent = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `finance_tracker_backup_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.text('Financial Statement', 14, 22)
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30)
    
    let totalCredit = 0
    let totalDebit = 0
    
    const tableData = [
      ...expenses.map(e => ({ ...e, recordType: 'Debit' })),
      ...incomes.map(i => ({ ...i, recordType: 'Credit' }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(item => {
      const anyItem = item as any
      const catName = item.recordType === 'Debit' ? anyItem.categories?.name || 'Other' : 'Income'
      const name = item.recordType === 'Debit' ? anyItem.expense_name : anyItem.source
      
      const debitStr = item.recordType === 'Debit' ? `Rs. ${anyItem.amount.toLocaleString()}` : ''
      const creditStr = item.recordType === 'Credit' ? `Rs. ${anyItem.amount.toLocaleString()}` : ''
      
      if (item.recordType === 'Debit') {
        totalDebit += anyItem.amount
      } else {
        totalCredit += anyItem.amount
      }
      
      const method = anyItem.payment_method || '-'
      
      return [item.date, catName, name, method, debitStr, creditStr]
    })
    
    tableData.push(['', '', 'TOTAL', '', `Rs. ${totalDebit.toLocaleString()}`, `Rs. ${totalCredit.toLocaleString()}`])
    tableData.push(['', '', 'NET SAVINGS', '', '', `Rs. ${(totalCredit - totalDebit).toLocaleString()}`])
    
    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Category', 'Description', 'Method', 'Debit', 'Credit']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
    })
    
    doc.save(`finance_report_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return
    setIsImporting(true)
    
    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/)
      if (lines.length < 2) throw new Error("Invalid CSV format.")
      
      const expensesToInsert = []
      const incomesToInsert = []
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue
        const row = parseCSVRow(lines[i].trim())
        if (row.length < 5) continue
        
        const [date, catName, name, method, debitStr, creditStr] = row
        if (name === 'TOTAL' || name === 'NET SAVINGS') continue
        
        if (debitStr) {
          const amount = parseFloat(debitStr)
          if (isNaN(amount)) continue
          const cat = categories.find(c => c.name === catName)
          expensesToInsert.push({
            user_id: user.id,
            date,
            amount,
            expense_name: name,
            payment_method: method || 'Other',
            category_id: cat ? cat.id : categories[0]?.id || null,
            expense_type: 'one-time',
            allocated_months: 1
          })
        } else if (creditStr) {
          const amount = parseFloat(creditStr)
          if (isNaN(amount)) continue
          incomesToInsert.push({
            user_id: user.id,
            date,
            amount,
            source: name,
          })
        }
      }
      
      let errorCount = 0
      if (expensesToInsert.length > 0) {
        const { error } = await supabase.from('expenses').insert(expensesToInsert)
        if (error) errorCount++
      }
      if (incomesToInsert.length > 0) {
        const { error } = await supabase.from('income').insert(incomesToInsert)
        if (error) errorCount++
      }
      
      if (errorCount === 0) {
        alert("Data imported successfully!")
        fetchData(user.id)
      } else {
        alert("There were some errors importing the data.")
      }
    } catch (err: any) {
      alert("Failed to parse CSV: " + err.message)
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold font-heading tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences and data.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how FinancePro looks on your device.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Theme Preference</span>
            <div className="flex items-center gap-2">
              <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}>
                <Sun className="w-4 h-4 mr-2" />
                Light
              </Button>
              <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}>
                <Moon className="w-4 h-4 mr-2" />
                Dark
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export your financial data for external analysis or backup.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" className="w-full sm:w-auto" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export as CSV
            </Button>
            <Button variant="outline" className="w-full sm:w-auto" onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" />
              Export as PDF
            </Button>
            <div>
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleImportCSV} 
              />
              <Button 
                variant="outline" 
                className="w-full sm:w-auto" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
              >
                <UploadCloud className="w-4 h-4 mr-2" />
                {isImporting ? 'Importing...' : 'Import Data'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-destructive/20 mt-8">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Danger Zone
          </CardTitle>
          <CardDescription>Permanently delete your account and all associated data.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>Delete Account</Button>
          
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold font-heading">Are you absolutely sure?</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  This action cannot be undone. This will permanently delete your account
                  and remove your data from our servers.
                </p>
              </div>
              
              {deleteError && (
                <div className="p-3 text-sm text-destructive-foreground bg-destructive/90 rounded-md">
                  {deleteError}
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-4 border-t border-border/50">
                <Button variant="outline" disabled={isDeleting} onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Yes, delete my account"}
                </Button>
              </div>
            </div>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
