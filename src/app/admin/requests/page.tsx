'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, CheckCircle, XCircle, PauseCircle, MoreHorizontal } from 'lucide-react'
import { BarChart, Bar, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useLeaveRequests } from '@/hooks/useLeaveRequests'
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

const SENTIMENT_DATA = [
  { v: 40 }, { v: 55 }, { v: 48 }, { v: 70 }, { v: 62 }, { v: 58 }, { v: 45 },
]

export default function AdminRequestsPage() {
  const { profile, loading: authLoading } = useAuth()
  const { requests, loading, refresh } = useLeaveRequests(undefined, true)
  const [filter, setFilter]       = useState<Filter>('all')
  const [actionReq, setActionReq] = useState<LeaveRequest | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [acting, setActing]       = useState(false)

  async function handleAction(status: RequestStatus) {
    if (!actionReq) return
    setActing(true)
    const supabase = createClient()
    await supabase
      .from('leave_requests')
      .update({ status, admin_note: adminNote || null })
      .eq('id', actionReq.id)

    const msgs: Record<string, { title: string; message: string }> = {
      approved: { title: 'Request Approved ✅', message: `Your ${actionReq.type.replace(/_/g, ' ')} request has been approved.${adminNote ? ' Note: ' + adminNote : ''}` },
      rejected: { title: 'Request Rejected ❌', message: `Your ${actionReq.type.replace(/_/g, ' ')} request has been rejected.${adminNote ? ' Reason: ' + adminNote : ''}` },
      on_hold:  { title: 'Request On Hold ⏸',  message: `Your ${actionReq.type.replace(/_/g, ' ')} request is on hold.${adminNote ? ' Note: ' + adminNote : ''}` },
    }

    if (msgs[status]) {
      await supabase.from('notifications').insert({
        user_id: actionReq.user_id,
        title: msgs[status].title,
        message: msgs[status].message,
        type: 'request_update',
        related_id: actionReq.id,
      })
    }

    toast.success(`Request ${status}`)
    setActionReq(null)
    setAdminNote('')
    setActing(false)
    await refresh()
  }

  const filtered = filter === 'all'
    ? requests
    : requests.filter(r => r.status === filter)

  if (authLoading || loading) return <Loader />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Leave Requests</h1>
          <p className="text-sm text-slate-400 mt-0.5">{requests.length} total requests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === f.value
                ? 'bg-brand-500 text-white'
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-100 rounded-2xl shadow-card overflow-hidden"
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <FileText className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No requests found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Employee</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Dates</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(req => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-bold shrink-0">
                        {getInitials(req.profile?.full_name || '?')}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{req.profile?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-slate-400">{req.profile?.department || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${TYPE_STYLE[req.type] || 'bg-slate-100 text-slate-600'}`}>
                      {TYPE_LABEL[req.type] || req.type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-slate-700">{formatDate(req.from_date)}</p>
                    {req.from_date !== req.to_date && (
                      <p className="text-xs text-slate-400">to {formatDate(req.to_date)}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[req.status]}`} />
                      <span className={`text-xs font-semibold capitalize ${STATUS_TEXT[req.status]}`}>
                        {req.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => { setActionReq(req); setAdminNote('') }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg transition-colors"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-400">Showing {filtered.length} of {requests.length} requests</p>
        </div>
      </motion.div>

      {/* Sentiment chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-5 shadow-card"
        >
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

        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-slate-50 border border-slate-200 rounded-2xl p-5"
        >
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

      {/* Review Modal */}
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
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Admin Note (optional)
              </label>
              <textarea
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                rows={2}
                placeholder="Add a note for the employee..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all resize-none"
              />
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