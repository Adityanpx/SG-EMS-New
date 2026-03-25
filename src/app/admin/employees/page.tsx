'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, Download, Shield, MessageSquare, Edit } from 'lucide-react'
import { BarChart, Bar, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Loader } from '@/components/ui/Loader'
import { Profile } from '@/types'
import { getInitials, formatDate } from '@/lib/utils'

const STATUS_OPTIONS = ['active', 'remote', 'meeting', 'ooo'] as const
type EmployeeStatus = typeof STATUS_OPTIONS[number]

const STATUS_STYLE: Record<EmployeeStatus, string> = {
  active:  'bg-emerald-100 text-emerald-700',
  remote:  'bg-blue-100    text-blue-700',
  meeting: 'bg-amber-100   text-amber-700',
  ooo:     'bg-slate-100   text-slate-500',
}
const STATUS_LABEL: Record<EmployeeStatus, string> = {
  active:  'Active',
  remote:  'Remote',
  meeting: 'In Meeting',
  ooo:     'Out of Office',
}

// Random status for display — in a real app this would come from DB
function getStatus(index: number): EmployeeStatus {
  return STATUS_OPTIONS[index % STATUS_OPTIONS.length]
}

// Fake mini attendance bars for selected employee panel
const MINI_BARS = [{ v: 80 }, { v: 65 }, { v: 90 }, { v: 70 }, { v: 95 }, { v: 60 }, { v: 85 }]

export default function EmployeesPage() {
  const { profile, loading: authLoading } = useAuth()
  const [employees, setEmployees]   = useState<Profile[]>([])
  const [selected, setSelected]     = useState<Profile | null>(null)
  const [search, setSearch]         = useState('')
  const [loading, setLoading]       = useState(true)

  useEffect(() => { if (profile) loadEmployees() }, [profile])

  async function loadEmployees() {
    const supabase = createClient()
    const { data } = await supabase.from('profiles').select('*').eq('role', 'employee').order('full_name')
    setEmployees(data || [])
    if (data && data.length > 0) setSelected(data[0])
    setLoading(false)
  }

  const filtered = employees.filter(e =>
    (e.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.department || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.designation || '').toLowerCase().includes(search.toLowerCase())
  )

  if (authLoading) return <Loader />

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage{' '}
            <span className="text-brand-500 font-semibold">{employees.length} active contributors</span>
            {' '}across all departments.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-card">
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
          <button className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-card">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'On-Site',          value: `${Math.round((employees.length * 0.82) || 0)}%`, icon: Shield, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
          { label: 'Requests Pending', value: '14 Pending', icon: null, iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
          { label: 'Birthdays Today',  value: '3 Today',    icon: null, iconBg: 'bg-pink-100',   iconColor: 'text-pink-600' },
        ].map(({ label, value, iconBg, iconColor }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-white border border-slate-100 rounded-2xl p-4 shadow-card flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
              <span className={`text-xs font-bold ${iconColor}`}>{label.charAt(0)}</span>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
              <p className="text-lg font-bold text-slate-900 leading-tight">{value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main two-panel layout */}
      <div className="flex gap-4">

        {/* Left: employee list */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="flex-1 min-w-0 bg-white border border-slate-100 rounded-2xl shadow-card overflow-hidden">

          {/* Search inside table */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3.5 py-2 border border-slate-100">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search employees..."
                className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none w-full" />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-brand-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Employee', 'Status', 'Department'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((emp, i) => {
                    const status = getStatus(i)
                    const isSelected = selected?.id === emp.id
                    return (
                      <tr key={emp.id} onClick={() => setSelected(emp)}
                        className={`border-b border-slate-50 last:border-0 cursor-pointer transition-colors ${
                          isSelected ? 'bg-brand-50 border-l-4 border-l-brand-500' : 'hover:bg-slate-50'
                        }`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-600 shrink-0">
                              {getInitials(emp.full_name)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{emp.full_name}</p>
                              <p className="text-xs text-slate-400">{emp.designation || 'Employee'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[status]}`}>
                            {STATUS_LABEL[status]}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-600">{emp.department || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Right: selected employee detail panel */}
        {selected && (
          <motion.div key={selected.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
            className="w-72 shrink-0 bg-white border border-slate-100 rounded-2xl shadow-card p-5 space-y-4 overflow-y-auto max-h-[600px]">

            {/* Avatar */}
            <div className="flex flex-col items-center pt-2 pb-1">
              <div className="relative mb-3">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-200 to-brand-400 flex items-center justify-center text-2xl font-bold text-white shadow-card-md">
                  {getInitials(selected.full_name)}
                </div>
                <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white" />
              </div>
              <p className="text-base font-bold text-slate-900">{selected.full_name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{selected.designation || 'Employee'}</p>
              {/* Skill tags */}
              <div className="flex flex-wrap gap-1.5 mt-2 justify-center">
                {selected.department && (
                  <span className="px-2.5 py-0.5 bg-brand-50 border border-brand-200 text-brand-700 text-[10px] font-semibold rounded-full uppercase tracking-wide">
                    {selected.department}
                  </span>
                )}
                <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-semibold rounded-full uppercase tracking-wide">
                  Team Lead
                </span>
              </div>
            </div>

            {/* Attendance Pulse */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Attendance Pulse</p>
                <span className="text-xs font-bold text-brand-500">98% Weekly</span>
              </div>
              <ResponsiveContainer width="100%" height={48}>
                <BarChart data={MINI_BARS} barSize={8}>
                  <Bar dataKey="v" radius={[3, 3, 0, 0]} fill="#c7d2fe"
                    style={{ fill: '#6366f1' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Milestones */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recent Milestones</p>
              <div className="space-y-2">
                {[
                  { text: 'Infinity Design Audit', sub: 'Completed 2 days ago', done: true },
                  { text: 'Icon Library Revamp', sub: 'In Progress — 74%', done: false },
                ].map((m, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      m.done ? 'bg-brand-100' : 'bg-slate-200'
                    }`}>
                      <span className={`text-[10px] ${m.done ? 'text-brand-600' : 'text-slate-400'}`}>✓</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{m.text}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{m.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time-off Requests */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-sm">📅</span>
                <p className="text-xs font-semibold text-slate-700">Time-off Requests</p>
              </div>
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">2</span>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button className="flex items-center justify-center gap-1.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                <MessageSquare className="w-3.5 h-3.5" /> Message
              </button>
              <button className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 rounded-xl text-xs font-semibold text-white hover:bg-slate-800 transition-colors">
                <Edit className="w-3.5 h-3.5" /> Edit Profile
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}