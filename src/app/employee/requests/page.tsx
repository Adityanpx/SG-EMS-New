'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { SlidersHorizontal, Download, MoreHorizontal, Info, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Loader } from '@/components/ui/Loader'
import { LeaveRequest, RequestType, RequestStatus } from '@/types'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const REQUEST_TYPES: { value: RequestType; label: string; icon: string }[] = [
  { value: 'leave',          label: 'Sick Leave',  icon: '🤒' },
  { value: 'work_from_home', label: 'Work From Home', icon: '🏠' },
  { value: 'early_leave',    label: 'Early Leave', icon: '🕐' },
  { value: 'comp_off',       label: 'Comp Off',    icon: '🔄' },
  { value: 'other',          label: 'Other',       icon: '📋' },
]

const TYPE_ICON: Record<string, string> = {
  leave: '🤒', work_from_home: '🏠', early_leave: '🕐', comp_off: '🔄', other: '📋',
}

const STATUS_PILL: Record<RequestStatus, string> = {
  approved: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  pending:  'bg-amber-100   text-amber-700   border border-amber-200',
  rejected: 'bg-red-100     text-red-700     border border-red-200',
  on_hold:  'bg-blue-100    text-blue-700    border border-blue-200',
}
const STATUS_DOT: Record<RequestStatus, string> = {
  approved: 'bg-emerald-400', pending: 'bg-amber-400',
  rejected: 'bg-red-400',     on_hold: 'bg-blue-400',
}

export default function RequestsPage() {
  const { profile, loading: authLoading } = useAuth()
  const [requests, setRequests]   = useState<LeaveRequest[]>([])
  const [loading, setLoading]     = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    type: 'leave' as RequestType, from_date: '', to_date: '', reason: '',
  })
  const up = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => { if (profile) loadRequests() }, [profile])

  async function loadRequests() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('leave_requests').select('*').eq('user_id', profile!.user_id).order('created_at', { ascending: false })
    setRequests(data || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (new Date(form.to_date) < new Date(form.from_date)) { toast.error('End date cannot be before start date'); return }
    setSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.from('leave_requests').insert({
      user_id: profile!.user_id, type: form.type,
      from_date: form.from_date, to_date: form.to_date, reason: form.reason, status: 'pending',
    })
    if (error) { toast.error(error.message); setSubmitting(false); return }
    toast.success('Request submitted!')
    setForm({ type: 'leave', from_date: '', to_date: '', reason: '' })
    setSubmitting(false)
    loadRequests()
  }

  if (authLoading) return <Loader />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Requests & Absence</h1>
        <p className="text-sm text-slate-500 mt-0.5">Submit and manage your leave applications or remote work requests.</p>
      </div>

      {/* Two-column top */}
      <div className="flex gap-5 items-start">

        {/* Left: New Request form */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          className="flex-1 bg-white border border-slate-100 rounded-2xl shadow-card p-6">
          <p className="text-sm font-bold text-slate-800 mb-1">New Request</p>
          <p className="text-xs text-slate-400 mb-5">Fill in the details for your upcoming absence or work preference.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Request Type</label>
                <select value={form.type} onChange={e => up('type', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all">
                  {REQUEST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Date Range</label>
                <div className="flex gap-2">
                  <input type="date" value={form.from_date} onChange={e => up('from_date', e.target.value)} required
                    className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-all" />
                  <input type="date" value={form.to_date} onChange={e => up('to_date', e.target.value)} required
                    className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-all" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Reason / Notes</label>
              <textarea value={form.reason} onChange={e => up('reason', e.target.value)} required rows={3}
                placeholder="Briefly explain the purpose of this request..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all resize-none" />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button type="button"
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-btn">
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Right: Balance + Policy cards */}
        <div className="w-64 shrink-0 space-y-4">
          {/* Available Balance */}
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl p-5 text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)' }}>
            <p className="text-xs font-semibold text-indigo-200 uppercase tracking-widest mb-2">Available Balance</p>
            <p className="text-4xl font-bold mb-1">14 Days</p>
            <div className="flex items-center gap-1.5 text-indigo-200 text-xs">
              <span className="w-4 h-4 rounded-full border border-indigo-300 flex items-center justify-center text-[9px]">i</span>
              Expires Dec 31, 2024
            </div>
          </motion.div>

          {/* Company Policy */}
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="bg-white border border-slate-100 rounded-2xl shadow-card p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Company Policy</p>
            <p className="text-sm font-semibold text-slate-800 mb-3">Remote Work Guidelines 2024</p>
            <div className="space-y-2">
              {['Max 3 WFH days per week', '2 weeks notice for vacation'].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-brand-500 shrink-0" />
                  <p className="text-xs text-slate-600">{item}</p>
                </div>
              ))}
            </div>
            <button className="mt-3 text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors">
              Download PDF →
            </button>
          </motion.div>
        </div>
      </div>

      {/* Request History */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="bg-white border border-slate-100 rounded-2xl shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="text-sm font-bold text-slate-800">Request History</p>
            <p className="text-xs text-slate-400 mt-0.5">Track the status of your previous submissions.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><SlidersHorizontal className="w-4 h-4" /></button>
            <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><Download className="w-4 h-4" /></button>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-slate-200 border-t-brand-500 rounded-full animate-spin" /></div>
        ) : requests.length === 0 ? (
          <p className="text-center text-slate-400 py-12 text-sm">No requests yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-100">
                {['Type','Date Range','Reason','Status','Action'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {requests.map(req => {
                  const days = req.from_date === req.to_date ? 1 :
                    Math.ceil((new Date(req.to_date).getTime() - new Date(req.from_date).getTime()) / (1000 * 60 * 60 * 24)) + 1
                  return (
                    <tr key={req.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-base">
                            {TYPE_ICON[req.type] || '📋'}
                          </div>
                          <p className="text-sm font-semibold text-slate-800 capitalize">{req.type.replace(/_/g,' ')}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-700">{formatDate(req.from_date)}{req.from_date !== req.to_date && ` – ${formatDate(req.to_date)}`}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{days} working {days === 1 ? 'day' : 'days'}</p>
                      </td>
                      <td className="px-5 py-4 max-w-[200px]">
                        <p className="text-sm text-slate-600 truncate">{req.reason}</p>
                        {req.admin_note && <p className="text-xs text-amber-600 mt-0.5">Note: {req.admin_note}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[req.status]}`} />
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${STATUS_PILL[req.status]}`}>
                            {req.status.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <button className="p-1.5 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-all">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Team Pulse card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="bg-white border border-slate-100 rounded-2xl shadow-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">Team Pulse</span>
            <h3 className="text-base font-bold text-slate-800 mt-0.5">Team Availability Overview</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md">
              84% of your team is currently on-site. The next scheduled peak for remote work is Monday.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {[{ label: 'On Site', value: 24 }, { label: 'Remote', value: 4 }, { label: 'OOO', value: 2 }].map(s => (
              <div key={s.label} className="text-center px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xl font-bold text-slate-900">{s.value}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}