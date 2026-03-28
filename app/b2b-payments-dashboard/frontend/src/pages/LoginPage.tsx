import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const DEMO_EMAIL = 'admin@company.com'
const DEMO_PASSWORD = 'admin123'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Attempt real backend login
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (res.ok) {
        const data = await res.json() as { token?: string; access_token?: string }
        const token = data.token ?? data.access_token ?? ''
        if (token) {
          login(token)
          navigate('/', { replace: true })
          return
        }
      }
    } catch {
      // Backend unavailable — fall through to demo credential check
    }

    // Demo credential fallback
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      login('demo-jwt-token-paylens-2026')
      navigate('/', { replace: true })
    } else {
      setError('Invalid email or password.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0f1e3d] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500 shadow-lg shadow-indigo-900/50">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-semibold text-xl tracking-wide">PayLens</div>
            <div className="text-white/40 text-xs">Analytics Platform</div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          <h2 className="text-white text-xl font-semibold mb-1">Welcome back</h2>
          <p className="text-white/50 text-sm mb-6">Sign in to your account to continue</p>

          {error && (
            <div className="flex items-center gap-2 mb-5 px-3 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span className="text-rose-300 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-white/70 text-xs font-medium mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-white/8 border border-white/15 rounded-lg px-3 py-2.5 text-white text-sm placeholder-white/30 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-white/70 text-xs font-medium mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/8 border border-white/15 rounded-lg px-3 py-2.5 pr-10 text-white text-sm placeholder-white/30 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium text-sm py-2.5 rounded-lg transition-colors shadow-lg shadow-indigo-900/40"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-5 pt-5 border-t border-white/10 text-center">
            <p className="text-white/30 text-xs">
              Demo credentials: <span className="text-white/50">admin@company.com</span> / <span className="text-white/50">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
