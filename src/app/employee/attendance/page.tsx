'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarCheck, Home, Clock, CalendarX,
  ChevronDown, SlidersHorizontal, Download
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Loader } from '@/components/ui/Loader'
import { AttendanceRecord } from '@/types'
import { formatTime, getInitials } from '@/lib/utils'

const MODE_ICON: Record<string, React.ElementType> = {
  work_from_office: CalendarCheck,
  work_from_home:   Home,
  field_work:       CalendarCheck,
  half_day:         Clock,
  on_leave:         CalendarX,
}

const STATUS_PILL: Record<string, string> = {
  clocked_out: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  clocked_in:  'bg-indigo-100  text-indigo-700  border border-indigo-200',
  absent:      'bg-red-100     text-red-700     border border-red-200',
}

const STATUS_LABEL: Record<string, string> = {
  clocked_out: 'Present',
  clocked_in:  'WFH',
  absent:      'Absent',
}

export default function AttendancePage() {
  const { profile, loading: authLoading } = useAuth()
  const [records, setRecords]   = useState<AttendanceRecord[]>([])
  const [loading, setLoading]   = useState(true)
  const [month, setMonth]       = useState(new Date())

  useEffect(() => { if (profile) loadRecords() }, [profile, month])

  async function loadRecords() {
    setLoading(true)
    const supabase = createClient()
    const start = new Date(month.getFullYear(), month.getMonth(), 1).toISOString().split('T')[0]
    const end   = new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString().split('T')[0]
    const { data } = await supabase.from('attendance_records').select('*').eq('user_id', profile!.user_id).gte('date', start).lte('date', end).order('date', { ascending: false })
    setRecords(data || [])
    setLoading(false)
  }

  const present = records.filter(r => r.status !== 'absent').length
  const wfh     = records.filter(r => r.mode === 'work_from_home').length
  const late    = records.filter(r => r.clock_in_time && new Date(r.clock_in_time).getHours() >= 10).length
  const absent  = records.filter(r => r.status === 'absent').length

  if (authLoading) return <Loader />

  return (
    <div className="space-y-5">

      {/* Header + Mark Attendance */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-slate-800 tracking-tight">Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">Log your daily work presence and manage your time schedule.</p>
        </div>
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-card shrink-0">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Work Type</p>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-sm font-medium text-slate-700">Office</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-btn whitespace-nowrap">
            ✓ Mark Attendance
          </button>
        </div>
      </div>

      {/* 4 Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Present Days',    value: present, icon: CalendarCheck, highlight: true  },
          { label: 'Work from Home',  value: wfh,     icon: Home,          highlight: false },
          { label: 'Late Arrivals',   value: late,    icon: Clock,         highlight: false },
          { label: 'Absent',          value: absent,  icon: CalendarX,     highlight: false },
        ].map(({ label, value, icon: Icon, highlight }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`bg-white border rounded-2xl p-5 shadow-card ${
              highlight ? 'border-brand-200 border-l-4 border-l-brand-500' : 'border-slate-100'
            }`}>
            <Icon className={`w-5 h-5 mb-2 ${highlight ? 'text-brand-500' : 'text-slate-400'}`} />
            <p className={`text-3xl font-bold ${highlight ? 'text-brand-600' : 'text-slate-900'}`}>{value}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Attendance History table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="bg-white border border-slate-100 rounded-2xl shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-bold text-slate-800">Attendance History</p>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><SlidersHorizontal className="w-4 h-4" /></button>
            <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><Download className="w-4 h-4" /></button>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <p className="text-center text-slate-400 py-12 text-sm">No records for this month</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-slate-100">
                  {['Date','Work Type','Status','Check In','Check Out','Total Hours'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {records.map(rec => {
                    const Icon = MODE_ICON[rec.mode] || CalendarCheck
                    const totalHours = rec.clock_in_time && rec.clock_out_time
                      ? ((new Date(rec.clock_out_time).getTime() - new Date(rec.clock_in_time).getTime()) / (1000 * 60 * 60)).toFixed(0)
                      : '0'
                    const totalMins = rec.clock_in_time && rec.clock_out_time
                      ? Math.round((new Date(rec.clock_out_time).getTime() - new Date(rec.clock_in_time).getTime()) / (1000 * 60)) % 60
                      : 0

                    return (
                      <tr key={rec.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4 text-sm font-bold text-slate-800">
                          {new Date(rec.date).toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="capitalize">{rec.mode === 'work_from_home' ? 'Home' : rec.mode === 'work_from_office' ? 'Office' : rec.mode.replace(/_/g, ' ')}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${STATUS_PILL[rec.status] || STATUS_PILL.absent}`}>
                            {STATUS_LABEL[rec.status] || rec.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-slate-700">{rec.clock_in_time ? formatTime(rec.clock_in_time) : '—'}</td>
                        <td className="px-5 py-4 text-sm font-medium text-slate-700">{rec.clock_out_time ? formatTime(rec.clock_out_time) : '—'}</td>
                        <td className="px-5 py-4 text-sm font-bold text-slate-800">
                          {rec.clock_in_time && rec.clock_out_time ? `${totalHours}h ${String(totalMins).padStart(2,'0')}m` : '00h 00m'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-400">Showing {records.length} of {records.length} records</p>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors">Previous</button>
                <button className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-medium hover:bg-brand-600 transition-colors">Next</button>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* Workspace Pulse gradient banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="rounded-2xl p-5 border-2 border-transparent"
        style={{ background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #6366f1, #a855f7, #ec4899) border-box' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-bold text-slate-900">Workspace Pulse</p>
            <p className="text-sm text-slate-500 mt-0.5">94% of your team is currently active. The office vibe is collaborative today.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex -space-x-2">
              {['A','B','C'].map((l, i) => (
                <div key={i} className="w-7 h-7 rounded-full bg-brand-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-brand-700">{l}</div>
              ))}
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 border-2 border-white text-[10px] font-bold text-slate-600">+18</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">Real-Time</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                <p className="text-xs font-semibold text-slate-700">Infinity Motion Active</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}