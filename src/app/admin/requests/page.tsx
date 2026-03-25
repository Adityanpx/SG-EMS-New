'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, CheckCircle, XCircle, PauseCircle, MoreHorizontal } from 'lucide-react'
import { BarChart, Bar, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Modal } from '@/components/ui/Modal'
import { Loader } from '@/components/ui/Loader'
import { LeaveRequest, RequestStatus, Profile } from '@/types'
import { formatDate, getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'

type Filter = RequestStatus | 'all'

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'All',      value: 'all'      },
  { label: 'Pending',  value: 'pending'  },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

const TYPE_STYLE: Record<string, string> = {
  work_from_home: 'bg-indigo-100 text-indigo-700',
  leave:          'bg-pink-100   text-pink-700',
  early_leave:    'bg-pink-100   text-pink-700',
  personal:       'bg-purple-100 text-purple-700',
  comp_off:       'bg-emerald-100 text-emerald-700',
  other:          'bg-slate-100  text-slate-600',
}

const TYPE_LABEL: Record<string, string> = {
  work_from_home: 'WFH',
  leave:          'Sick Leave',
  early_leave:    'Early Leave',
  comp_off:       'Comp Off',
  other:          'Other',
}

const STATUS_DOT: Record<string, string> = {
  pending:  'bg-amber-400',
  approved: 'bg-emerald-400',
  rejected: 'bg-red-400',
  on_hold:  'bg-blue-400',
}

const STATUS_TEXT: Record<string, string> = {
  pending:  'text-amber-600',
  approved: 'text-emerald-600',
  rejected: 'text-red-600',
  on_hold:  'text-blue-600',
}

// Fake sentiment chart data
const SENTIMENT_DATA = [
  { v: 40 }, { v: 55 }, { v: 48 }, { v: 70 }, { v: 62 }, { v: 58 }, { v: 45 },
]

export default function AdminRequestsPage() {
  const { profile, loading: authLoading } = useAuth()
  const [requests, setRequests]   = useState<LeaveRequest[]>([])
  const [filter, setFilter]       = useState<Filter>('all')
  const [loading, setLoading]     = useState(true)
  const [actionReq, setActionReq] = useState<LeaveRequest | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [acting, setActing]       = useState(false)

  useEffect(() => { if (profile) loadRequests() }, [profile])

  async function loadRequests() {
    setLoading(true)
    const supabase = createClient()
    const { data: reqData } = await supabase.from('leave_requests').select('*').order('created_at', { ascending: false })
    const userIds = reqData?.map(r => r.user_id) || []
    let pMap: Record<string, Profile> = {}
    if (userIds.length > 0) {
      const { data: pData } = await supabase.from('profiles').select('*').in('user_id', userIds)
      pData?.forEach((p: Profile) => { pMap[p.user_id] = p })
    }
    setRequests((reqData || []).map(r => ({ ...r, profile: pMap[r.user_id] || null })))
    setLoading(false)
  }

  async function handleAction(status: RequestStatus) {
    if (!actionReq) return
    setActing(true)
    const supabase = createClient()
    await supabase.from('leave_requests').update({ status, admin_note: adminNote || null }).eq('id', actionReq.id)
    const msgs: Record<string, { title: string; message: string }> = {
      approved: { title: 'Request Approved ✅', message: `Your ${actionReq.type.replace(/_/g, ' ')} request has been approved.${adminNote ? ' Note: ' + adminNote : ''}` },
      rejected: { title: 'Request Rejected ❌', message: `Your ${actionReq.type.replace(/_/g, ' ')} request has been rejected.${adminNote ? ' Reason: ' + adminNote : ''}` },
      on_hold:  { title: 'Request On Hold ⏸',  message: `Your ${actionReq.type.replace(/_/g, ' ')} request is on hold.${adminNote ? ' Note: ' + adminNote : ''}` },
    }
    if (msgs[status]) {
      await supabase.from('notifications').insert({
        user_id: actionReq.user_id, title: msgs[status].title, message: msgs[status].message,
        type: 'request_update', related_id: actionReq.id,
      })
    }
    toast.success(`Request ${status.replace('_', ' ')}`)
    setActionReq(null); setAdminNote(''); setActing(false)
    loadRequests()
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  const counts = {
    all:      requests.length,
    pending:  requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    on_hold:  requests.filter(r => r.status === 'on_hold').length,
    weeklyRate: requests.length > 0
      ? Math.round((requests.filter(r => r.status === 'approved').length / requests.length) * 100) : 0,
  }

  if (authLoading) return <Loader />

  return (
    <div className="space-y-5">

      {/* ── Header + filter tabs ──────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Request Panel</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage employee leave and work-from-home submissions.</p>
        </div>
        {/* Tab pills */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-card">
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f.value
                  ? 'bg-white shadow-card text-slate-800 border border-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 4 Mini stat cards ─────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Requests',    value: counts.all,      borderColor: 'border-l-brand-500'   },
          { label: 'Pending Approval',  value: counts.pending,  borderColor: 'border-l-amber-400'   },
          { label: 'HR Review',         value: counts.on_hold,  borderColor: 'border-l-pink-400'    },
          { label: 'Weekly Approval Rate', value: `${counts.weeklyRate}%`, borderColor: 'border-l-emerald-400' },
        ].map(({ label, value, borderColor }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`bg-white border border-slate-100 border-l-4 ${borderColor} rounded-2xl p-4 shadow-card`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Requests table ────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white border border-slate-100 rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No {filter === 'all' ? '' : filter} requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Employee Name', 'Type', 'Date Range', 'Reason', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((req, i) => {
                  const days = req.from_date === req.to_date ? 1 :
                    Math.ceil((new Date(req.to_date).getTime() - new Date(req.from_date).getTime()) / (1000 * 60 * 60 * 24)) + 1
                  return (
                    <tr key={req.id} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors ${
                      req.status === 'approved' ? 'opacity-70' : ''
                    }`}>
                      {/* Employee */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-600 shrink-0">
                            {getInitials(req.profile?.full_name || 'U')}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{req.profile?.full_name || '—'}</p>
                            <p className="text-xs text-slate-400">{req.profile?.designation || req.profile?.department || '—'}</p>
                          </div>
                        </div>
                      </td>
                      {/* Type */}
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${TYPE_STYLE[req.type] || TYPE_STYLE.other}`}>
                          {TYPE_LABEL[req.type] || req.type}
                        </span>
                      </td>
                      {/* Date range */}
                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-700">
                          {formatDate(req.from_date)}
                          {req.from_date !== req.to_date && <> – {formatDate(req.to_date)}</>}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{days} Working {days === 1 ? 'Day' : 'Days'}</p>
                      </td>
                      {/* Reason */}
                      <td className="px-5 py-4 max-w-[180px]">
                        <p className="text-sm text-slate-600 truncate">{req.reason}</p>
                        {req.admin_note && (
                          <p className="text-xs text-amber-600 mt-0.5 truncate">Note: {req.admin_note}</p>
                        )}
                      </td>
                      {/* Status */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[req.status] || 'bg-slate-300'}`} />
                          <span className={`text-sm font-semibold capitalize ${STATUS_TEXT[req.status] || 'text-slate-600'}`}>
                            {req.status === 'on_hold' ? 'On Hold' : req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                            {req.status === 'pending' && <span className="text-xs text-slate-400 font-normal ml-0.5">Review</span>}
                          </span>
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => { setActionReq(req); setAdminNote('') }}
                            disabled={req.status !== 'pending'}
                            className={`w-7 h-7 flex items-center justify-center rounded-full border transition-all ${
                              req.status === 'pending'
                                ? 'border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-500 hover:bg-emerald-50'
                                : 'border-slate-100 text-slate-200 cursor-not-allowed'
                            }`}>
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            disabled={req.status !== 'pending'}
                            onClick={async () => {
                              if (req.status !== 'pending') return
                              setActionReq(req)
                            }}
                            className={`w-7 h-7 flex items-center justify-center rounded-full border transition-all ${
                              req.status === 'pending'
                                ? 'border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50'
                                : 'border-slate-100 text-slate-200 cursor-not-allowed'
                            }`}>
                            <XCircle className="w-4 h-4" />
                          </button>
                          <button
                            disabled={req.status !== 'pending'}
                            className={`w-7 h-7 flex items-center justify-center rounded-full border transition-all ${
                              req.status === 'pending'
                                ? 'border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50'
                                : 'border-slate-100 text-slate-200 cursor-not-allowed'
                            }`}>
                            <PauseCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {/* Pagination hint */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-400">Showing {filtered.length} of {requests.length} requests</p>
              <div className="flex items-center gap-1">
                {[1,2,3].map(n => (
                  <button key={n} className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                    n === 1 ? 'bg-brand-500 text-white' : 'text-slate-500 hover:bg-slate-100'
                  }`}>{n}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Sentiment chart + Insights ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-bold text-slate-800">Active Employee Sentiment</p>
            <span className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">Live Data</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Pulse is currently{' '}
            <span className="text-brand-500 font-semibold">Luminous (High)</span>.
            Work-life balance requests are trending downward this week.
          </p>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={SENTIMENT_DATA} barSize={18}>
              <Bar dataKey="v" radius={[4, 4, 0, 0]}>
                {SENTIMENT_DATA.map((_, i) => (
                  <rect key={i} fill={i === 3 ? '#6366f1' : '#e0e7ff'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-card mb-3">
            <MoreHorizontal className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-600 mb-2">Automated Insights</p>
          <p className="text-xs text-slate-500 leading-relaxed mb-3">
            Based on team load, approving the current WFH requests will not impact project timelines this week.
          </p>
          <button className="text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors">
            View Detailed Report →
          </button>
        </motion.div>
      </div>

      {/* ── Review Modal ──────────────────────────────── */}
      <Modal open={!!actionReq} onClose={() => { setActionReq(null); setAdminNote('') }} title="Review Request" size="md">
        {actionReq && (
          <div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4">
              <p className="text-sm font-semibold text-slate-800">{actionReq.profile?.full_name}</p>
              <p className="text-xs text-slate-500 mt-0.5 capitalize">
                {actionReq.type.replace(/_/g, ' ')} · {formatDate(actionReq.from_date)}
                {actionReq.from_date !== actionReq.to_date && ` – ${formatDate(actionReq.to_date)}`}
              </p>
              <p className="text-xs text-slate-500 mt-1">{actionReq.reason}</p>
            </div>
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Admin Note (optional)</label>
              <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={2}
                placeholder="Add a note for the employee..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all resize-none" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => handleAction('approved')} disabled={acting}
                className="flex items-center justify-center gap-1.5 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-xl hover:bg-emerald-100 transition-colors disabled:opacity-60">
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
              <button onClick={() => handleAction('on_hold')} disabled={acting}
                className="flex items-center justify-center gap-1.5 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold rounded-xl hover:bg-amber-100 transition-colors disabled:opacity-60">
                <PauseCircle className="w-4 h-4" /> Hold
              </button>
              <button onClick={() => handleAction('rejected')} disabled={acting}
                className="flex items-center justify-center gap-1.5 py-2.5 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl hover:bg-red-100 transition-colors disabled:opacity-60">
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}