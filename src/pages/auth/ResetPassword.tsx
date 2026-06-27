import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if the user has an active session from the reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // If there is no session (and the hash hasn't been parsed yet), wait briefly
        // If still no session, they shouldn't be on this page.
        setTimeout(async () => {
            const { data: { session: delayedSession } } = await supabase.auth.getSession()
            if (!delayedSession) {
                setError("Your password reset link is invalid or has expired. Please request a new one.")
            }
        }, 1000)
      }
    }
    checkSession()
  }, [])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.updateUser({
      password: password
    })
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Password updated successfully, redirect to dashboard
      navigate('/')
    }
  }

  return (
    <Card className="w-full shadow-lg border-primary/10">
      <CardHeader className="space-y-1">
        <CardTitle className="text-3xl font-bold font-heading text-center text-primary tracking-tight">FinancePro</CardTitle>
        <CardDescription className="text-center text-base">
          Enter your new password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdate} className="space-y-4">
          {error && <div className="p-3 text-sm text-destructive-foreground bg-destructive/90 rounded-md">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input 
              id="password" 
              type="password" 
              required 
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
            />
          </div>
          <Button type="submit" className="w-full h-11 text-base font-semibold mt-2" disabled={loading || !!error}>
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
