'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ClipboardList, Calendar, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/Badge'
import { Loader } from '@/components/ui/Loader'
import { Task, TaskStatus } from '@/types'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const FILTERS: { label: string; value: TaskStatus | 'all' }[] = [
  { label: 'All',      value: 'all'      },
  { label: 'To Do',    value: 'todo'     },
  { label: 'In Progress',  value: 'in_progress'  },
  { label: 'Review',   value: 'review'   },
  { label: 'Done',     value: 'done'     },
]

export default function TasksPage() {
  const { profile, loading: authLoading } = useAuth()
  const [tasks, setTasks]     = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<TaskStatus | 'all'>('all')

  useEffect(() => { if (profile) loadTasks() }, [profile])

  async function loadTasks() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('tasks').select('*').or(`assigned_to.eq.${profile!.user_id},assigned_to.is.null`).order('created_at', { ascending: false })
    setTasks(data || [])
    setLoading(false)
  }

  async function updateStatus(taskId: string, status: TaskStatus) {
    const supabase = createClient()
    const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId)
    if (error) { toast.error('Could not update'); return }
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
    toast.success('Task updated')
  }

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  if (authLoading) return <Loader />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Tasks</h1>
        <p className="text-sm text-slate-500 mt-0.5">Tasks assigned to you by admin</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              filter === f.value
                ? 'bg-brand-500 border-brand-500 text-white shadow-btn'
                : 'bg-white border-slate-200 text-slate-500 hover:border-brand-200 hover:text-slate-700'
            }`}>
            {f.label}
            {f.value !== 'all' && (
              <span className={`ml-1.5 text-xs ${filter === f.value ? 'text-brand-100' : 'text-slate-400'}`}>
                ({tasks.filter(t => t.status === f.value).length})
              </span>
            )}
          </button>
        ))}
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
          {filtered.map((task, i) => (
            <motion.div key={task.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={`flex items-start gap-4 px-5 py-4 ${i !== filtered.length - 1 ? 'border-b border-slate-50' : ''} hover:bg-slate-50/50 transition-colors`}>
              {/* Circle checkbox */}
              <button onClick={() => updateStatus(task.id, task.status === 'done' ? 'todo' : 'done')}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 transition-all ${
                  task.status === 'done' ? 'border-brand-500 bg-brand-500' : 'border-slate-300 hover:border-brand-400'
                }`}>
                {task.status === 'done' && <span className="text-white text-[10px]">✓</span>}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</p>
                {task.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>}
                {task.due_date && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                    <Calendar className="w-3 h-3" /> {formatDate(task.due_date)}
                    {new Date(task.due_date) < new Date() && task.status !== 'done' && (
                      <span className="flex items-center gap-0.5 text-red-500 ml-1"><AlertCircle className="w-3 h-3" /> Overdue</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={task.priority as any}>{task.priority}</Badge>
                <select value={task.status} onChange={e => updateStatus(task.id, e.target.value as TaskStatus)}
                  className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:border-brand-400 transition-all cursor-pointer">
                  {['assigned','working','pending','done'].map(s => (
                    <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}