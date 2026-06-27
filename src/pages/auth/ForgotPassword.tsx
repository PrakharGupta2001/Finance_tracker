import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    // Create the redirect URL based on the current window location to ensure it works on Netlify or localhost
    const resetUrl = `${window.location.origin}/reset-password`
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetUrl,
    })
    
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  return (
    <Card className="w-full shadow-lg border-primary/10">
      <CardHeader className="space-y-1">
        <CardTitle className="text-3xl font-bold font-heading text-center text-primary tracking-tight">FinancePro</CardTitle>
        <CardDescription className="text-center text-base">
          Reset your password
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="text-center space-y-4">
            <div className="p-3 text-sm text-green-700 bg-green-100 rounded-md dark:bg-green-900/30 dark:text-green-400">
              Check your email for the password reset link!
            </div>
            <Button asChild className="w-full mt-4" variant="outline">
              <Link to="/login">Back to Login</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            {error && <div className="p-3 text-sm text-destructive-foreground bg-destructive/90 rounded-md">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11 text-base font-semibold mt-2" disabled={loading}>
              {loading ? "Sending link..." : "Send Reset Link"}
            </Button>
          </form>
        )}
      </CardContent>
      {!success && (
        <CardFooter className="flex justify-center border-t border-border/50 pt-4 mt-2">
          <p className="text-sm text-muted-foreground">
            Remembered your password? <Link to="/login" className="text-primary hover:underline font-semibold">Sign in</Link>
          </p>
        </CardFooter>
      )}
    </Card>
  )
}
