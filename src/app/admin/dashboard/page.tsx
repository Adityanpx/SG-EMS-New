'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Clock, FileText, CheckCircle,
  AlertTriangle, ChevronDown, Cloud, RefreshCw,
  Check, X, Info
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, ResponsiveContainer,
  Tooltip, Cell, LineChart, Line
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/Badge'
import { Loader } from '@/components/ui/Loader'
import { LeaveRequest, Profile, AttendanceRecord } from '@/types'
import { formatDate, getInitials } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'

const TREND_DATA = [
  { day: 'MON', present: 210, absent: 30 },
  { day: 'TUE', present: 195, absent: 45 },
  { day: 'WED', present: 220, absent: 20 },
  { day: 'THU', present: 230, absent: 15 },
  { day: 'FRI', present: 240, absent: 10 },
  { day: 'SAT', present: 60,  absent: 5  },
  { day: 'SUN', present: 40,  absent: 5  },
]

const ACTIVITY_LINE = [30, 45, 38, 60, 55, 72, 68]

export default function AdminDashboard() {
  const { profile, loading: authLoading } = useAuth()
  const [stats, setStats] = useState({
    totalEmployees: 0, presentToday: 0, pendingRequests: 0, tasksAssigned: 0,
  })
  const [recentRequests, setRecentRequests] = useState<LeaveRequest[]>([])
  const [absentToday, setAbsentToday]       = useState<Profile[]>([])
  const [loading, setLoading]               = useState(true)
  const [todayAttendance, setTodayAttendance] = useState<(AttendanceRecord & { profile: Profile | null })[]>([])
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  useEffect(() => {
    if (!profile) return

    loadDashboard()

    // refresh every 30 seconds
    const interval = setInterval(loadDashboard, 30000)

    // realtime: when a new leave request comes in, refresh immediately
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => {
        loadDashboard()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, () => {
        loadDashboard()
      })
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [profile])

  async function loadDashboard() {
    const today = new Date().toISOString().split('T')[0]

    const { count: empCount }     = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'employee')
    const { count: presentCount } = await supabase.from('attendance_records').select('*', { count: 'exact', head: true }).eq('date', today)
    const { count: pendingCount } = await supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    const { count: taskCount }    = await supabase.from('tasks').select('*', { count: 'exact', head: true }).neq('status', 'done')

    setStats({
      totalEmployees: empCount || 0, presentToday: presentCount || 0,
      pendingRequests: pendingCount || 0, tasksAssigned: taskCount || 0,
    })

    const { data: reqData } = await supabase.from('leave_requests').select('*').order('created_at', { ascending: false }).limit(5)
    const reqUserIds = reqData?.map(r => r.user_id) || []
    let profilesMap: Record<string, Profile> = {}
    if (reqUserIds.length > 0) {
      const { data: pData } = await supabase.from('profiles').select('*').in('user_id', reqUserIds)
      pData?.forEach((p: Profile) => { profilesMap[p.user_id] = p })
    }
    setRecentRequests((reqData || []).map(r => ({ ...r, profile: profilesMap[r.user_id] || null })))

    const { data: allEmp } = await supabase.from('profiles').select('*').eq('role', 'employee')
    const { data: todayAtt } = await supabase.from('attendance_records').select('user_id').eq('date', today)
    const presentIds = new Set((todayAtt || []).map((a: { user_id: string }) => a.user_id))
    setAbsentToday((allEmp || []).filter((e: Profile) => !presentIds.has(e.user_id)))

    const { data: attData } = await supabase.from('attendance_records').select('*').eq('date', today).order('clock_in_time', { ascending: true })
    const attUserIds = attData?.map(a => a.user_id) || []
    let attProfilesMap: Record<string, Profile> = {}
    if (attUserIds.length > 0) {
      const { data: attPData } = await supabase.from('profiles').select('*').in('user_id', attUserIds)
      attPData?.forEach((p: Profile) => { attProfilesMap[p.user_id] = p })
    }
    setTodayAttendance((attData || []).map(r => ({ ...r, profile: attProfilesMap[r.user_id] || null })))

    setLoading(false)
  }

  async function quickAction(reqId: string, status: 'approved' | 'rejected') {
    await supabase.from('leave_requests').update({ status }).eq('id', reqId)
    const req = recentRequests.find(r => r.id === reqId)
    if (req) {
      await supabase.from('notifications').insert({
        user_id: req.user_id,
        title:   status === 'approved' ? 'Request Approved ✅' : 'Request Rejected ❌',
        message: `Your ${req.type.replace(/_/g, ' ')} request has been ${status}.`,
        type:    'request_update',
        related_id: req.id,
      })
    }
    toast.success(`Request ${status}`)
    loadDashboard()
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (authLoading || loading) return <Loader />

  const presentPct = stats.totalEmployees > 0
    ? Math.round((stats.presentToday / stats.totalEmployees) * 100) : 0

  return (
    <div className="space-y-5">

      <div>
        <h1 className="text-3xl font-light text-slate-800 tracking-tight">Workspace Pulse</h1>
        <p className="text-sm text-slate-500 mt-1">
          {greeting()}, {profile?.full_name?.split(' ')[0]}. Here is what's happening at{' '}
          <span className="text-brand-500 font-medium">SG Infinity</span> today.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Employees', value: stats.totalEmployees,
            icon: Users, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600',
            badge: '+12%', badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          },
          {
            label: 'Present Today', value: stats.presentToday,
            icon: Clock, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600',
            badge: `${presentPct}%`, badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          },
          {
            label: 'On Leave Today', value: absentToday.length,
            icon: FileText, iconBg: 'bg-orange-100', iconColor: 'text-orange-600',
            badge: '42 New', badgeBg: 'bg-orange-50 text-orange-600 border-orange-200',
          },
          {
            label: 'Pending Requests', value: stats.pendingRequests,
            icon: CheckCircle, iconBg: 'bg-pink-100', iconColor: 'text-pink-600',
            badge: 'Urgent', badgeBg: 'bg-pink-50 text-pink-600 border-pink-200',
          },
        ].map(({ label, value, icon: Icon, iconBg, iconColor, badge, badgeBg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white border border-slate-100 rounded-2xl p-5 shadow-card"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                {badge}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-3xl font-bold text-slate-900">{value.toLocaleString()}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-5 shadow-card"
        >
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-base font-bold text-slate-800">Attendance Trends</p>
              <p className="text-xs text-slate-400 mt-0.5">Daily check-ins vs absences this week</p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
              Last 7 Days <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={TREND_DATA} barSize={22} barGap={4}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '12px' }}
                cursor={{ fill: 'rgba(99,102,241,0.04)' }}
              />
              <Bar dataKey="present" stackId="a" radius={[0, 0, 0, 0]} fill="#c7d2fe" />
              <Bar dataKey="absent"  stackId="a" radius={[6, 6, 0, 0]} fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="bg-white border border-slate-100 rounded-2xl p-5 shadow-card"
        >
          <p className="text-base font-bold text-slate-800 mb-4">Recent Activity</p>
          <div className="space-y-4">
            {recentRequests.slice(0, 3).map((req, i) => (
              <div key={req.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-600 shrink-0">
                  {getInitials(req.profile?.full_name || 'U')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700 leading-snug">
                    <span className="font-semibold">{req.profile?.full_name}</span>{' '}
                    {req.type === 'leave' ? 'requested medical leave.' :
                     req.type === 'work_from_home' ? 'requested WFH.' : `submitted a ${req.type.replace(/_/g, ' ')} request.`}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {i === 0 ? '2 hours ago' : i === 1 ? '5 hours ago' : 'Yesterday'}
                  </p>
                </div>
              </div>
            ))}
            {recentRequests.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">No recent activity</p>
            )}
          </div>
          <Link href="/admin/requests"
            className="block mt-4 text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors">
            View All Activity →
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.34 }}
        className="bg-white border border-slate-100 rounded-2xl p-5 shadow-card"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-bold text-slate-800">Today's Attendance</p>
            <p className="text-xs text-slate-400 mt-0.5">Clock in/out times</p>
          </div>
          <span className="text-xs font-medium px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
            {todayAttendance.length} Present
          </span>
        </div>
        {todayAttendance.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No attendance records for today</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Employee</th>
                  <th className="text-left py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Mode</th>
                  <th className="text-left py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Clock In</th>
                  <th className="text-left py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Clock Out</th>
                  <th className="text-left py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {todayAttendance.map((att) => (
                  <tr key={att.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-bold">
                          {att.profile?.full_name ? getInitials(att.profile.full_name) : '?'}
                        </div>
                        <span className="font-medium text-slate-700">{att.profile?.full_name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="text-xs capitalize text-slate-500">{att.mode?.replace(/_/g, ' ') || '-'}</span>
                    </td>
                    <td className="py-3">
                      <span className="text-xs font-mono text-slate-600">
                        {att.clock_in_time ? new Date(att.clock_in_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-xs font-mono text-slate-600">
                        {att.clock_out_time ? new Date(att.clock_out_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </span>
                    </td>
                    <td className="py-3">
                      {att.status === 'clocked_out' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                          <CheckCircle className="w-3 h-3" /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
                          <Clock className="w-3 h-3" /> Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 }}
          className="bg-white border border-slate-100 rounded-2xl p-5 shadow-card"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-slate-800">Pending Requests</p>
            <span className="text-xs text-slate-400 font-medium">{stats.pendingRequests} Total</span>
          </div>
          {recentRequests.filter(r => r.status === 'pending').length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No pending requests</p>
          ) : (
            <div className="space-y-2">
              {recentRequests.filter(r => r.status === 'pending').slice(0, 4).map((req, i) => (
                <div key={req.id}
                  className={`flex items-center justify-between p-3 rounded-xl bg-slate-50 border-l-4 ${
                    i % 2 === 0 ? 'border-l-brand-500' : 'border-l-indigo-300'
                  }`}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {req.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </p>
                    <p className="text-xs text-slate-500">Requested by {req.profile?.full_name || '—'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-3">
                    <button onClick={() => quickAction(req.id, 'rejected')}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all">
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => quickAction(req.id, 'approved')}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-emerald-500 hover:border-emerald-200 hover:bg-emerald-50 transition-all">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.40 }}
          className="bg-white border border-slate-100 rounded-2xl p-5 shadow-card"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-slate-800">System Health</p>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Stable
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-brand-500 uppercase tracking-wider mb-1">Sync Status</p>
              <div className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-sm font-bold text-slate-800">100% Synced</p>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Last sync: 2m ago</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1">Cloud Storage</p>
              <div className="flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-sm font-bold text-slate-800">84.2 GB Used</p>
              </div>
              <p className="text-[10px] text-orange-500 mt-0.5 font-medium">92% capacity reached</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <Info className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500">System maintenance scheduled for Saturday, 2:00 AM UTC.</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}