'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { setLoginTimestamp } from '@/lib/auth'
import toast from 'react-hot-toast'

type Tab = 'login' | 'signup'

// ─── Signup sub-form (shown on Sign Up tab) ───────────────────────────────
function SignupForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', department: '', designation: '', phone: '',
  })
  const up = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const DEPARTMENTS = [
    'Engineering','Design','Product','Marketing',
    'Sales','HR','Finance','Operations','Support',
  ]

  async function handle(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    const supabase = createClient()
    console.log('Signup attempt with:', { email: form.email, full_name: form.full_name })
    const { data, error } = await supabase.auth.signUp({
      email:    form.email,
      password: form.password,
      options:  { data: { full_name: form.full_name, role: 'employee', department: form.department, designation: form.designation, phone: form.phone } },
    })
    console.log('Signup response:', { data, error })
    if (error) { toast.error(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').update({ department: form.department, designation: form.designation, phone: form.phone }).eq('user_id', data.user.id)
      setLoginTimestamp()
      toast.success('Welcome to SG Infinity!')
      router.push('/employee/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handle} className="space-y-4">
      {/* Full name */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
        <input type="text" value={form.full_name} onChange={e => up('full_name', e.target.value)} required placeholder="Your full name"
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all" />
      </div>
      {/* Email */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
        <input type="email" value={form.email} onChange={e => up('email', e.target.value)} required placeholder="name@company.com"
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all" />
      </div>
      {/* Dept + Designation */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Department</label>
          <select value={form.department} onChange={e => up('department', e.target.value)} required
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all">
            <option value="">Select</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Designation</label>
          <input type="text" value={form.designation} onChange={e => up('designation', e.target.value)} placeholder="e.g. Developer"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all" />
        </div>
      </div>
      {/* Password */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
        <input type="password" value={form.password} onChange={e => up('password', e.target.value)} required minLength={8} placeholder="Min 8 characters"
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors shadow-btn mt-1">
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  )
}

// ─── Main Login Page ─────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab]           = useState<Tab>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    console.log('Login attempt with:', email)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    console.log('Login response:', { data, error })
    if (error) { toast.error(error.message); setLoading(false); return }
    if (data.user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', data.user.id).single()
      setLoginTimestamp()
      if (profile?.role === 'admin') { router.push('/admin/dashboard'); router.refresh() }
      else {
        const { data: notifs } = await supabase.from('notifications').select('id').eq('user_id', data.user.id).eq('is_read', false)
        if (notifs && notifs.length > 0) toast.success(`${notifs.length} new notification${notifs.length > 1 ? 's' : ''} waiting!`)
        router.push('/employee/dashboard'); router.refresh()
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT — Gradient hero panel ─────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #ede9fe 40%, #fdf4ff 70%, #fce7f3 100%)' }}>

        {/* Soft blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-72 h-72 rounded-full bg-brand-200/30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-5%] right-[-5%] w-80 h-80 rounded-full bg-purple-200/30 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-pink-100/20 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-btn">
            <span className="text-white text-sm font-bold">∞</span>
          </div>
          <span className="text-sm font-bold text-slate-800">SG Infinity</span>
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <h1 className="text-4xl font-light text-slate-700 leading-tight mb-4">
            Step into the{' '}
            <span className="font-semibold text-brand-500">Luminous</span>
            <br />Workspace.
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
            Elevate your team's productivity with our editorially designed ecosystem.
            Experience clarity through tonal layering and fluid motion.
          </p>
        </div>

        {/* Social proof */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex -space-x-2">
            {['bg-indigo-400','bg-purple-400','bg-pink-400'].map((c, i) => (
              <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}>
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700">Join 2,000+ teams</p>
            <p className="text-xs text-slate-400">managing tasks with SG Infinity</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT — Auth card ───────────────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-slate-50 px-6 py-12">

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[400px]"
        >
          {/* Tab switcher */}
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 mb-8 shadow-card">
            {(['login', 'signup'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all capitalize ${
                  tab === t
                    ? 'bg-brand-500 text-white shadow-btn'
                    : 'text-slate-500 hover:text-slate-700'
                }`}>
                {t === 'login' ? 'Login' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-8">

            <AnimatePresence mode="wait">
              {tab === 'login' ? (
                <motion.div key="login" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.2 }}>

                  <h2 className="text-xl font-bold text-slate-900 mb-1">Welcome Back</h2>
                  <p className="text-sm text-slate-500 mb-6">Please enter your workspace credentials.</p>

                  <form onSubmit={handleLogin} className="space-y-4">
                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        Email Address
                      </label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                        placeholder="name@company.com" autoComplete="email"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all" />
                    </div>

                    {/* Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
                        <button type="button" className="text-xs text-brand-500 hover:text-brand-600 font-medium">Forgot?</button>
                      </div>
                      <div className="relative">
                        <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                          placeholder="••••••••" autoComplete="current-password"
                          className="w-full px-3.5 py-2.5 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all" />
                        <button type="button" onClick={() => setShowPass(!showPass)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Submit */}
                    <button type="submit" disabled={loading}
                      className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors shadow-btn mt-1">
                      {loading ? 'Signing in...' : 'Sign In to Infinity'}
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-xs text-slate-400">or</span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>

                  {/* Google button */}
                  <button className="w-full flex items-center justify-center gap-2.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>

                  {/* Admin preview box */}
                  <div className="mt-5 p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-brand-700 uppercase tracking-wider mb-0.5">Admin Preview Access</p>
                      <p className="text-xs text-slate-600">
                        Use{' '}
                        <code className="text-brand-600 font-medium bg-white px-1 py-0.5 rounded text-[11px]">
                          admin1234@gmail.com
                        </code>
                        {' '}for full workspace privileges.
                      </p>
                    </div>
                  </div>

                </motion.div>
              ) : (
                <motion.div key="signup" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">Create Account</h2>
                  <p className="text-sm text-slate-500 mb-6">Join your team on SG Infinity.</p>
                  <SignupForm />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-400 mt-6">
            © 2024 SG Infinity Inc. · Privacy · Terms · Support
          </p>
        </motion.div>
      </div>
    </div>
  )
}