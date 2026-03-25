'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Clock, Users, Megaphone, CalendarX,
  ClipboardCheck, RefreshCw, Calendar, Zap,
  MessageSquare, ChevronDown, Circle, CheckCircle
} from 'lucide-react'
import {
  BarChart, Bar, ResponsiveContainer, Tooltip, Cell
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { AttendanceRecord, Task, Profile, Announcement, LeaveRequest } from '@/types'
import { formatTime, getInitials } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'

const ATTENDANCE_MODES = [
  { value: 'work_from_office', label: 'Working from Office' },
  { value: 'work_from_home',   label: 'Working from Home'   },
  { value: 'field_work',       label: 'Field Work'          },
  { value: 'half_day',         label: 'Half Day'            },
]

const PULSE_DATA = [
  { day: 'M', v: 55 }, { day: 'T', v: 68 }, { day: 'W', v: 75 },
  { day: 'T', v: 88 }, { day: 'F', v: 72 }, { day: 'S', v: 42 }, { day: 'S', v: 30 },
]

export default function EmployeeDashboard() {
  const { profile } = useAuth()
  const [attendance, setAttendance]       = useState<AttendanceRecord | null>(null)
  const [tasks, setTasks]                 = useState<Task[]>([])
  const [teamMembers, setTeamMembers]     = useState<Profile[]>([])
  const [onLeaveToday, setOnLeaveToday]   = useState<Profile[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [showClockIn, setShowClockIn]     = useState(false)
  const [showClockOut, setShowClockOut]   = useState(false)
  const [selectedMode, setSelectedMode]   = useState('work_from_office')
  const [clockOutTasks, setClockOutTasks] = useState<{ task: string; status: 'done' | 'working' | 'pending' | 'dependency' }[]>([{ task: '', status: 'done' }])
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  useEffect(() => {
    if (!profile) return

    loadDashboardData()

    // refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000)

    // realtime: refresh when leave requests or attendance changes
    const channel = supabase
      .channel(`employee-dashboard-${profile.user_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => {
        loadDashboardData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records',
        filter: `user_id=eq.${profile.user_id}` }, () => {
        loadDashboardData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        loadDashboardData()
      })
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [profile])

  async function loadDashboardData() {
    const today = new Date().toISOString().split('T')[0]

    const { data: att } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('user_id', profile!.user_id)
      .eq('date', today)
      .single()
    setAttendance(att)

    const { data: myTasks } = await supabase
      .from('tasks')
      .select('*')
      .or(`assigned_to.eq.${profile!.user_id},assigned_to.is.null`)
      .order('created_at', { ascending: false })
      .limit(5)
    setTasks(myTasks || [])

    const { data: team } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'employee')
      .neq('user_id', profile!.user_id)
      .limit(4)
    setTeamMembers(team || [])

    const { data: leaves } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('status', 'approved')
      .lte('from_date', today)
      .gte('to_date', today)
    const leaveUserIds = leaves?.map((l: LeaveRequest) => l.user_id) || []
    if (leaveUserIds.length > 0) {
      const { data: lp } = await supabase.from('profiles').select('*').in('user_id', leaveUserIds)
      setOnLeaveToday(lp || [])
    } else {
      setOnLeaveToday([])
    }

    const { data: ann } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(3)
    setAnnouncements(ann || [])
  }

  async function handleClockIn() {
    const { error } = await supabase.from('attendance_records').insert({
      user_id: profile!.user_id,
      date: new Date().toISOString().split('T')[0],
      mode: selectedMode,
      status: 'clocked_in',
      clock_in_time: new Date().toISOString(),
    })
    if (error) { toast.error('Could not mark attendance'); return }
    toast.success('Attendance marked!')
    setShowClockIn(false)
    loadDashboardData()
  }

  async function handleClockOut() {
    const valid = clockOutTasks.filter(t => t.task.trim())
    if (!valid.length) { toast.error('Add at least one task'); return }
    const { error } = await supabase
      .from('attendance_records')
      .update({ status: 'clocked_out', clock_out_time: new Date().toISOString(), clock_out_summary: valid })
      .eq('user_id', profile!.user_id)
      .eq('date', new Date().toISOString().split('T')[0])
    if (error) { toast.error('Could not clock out'); return }
    toast.success('Clocked out! Great work today 👏')
    setShowClockOut(false)
    loadDashboardData()
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const remainingTasks = tasks.filter(t => t.status !== 'done').length

  return (
    <div>
      {announcements.map(ann => (
        <motion.div key={ann.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-3.5 mb-4 bg-brand-50 border border-brand-100 rounded-xl">
          <Megaphone className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-brand-700">{ann.title}</p>
            <p className="text-xs text-brand-500 mt-0.5">{ann.content}</p>
          </div>
        </motion.div>
      ))}

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {greeting()}, {profile?.full_name?.split(' ')[0]}.
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            You have {remainingTasks} task{remainingTasks !== 1 ? 's' : ''} to focus on today.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/employee/requests"
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-brand-200 transition-all shadow-card">
            <Calendar className="w-4 h-4 text-slate-500" />
            Apply Leave
          </Link>
          <Link href="/employee/requests"
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-brand-200 transition-all shadow-card">
            <Zap className="w-4 h-4 text-slate-500" />
            Request
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-800">Today's Attendance</p>
            <RefreshCw className="w-4 h-4 text-brand-400" />
          </div>

          {!attendance ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-xs text-slate-400 mb-1">Work Type</p>
                  <div className="relative">
                    <select value={selectedMode} onChange={e => setSelectedMode(e.target.value)}
                      className="w-full appearance-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-brand-400 pr-8">
                      {ATTENDANCE_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <button onClick={() => setShowClockIn(true)}
                  className="mt-5 flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl transition-all shadow-btn whitespace-nowrap active:scale-95">
                  <CheckCircle className="w-4 h-4" />
                  Clock In
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-brand-50 border border-brand-100 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                <p className="text-xs font-medium text-brand-700">
                  Clocked in at {attendance.clock_in_time ? formatTime(attendance.clock_in_time) : '—'}
                </p>
                {attendance.clock_out_time && (
                  <span className="text-xs font-medium text-red-600 ml-2">
                    | Clocked out at {formatTime(attendance.clock_out_time)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 capitalize">{attendance.mode.replace(/_/g, ' ')}</p>
              {attendance.status === 'clocked_in' && (
                <button onClick={() => setShowClockOut(true)}
                  className="w-full py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-semibold rounded-xl transition-colors">
                  Clock Out
                </button>
              )}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-3 bg-white border border-slate-100 rounded-2xl p-5 shadow-card"
          style={{ background: 'linear-gradient(145deg, #fdf4ff 0%, #fce7f3 50%, #ede9fe 100%)' }}>
          <p className="text-sm font-semibold text-slate-700 mb-0.5">Team Vibe</p>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Pulse Analytics</p>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={PULSE_DATA} barSize={10}>
              <Bar dataKey="v" radius={[4, 4, 0, 0]}>
                {PULSE_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.v === 88 ? '#6366f1' : i % 2 === 0 ? '#c7d2fe' : '#ddd6fe'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm font-semibold text-slate-700">Peak Activity</p>
            <p className="text-sm font-bold text-brand-600">88%</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-card">
          <p className="text-sm font-semibold text-slate-800 mb-4">Team Online</p>
          <div className="space-y-3">
            {teamMembers.slice(0, 3).map(member => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-600">
                      {getInitials(member.full_name)}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{member.full_name}</p>
                    <p className="text-[10px] text-slate-400">{member.designation || member.department}</p>
                  </div>
                </div>
                <button className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-colors">
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors">
            View All ({teamMembers.length}) →
          </button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-800">Today's Tasks</p>
            {remainingTasks > 0 && (
              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full uppercase tracking-wide">
                {remainingTasks} Remaining
              </span>
            )}
          </div>

          {tasks.length === 0 ? (
            <div className="py-10 text-center">
              <ClipboardCheck className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No tasks assigned yet</p>
            </div>
          ) : (
            <div className="space-y-0">
              {tasks.map((task, i) => (
                <div key={task.id} className={`flex items-start gap-3 py-3.5 ${i !== tasks.length - 1 ? 'border-b border-slate-50' : ''}`}>
                  <button className="w-5 h-5 rounded-full border-2 border-slate-200 hover:border-brand-400 flex items-center justify-center mt-0.5 shrink-0 transition-colors">
                    {task.status === 'done' && <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{task.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {task.due_date && (
                      <span className="text-xs text-slate-400 font-medium">{task.due_date}</span>
                    )}
                    <Badge variant={task.priority === 'high' ? 'high' : task.priority === 'medium' ? 'medium' : 'low'}>
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-white border border-slate-100 rounded-2xl p-5 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <CalendarX className="w-4 h-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-800">Out of Office</p>
            </div>
            {onLeaveToday.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-3">Everyone is in today 🎉</p>
            ) : (
              <div className="space-y-2">
                {onLeaveToday.slice(0, 3).map(p => (
                  <div key={p.id} className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl">
                    <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 shrink-0">
                      {getInitials(p.full_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{p.full_name}</p>
                      <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wide">Annual Leave</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white border border-slate-100 rounded-2xl p-5 shadow-card">
            <p className="text-[10px] font-bold text-brand-500 uppercase tracking-widest mb-1">Remote Pulse</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 leading-snug">
                  <span className="font-semibold text-slate-800">
                    {teamMembers.length > 0 ? Math.ceil(teamMembers.length * 0.4) : 0}
                  </span>{' '}
                  colleagues are{' '}
                  <span className="font-semibold text-brand-500">WFH</span> today
                </p>
              </div>
              <div className="flex -space-x-2 shrink-0">
                {teamMembers.slice(0, 3).map((m, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-brand-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-brand-600">
                    {getInitials(m.full_name)}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Clock In Modal */}
      <Modal isOpen={showClockIn} onClose={() => setShowClockIn(false)} title="Mark Attendance">
        <p className="text-sm text-slate-500 mb-4">How are you working today?</p>
        <div className="space-y-2 mb-5">
          {ATTENDANCE_MODES.map(mode => (
            <button key={mode.value} onClick={() => setSelectedMode(mode.value)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                selectedMode === mode.value
                  ? 'border-brand-300 bg-brand-50 text-brand-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}>
              {mode.label}
            </button>
          ))}
        </div>
        <button onClick={handleClockIn}
          className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm rounded-xl transition-colors shadow-btn">
          ✓ Confirm Clock In
        </button>
      </Modal>

      {/* Clock Out Modal */}
      <Modal isOpen={showClockOut} onClose={() => setShowClockOut(false)} size="lg">
        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-brand-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Clocking Out</h3>
            <p className="text-sm text-slate-500 mt-1">What did you do today?</p>
          </div>

          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-full border-2 border-emerald-500 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Completed Tasks</p>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {clockOutTasks.filter(t => t.status === 'done').map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-emerald-500">•</span>
                  <input type="text" value={item.task}
                    onChange={e => {
                      const arr = [...clockOutTasks]
                      const real = clockOutTasks.filter(t => t.status === 'done')
                      const realIdx = clockOutTasks.indexOf(real[idx])
                      arr[realIdx].task = e.target.value
                      setClockOutTasks(arr)
                    }}
                    placeholder="Describe completed task..."
                    className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none border-b border-slate-200 focus:border-brand-400 pb-1" />
                </div>
              ))}
              <button onClick={() => setClockOutTasks(p => [...p, { task: '', status: 'done' }])}
                className="text-xs text-brand-500 hover:text-brand-600 font-medium">
                + Add more...
              </button>
            </div>
          </div>

          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Circle className="w-5 h-5 text-blue-400" />
              <p className="text-sm font-semibold text-slate-700">Working On</p>
            </div>
            <div className="space-y-2">
              {clockOutTasks.filter(t => t.status === 'working').map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  <input type="text" value={item.task}
                    onChange={e => {
                      const arr = [...clockOutTasks]
                      const real = clockOutTasks.filter(t => t.status === 'working')
                      const realIdx = clockOutTasks.indexOf(real[idx])
                      arr[realIdx].task = e.target.value
                      setClockOutTasks(arr)
                    }}
                    placeholder="Describe what you're working on..."
                    className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none" />
                </div>
              ))}
              <button onClick={() => setClockOutTasks(p => [...p, { task: '', status: 'working' }])}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-slate-300 transition-colors">
                + Add another ongoing task...
              </button>
            </div>
          </div>

          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-full border-2 border-amber-400 flex items-center justify-center">
                <span className="text-amber-500 text-[10px] font-bold">!</span>
              </div>
              <p className="text-sm font-semibold text-slate-700">Pending / Blockers</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {clockOutTasks.filter(t => t.status === 'pending').map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-brand-500" />
                  <input type="text" value={item.task}
                    onChange={e => {
                      const arr = [...clockOutTasks]
                      const real = clockOutTasks.filter(t => t.status === 'pending')
                      const realIdx = clockOutTasks.indexOf(real[idx])
                      arr[realIdx].task = e.target.value
                      setClockOutTasks(arr)
                    }}
                    placeholder="Pending item..."
                    className="flex-1 bg-transparent text-xs text-slate-600 placeholder-slate-400 outline-none" />
                </div>
              ))}
              <button onClick={() => setClockOutTasks(p => [...p, { task: '', status: 'pending' }])}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 hover:border-slate-300 transition-colors">
                + Add blocker
              </button>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-full border-2 border-purple-400 flex items-center justify-center">
                <span className="text-purple-500 text-[10px] font-bold">↔</span>
              </div>
              <p className="text-sm font-semibold text-slate-700">Dependencies</p>
            </div>
            <div className="space-y-2">
              {clockOutTasks.filter(t => t.status === 'dependency').map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <input type="text" value={item.task}
                    onChange={e => {
                      const arr = [...clockOutTasks]
                      const real = clockOutTasks.filter(t => t.status === 'dependency')
                      const realIdx = clockOutTasks.indexOf(real[idx])
                      arr[realIdx].task = e.target.value
                      setClockOutTasks(arr)
                    }}
                    placeholder="What's depending on this?"
                    className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none" />
                </div>
              ))}
              <button onClick={() => setClockOutTasks(p => [...p, { task: '', status: 'dependency' }])}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-slate-300 transition-colors">
                + Add dependency...
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button onClick={() => setShowClockOut(false)}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
              × Cancel
            </button>
            <button className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors">
              Draft Log
            </button>
            <button onClick={handleClockOut}
              className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-btn">
              Submit & Clock Out
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}