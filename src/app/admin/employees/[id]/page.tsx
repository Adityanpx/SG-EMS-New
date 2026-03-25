'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, CalendarCheck, ClipboardList, FileText, Mail, Phone, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/Badge'
import { Loader } from '@/components/ui/Loader'
import { Profile, AttendanceRecord, Task, LeaveRequest } from '@/types'
import { formatDate, formatTime, getInitials } from '@/lib/utils'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type Tab = 'attendance' | 'tasks' | 'requests'

export default function EmployeeDetailPage() {
  const { id } = useParams() as { id: string }
  const { loading: authLoading } = useAuth()
  const [employee, setEmployee]   = useState<Profile | null>(null)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [tasks, setTasks]         = useState<Task[]>([])
  const [requests, setRequests]   = useState<LeaveRequest[]>([])
  const [tab, setTab]             = useState<Tab>('attendance')
  const [loading, setLoading]     = useState(true)

  useEffect(() => { if (id) load() }, [id])

  async function load() {
    const supabase = createClient()
    const { data: emp } = await supabase.from('profiles').select('*').eq('user_id', id).single()
    setEmployee(emp)
    const [attRes, taskRes, reqRes] = await Promise.all([
      supabase.from('attendance_records').select('*').eq('user_id', id).order('date', { ascending: false }).limit(30),
      supabase.from('tasks').select('*').or(`assigned_to.eq.${id},assigned_to.is.null`).order('created_at', { ascending: false }),
      supabase.from('leave_requests').select('*').eq('user_id', id).order('created_at', { ascending: false }),
    ])
    setAttendance(attRes.data || [])
    setTasks(taskRes.data || [])
    setRequests(reqRes.data || [])
    setLoading(false)
  }

  if (authLoading || loading) return <Loader />
  if (!employee) return <div className="text-center py-20 text-slate-400">Employee not found</div>

  const TABS = [
    { id: 'attendance' as Tab, label: 'Attendance', icon: CalendarCheck },
    { id: 'tasks'      as Tab, label: 'Tasks',      icon: ClipboardList },
    { id: 'requests'   as Tab, label: 'Requests',   icon: FileText      },
  ]

  return (
    <div className="space-y-5">
      <Link href="/admin/employees" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Employees
      </Link>

      {/* Profile card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-100 rounded-2xl p-6 shadow-card flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-200 to-brand-400 flex items-center justify-center text-xl font-bold text-white shrink-0">
          {getInitials(employee.full_name)}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-slate-900">{employee.full_name}</h2>
          <p className="text-sm text-slate-500">{employee.designation || 'Employee'} · {employee.department || 'No department'}</p>
          <div className="flex flex-wrap gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-slate-400"><Mail className="w-3.5 h-3.5" />{employee.email}</span>
            {employee.phone && <span className="flex items-center gap-1.5 text-xs text-slate-400"><Phone className="w-3.5 h-3.5" />{employee.phone}</span>}
            <span className="flex items-center gap-1.5 text-xs text-slate-400"><Building2 className="w-3.5 h-3.5" />Joined {formatDate(employee.joined_at)}</span>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button key={tabId} onClick={() => setTab(tabId)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              tab === tabId
                ? 'bg-brand-50 border-brand-200 text-brand-700'
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-100 rounded-2xl shadow-card overflow-hidden">
        {tab === 'attendance' && (
          attendance.length === 0 ? <p className="text-center text-slate-400 py-12 text-sm">No attendance records</p> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-slate-100">
                  {['Date','Work Type','Check In','Check Out','Status'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {attendance.map(rec => (
                    <tr key={rec.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{new Date(rec.date).toLocaleDateString('en-IN', { weekday:'short', day:'2-digit', month:'short' })}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-600 capitalize">{rec.mode.replace(/_/g,' ')}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">{rec.clock_in_time ? formatTime(rec.clock_in_time) : '—'}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">{rec.clock_out_time ? formatTime(rec.clock_out_time) : '—'}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant={rec.status === 'clocked_out' ? 'present' : rec.status === 'clocked_in' ? 'wfh' : 'absent'}>
                          {rec.status.replace('_',' ')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
        {tab === 'tasks' && (
          tasks.length === 0 ? <p className="text-center text-slate-400 py-12 text-sm">No tasks assigned</p> : (
            <div className="divide-y divide-slate-50">
              {tasks.map(task => (
                <div key={task.id} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div><p className="text-sm font-semibold text-slate-800">{task.title}</p>
                  {task.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>}</div>
                  <div className="flex gap-2 shrink-0">
                    <Badge variant={task.status as any}>{task.status}</Badge>
                    <Badge variant={task.priority as any}>{task.priority}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
        {tab === 'requests' && (
          requests.length === 0 ? <p className="text-center text-slate-400 py-12 text-sm">No requests</p> : (
            <div className="divide-y divide-slate-50">
              {requests.map(req => (
                <div key={req.id} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div><p className="text-sm font-semibold text-slate-800 capitalize">{req.type.replace(/_/g,' ')}</p>
                  <p className="text-xs text-slate-400">{formatDate(req.from_date)} – {formatDate(req.to_date)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{req.reason}</p></div>
                  <Badge variant={req.status as any}>{req.status.replace('_',' ')}</Badge>
                </div>
              ))}
            </div>
          )
        )}
      </motion.div>
    </div>
  )
}