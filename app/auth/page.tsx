'use client'

import { createClient } from '@/lib/supabase-browser'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      })
      if (error) alert(error.message)
      else alert('Check your email for confirmation!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) alert(error.message)
      else router.push('/')
    }

    setLoading(false)
  }

  const handleGoogleAuth = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900">
      <div className="glass-panel rounded-2xl border border-white/10 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-accent-blue to-accent-purple rounded-2xl flex items-center justify-center">
            <i className="fas fa-robot text-white text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-white">AgentForge Studio</h1>
          <p className="text-gray-400 mt-2">Build intelligent agent systems</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-dark-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent-blue/50"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-dark-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent-blue/50"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-blue hover:bg-blue-600 text-white py-3 rounded-lg font-medium transition-all disabled:opacity-50"
          >
            {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-dark-800 text-gray-500">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleAuth}
            className="mt-4 w-full glass-panel border border-white/10 hover:bg-white/5 text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
          >
            <i className="fab fa-google text-red-400"></i> Google
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-accent-blue hover:underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  )
}
