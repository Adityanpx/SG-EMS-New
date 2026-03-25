'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { SlidersHorizontal, Plus, Calendar, MoreHorizontal, AlertCircle } from 'lucide-react'
import { BarChart, Bar, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Loader } from '@/components/ui/Loader'
import { Task, Profile, TaskPriority } from '@/types'
import { formatDate, getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'

const PRIORITY_OPTIONS: TaskPriority[] = ['low', 'medium', 'high']
const EFFICIENCY_DATA = [{ v: 55 }, { v: 70 }, { v: 48 }, { v: 82 }, { v: 65 }, { v: 75 }, { v: 60 }]

const CATEGORY_COLORS: Record<string, string> = {
  research:     'bg-blue-100    text-blue-700',
  design:       'bg-purple-100  text-purple-700',
  development:  'bg-indigo-100  text-indigo-700',
  documentation:'bg-slate-100   text-slate-600',
  infrastructure:'bg-orange-100 text-orange-700',
  visual:       'bg-pink-100    text-pink-700',
}

export default function AdminTasksPage() {
  const { profile, loading: authLoading } = useAuth()
  const [tasks, setTasks]         = useState<Task[]>([])
  const [employees, setEmployees] = useState<Profile[]>([])
  const [loading, setLoading]     = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', due_date: '', priority: 'medium' as TaskPriority, assigned_to: 'all',
  })
  const up = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => { if (profile) loadData() }, [profile])

  async function loadData() {
    const supabase = createClient()
    const [tRes, eRes] = await Promise.all([
      supabase.from('tasks').select('*, profile:profiles!tasks_assigned_to_fkey(*)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('role', 'employee').order('full_name'),
    ])
    setTasks(tRes.data || [])
    setEmployees(eRes.data || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const supabase = createClient()
    const payload = {
      assigned_to: form.assigned_to === 'all' ? null : form.assigned_to,
      assigned_by: profile!.user_id, title: form.title,
      description: form.description || null, due_date: form.due_date || null,
      priority: form.priority, status: 'assigned',
    }
    const { data: newTask, error } = await supabase.from('tasks').insert(payload).select().single()
    if (error) { toast.error('Could not create task'); setSubmitting(false); return }

    const targets = form.assigned_to === 'all' ? employees : employees.filter(e => e.user_id === form.assigned_to)
    if (targets.length > 0) {
      await supabase.from('notifications').insert(
        targets.map(emp => ({
          user_id: emp.user_id,
          title: 'New Task Assigned 📋',
          message: `You have a new task: "${form.title}"${form.due_date ? ` (Due: ${formatDate(form.due_date)})` : ''}`,
          type: 'task_assigned', related_id: newTask.id,
        }))
      )
    }
    toast.success('Task assigned!')
    setForm({ title: '', description: '', due_date: '', priority: 'medium', assigned_to: 'all' })
    setSubmitting(false)
    loadData()
  }

  const pending    = tasks.filter(t => t.status === 'todo')
  const inProgress = tasks.filter(t => t.status === 'in_progress' || t.status === 'review')

  if (authLoading) return <Loader />

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Task Workspace</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage luminous workflows and team productivity.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-card transition-colors">
            <SlidersHorizontal className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      {/* 3-column Kanban */}
      <div className="flex gap-4 items-start">

        {/* Left: Dispatch Task form */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          className="w-64 shrink-0 bg-white border border-slate-100 rounded-2xl shadow-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-100 flex items-center justify-center">
              <Plus className="w-3.5 h-3.5 text-brand-600" />
            </div>
            <p className="text-sm font-bold text-slate-800">Dispatch Task</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Task Title</label>
              <input type="text" value={form.title} onChange={e => up('title', e.target.value)} required
                placeholder="e.g., Q4 Brand Audit"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-brand-400 transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assignee</label>
              <select value={form.assigned_to} onChange={e => up('assigned_to', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-brand-400 transition-all">
                <option value="all">🌐 Select individual...</option>
                {employees.map(emp => <option key={emp.user_id} value={emp.user_id}>{emp.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Due Date</label>
              <input type="date" value={form.due_date} onChange={e => up('due_date', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-brand-400 transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Priority</label>
              <select value={form.priority} onChange={e => up('priority', e.target.value as TaskPriority)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-brand-400 transition-all">
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <button type="submit" disabled={submitting}
              className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-colors shadow-btn">
              {submitting ? 'Assigning...' : 'Assign Task'}
            </button>
          </form>

          {/* Efficiency Pulse mini chart */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">Efficiency Pulse</p>
              <span className="text-[10px] font-bold text-emerald-500">+12%</span>
            </div>
            <ResponsiveContainer width="100%" height={36}>
              <BarChart data={EFFICIENCY_DATA} barSize={6}>
                <Bar dataKey="v" radius={[2,2,0,0]} fill="#c7d2fe" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Center: Pending column */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-slate-300" />
            <p className="text-sm font-bold text-slate-700">Pending</p>
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center">{pending.length}</span>
            <button className="ml-auto p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />
            ) : pending.slice(0, 4).map(task => (
              <div key={task.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-card hover:shadow-card-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide ${
                    CATEGORY_COLORS[task.description?.toLowerCase().split(' ')[0] || 'documentation'] || CATEGORY_COLORS.documentation
                  }`}>
                    {task.description?.split(' ').slice(0,1).join('') || 'Task'}
                  </span>
                  <button className="text-slate-300 hover:text-slate-500 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
                <p className="text-sm font-semibold text-slate-800 mb-3">{task.title}</p>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-1.5">
                    {[task.assignee].filter(Boolean).map((p: any, i: number) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-brand-200 border-2 border-white flex items-center justify-center text-[9px] font-bold text-brand-700">
                        {getInitials(p?.full_name || 'U')}
                      </div>
                    ))}
                  </div>
                  {task.due_date && (
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Calendar className="w-3 h-3" /> {formatDate(task.due_date)}
                    </div>
                  )}
                  {task.priority === 'high' && (
                    <span className="flex items-center gap-1 text-xs text-red-500 font-semibold">
                      <AlertCircle className="w-3 h-3" /> Urgent
                    </span>
                  )}
                </div>
              </div>
            ))}
            {!loading && pending.length === 0 && (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-400">No pending tasks</div>
            )}
          </div>
        </motion.div>

        {/* Right: In Progress column */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-brand-500" />
            <p className="text-sm font-bold text-slate-700">In Progress</p>
            <span className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 text-xs font-bold flex items-center justify-center">{inProgress.length}</span>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />
            ) : inProgress.slice(0, 3).map(task => (
              <div key={task.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-card hover:shadow-card-md transition-shadow">
                {/* Color accent bar */}
                <div className="h-1.5 bg-gradient-to-r from-brand-400 to-purple-400" />
                <div className="p-4">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide mb-2 inline-block ${CATEGORY_COLORS.design}`}>Design</span>
                  <p className="text-sm font-semibold text-slate-800 mb-3">{task.title}</p>
                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-brand-400 to-purple-400 rounded-full" style={{ width: '65%' }} />
                    </div>
                    <p className="text-[10px] text-brand-500 font-semibold mt-1 text-right">65% Complete</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="w-6 h-6 rounded-full bg-brand-200 flex items-center justify-center text-[9px] font-bold text-brand-700">
                      {getInitials(task.assignee?.full_name || 'U')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {!loading && inProgress.length === 0 && (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-400">No tasks in progress</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Activity Stream */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white border border-slate-100 rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-bold text-slate-800">Activity Stream</p>
        </div>
        <table className="w-full">
          <thead><tr className="border-b border-slate-100">
            {['Team Member','Activity','Subject','Time'].map(h => (
              <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {tasks.slice(0, 5).map((task, i) => (
              <tr key={task.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-600 shrink-0">
                      {getInitials(task.assignee?.full_name || 'A')}
                    </div>
                    <p className="text-sm text-slate-700 font-medium">{task.assignee?.full_name || 'All Employees'}</p>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      task.status === 'done' ? 'bg-emerald-400' : task.status === 'in_progress' || task.status === 'review' ? 'bg-brand-400' : 'bg-amber-400'
                    }`} />
                    <p className="text-sm text-slate-600 capitalize">
                      {task.status === 'done' ? 'Completed task' : task.status === 'in_progress' || task.status === 'review' ? 'In Progress' : 'New Task'}
                    </p>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm font-semibold text-slate-800">{task.title}</td>
                <td className="px-5 py-3.5 text-xs text-slate-400">{i === 0 ? '2 mins ago' : i === 1 ? '1 hour ago' : '3 hours ago'}</td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-slate-400 text-sm">No activity yet</td></tr>
            )}
          </tbody>
        </table>
      </motion.div>
    </div>
  )
}