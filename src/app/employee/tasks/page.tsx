'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ClipboardList, Calendar, AlertCircle, Clock, CheckCircle, PlayCircle, Eye } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTasks } from '@/hooks/useTasks'
import { Badge } from '@/components/ui/Badge'
import { Loader } from '@/components/ui/Loader'
import { TaskStatus } from '@/types'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const FILTERS: { label: string; value: TaskStatus | 'all'; icon: any }[] = [
  { label: 'All',      value: 'all',      icon: ClipboardList },
  { label: 'Assigned', value: 'assigned',  icon: Clock },
  { label: 'In Progress',  value: 'in_progress',  icon: PlayCircle },
  { label: 'Review',   value: 'review',   icon: Eye },
  { label: 'Done',     value: 'done',     icon: CheckCircle },
]

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
]

export default function TasksPage() {
  const { profile, loading: authLoading } = useAuth()
  const { tasks, loading, updateTaskStatus } = useTasks(profile?.user_id, false)
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function updateStatus(taskId: string, status: TaskStatus) {
    setUpdatingId(taskId)
    try {
      await updateTaskStatus(taskId, status)
      toast.success('Task updated')
    } catch (error) {
      toast.error('Could not update task')
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  // Calculate deadline status
  const getDeadlineStatus = (dueDate?: string, status?: string) => {
    if (!dueDate || status === 'done') return null
    const due = new Date(dueDate)
    const now = new Date()
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return { text: 'Overdue', color: 'text-red-500', bg: 'bg-red-50' }
    if (diffDays === 0) return { text: 'Due Today', color: 'text-amber-500', bg: 'bg-amber-50' }
    if (diffDays === 1) return { text: 'Due Tomorrow', color: 'text-amber-500', bg: 'bg-amber-50' }
    if (diffDays <= 3) return { text: `Due in ${diffDays} days`, color: 'text-amber-500', bg: 'bg-amber-50' }
    return null
  }

  if (authLoading) return <Loader />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Tasks</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you
          {tasks.filter(t => t.status !== 'done').length > 0 && (
            <span className="ml-2 text-brand-600 font-medium">
              • {tasks.filter(t => t.status !== 'done').length} remaining
            </span>
          )}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all flex items-center gap-1.5 ${
              filter === f.value
                ? 'bg-brand-500 border-brand-500 text-white shadow-btn'
                : 'bg-white border-slate-200 text-slate-500 hover:border-brand-200 hover:text-slate-700'
            }`}>
            <f.icon className="w-3.5 h-3.5" />
            {f.label}
            {f.value !== 'all' && (
              <span className={`ml-1 text-xs ${filter === f.value ? 'text-brand-100' : 'text-slate-400'}`}>
                ({tasks.filter(t => t.status === f.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-card">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold text-slate-800">{tasks.length}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-card">
          <p className="text-xs text-slate-400 uppercase tracking-wide">High Priority</p>
          <p className="text-2xl font-bold text-red-600">{tasks.filter(t => t.priority === 'high' && t.status !== 'done').length}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-card">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Due Soon</p>
          <p className="text-2xl font-bold text-amber-600">
            {tasks.filter(t => {
              const deadline = getDeadlineStatus(t.due_date, t.status)
              return deadline && t.status !== 'done'
            }).length}
          </p>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-card">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Completed</p>
          <p className="text-2xl font-bold text-emerald-600">{tasks.filter(t => t.status === 'done').length}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-slate-200 border-t-brand-500 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-16 text-center">
          <ClipboardList className="w-10 h-10 text-slate-200 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No tasks found</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-card overflow-hidden">
          {filtered.map((task, i) => {
            const deadlineStatus = getDeadlineStatus(task.due_date, task.status)
            return (
              <motion.div key={task.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className={`flex items-start gap-4 px-5 py-4 ${i !== filtered.length - 1 ? 'border-b border-slate-50' : ''} hover:bg-slate-50/50 transition-colors`}>
                {/* Circle checkbox */}
                <button 
                  onClick={() => updateStatus(task.id, task.status === 'done' ? 'assigned' : 'done')}
                  disabled={updatingId === task.id}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 transition-all disabled:opacity-50 ${
                    task.status === 'done' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 hover:border-brand-400'
                  }`}>
                  {task.status === 'done' && <span className="text-white text-[10px]">✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</p>
                  {task.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>}
                  
                  {/* Deadline & Priority Row */}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {task.due_date && (
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs ${
                        deadlineStatus ? `${deadlineStatus.bg} ${deadlineStatus.color}` : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Calendar className="w-3 h-3" />
                        {formatDate(task.due_date)}
                        {deadlineStatus && <span className="font-medium">• {deadlineStatus.text}</span>}
                      </div>
                    )}
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium border capitalize ${PRIORITY_COLORS[task.priority]}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select 
                    value={task.status} 
                    onChange={e => updateStatus(task.id, e.target.value as TaskStatus)}
                    disabled={updatingId === task.id}
                    className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:border-brand-400 transition-all cursor-pointer disabled:opacity-50">
                    {STATUS_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
