'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { SlidersHorizontal, Plus, Calendar, MoreHorizontal, AlertCircle, CheckCircle, Clock, Users, Filter, X, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useTasks } from '@/hooks/useTasks'
import { Loader } from '@/components/ui/Loader'
import { Task, Profile, TaskPriority, TaskStatus } from '@/types'
import { formatDate, getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'

const PRIORITY_OPTIONS: TaskPriority[] = ['low', 'medium', 'high']
const STATUS_OPTIONS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
]

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

const STATUS_COLORS = {
  todo: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  review: 'bg-purple-100 text-purple-700',
  done: 'bg-emerald-100 text-emerald-700',
}

export default function AdminTasksPage() {
  const { profile, loading: authLoading } = useAuth()
  const { tasks, loading: tasksLoading, createTask, updateTaskStatus } = useTasks(undefined, true)
  const [employees, setEmployees] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showBulkAssign, setShowBulkAssign] = useState(false)
  
  // Filter states
  const [filterEmployee, setFilterEmployee] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium' as TaskPriority,
    assigned_to: 'all',
  })

  // Bulk assign state
  const [bulkEmployees, setBulkEmployees] = useState<string[]>([])
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false)

  const up = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (profile) loadData()
  }, [profile])

  async function loadData() {
    const supabase = createClient()
    const { data: empData } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'employee')
      .order('full_name')
    setEmployees(empData || [])
    setLoading(false)
  }

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filterEmployee !== 'all' && task.assignee_id !== filterEmployee) return false
      if (filterStatus !== 'all' && task.status !== filterStatus) return false
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [tasks, filterEmployee, filterStatus, filterPriority, searchQuery])

  // Group tasks by status
  const pendingTasks = filteredTasks.filter(t => t.status === 'assigned')
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress' || t.status === 'review')
  const completedTasks = filteredTasks.filter(t => t.status === 'done')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      // Get target employees
      let targetEmployees: Profile[] = []
      if (form.assigned_to === 'all') {
        targetEmployees = employees
      } else {
        targetEmployees = employees.filter(e => e.user_id === form.assigned_to)
      }

      const supabase = createClient()

      // Create tasks for each employee
      for (const emp of targetEmployees) {
        const { data: newTask, error } = await supabase
          .from('tasks')
          .insert({
            assigned_to: emp.user_id,
            assigned_by: profile!.user_id,
            title: form.title,
            description: form.description || null,
            due_date: form.due_date || null,
            priority: form.priority,
            status: 'assigned',
          })
          .select()
          .single()

        if (error) {
          console.error('Error creating task:', error)
          continue
        }

        // Send notification
        await supabase.from('notifications').insert({
          user_id: emp.user_id,
          title: 'New Task Assigned 📋',
          message: `You have a new task: "${form.title}"${form.due_date ? ` (Due: ${formatDate(form.due_date)})` : ''}`,
          type: 'task_assigned',
          related_id: newTask.id,
        })
      }

      toast.success(`Task assigned to ${targetEmployees.length} employee${targetEmployees.length !== 1 ? 's' : ''}!`)
      setForm({ title: '', description: '', due_date: '', priority: 'medium', assigned_to: 'all' })
    } catch (error) {
      toast.error('Could not create task')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleStatusUpdate(taskId: string, newStatus: TaskStatus) {
    try {
      await updateTaskStatus(taskId, newStatus)
      toast.success('Task status updated')
    } catch (error) {
      toast.error('Could not update task')
    }
  }

  const toggleBulkEmployee = (userId: string) => {
    setBulkEmployees(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const selectAllEmployees = () => {
    if (bulkEmployees.length === employees.length) {
      setBulkEmployees([])
    } else {
      setBulkEmployees(employees.map(e => e.user_id))
    }
  }

  const handleBulkAssign = async () => {
    if (bulkEmployees.length === 0 || !form.title) {
      toast.error('Please select employees and enter a task title')
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()

      for (const empId of bulkEmployees) {
        const { data: newTask, error } = await supabase
          .from('tasks')
          .insert({
            assigned_to: empId,
            assigned_by: profile!.user_id,
            title: form.title,
            description: form.description || null,
            due_date: form.due_date || null,
            priority: form.priority,
            status: 'assigned',
          })
          .select()
          .single()

        if (!error && newTask) {
          await supabase.from('notifications').insert({
            user_id: empId,
            title: 'New Task Assigned 📋',
            message: `You have a new task: "${form.title}"${form.due_date ? ` (Due: ${formatDate(form.due_date)})` : ''}`,
            type: 'task_assigned',
            related_id: newTask.id,
          })
        }
      }

      toast.success(`Task assigned to ${bulkEmployees.length} employees!`)
      setForm({ title: '', description: '', due_date: '', priority: 'medium', assigned_to: 'all' })
      setBulkEmployees([])
      setShowBulkAssign(false)
    } catch (error) {
      toast.error('Could not assign tasks')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) return <Loader />

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Task Workspace</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} • {completedTasks.length} completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3.5 py-2 border rounded-xl text-sm font-medium transition-colors ${
              showFilters ? 'bg-brand-50 border-brand-200 text-brand-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            <Filter className="w-4 h-4" /> 
            Filters
            {(filterEmployee !== 'all' || filterStatus !== 'all' || filterPriority !== 'all') && (
              <span className="w-2 h-2 bg-brand-500 rounded-full" />
            )}
          </button>
          <button 
            onClick={() => setShowBulkAssign(!showBulkAssign)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
              showBulkAssign ? 'bg-brand-500 text-white' : 'bg-brand-50 border border-brand-200 text-brand-600 hover:bg-brand-100'
            }`}>
            <Users className="w-4 h-4" /> 
            Bulk Assign
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} 
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white border border-slate-100 rounded-2xl p-4 shadow-card"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-400"
              />
            </div>
            <select
              value={filterEmployee}
              onChange={e => setFilterEmployee(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-400"
            >
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp.user_id} value={emp.user_id}>{emp.full_name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as TaskStatus | 'all')}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-400"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value as TaskPriority | 'all')}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-400"
            >
              <option value="all">All Priorities</option>
              {PRIORITY_OPTIONS.map(p => (
                <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
            <button 
              onClick={() => {
                setFilterEmployee('all')
                setFilterStatus('all')
                setFilterPriority('all')
                setSearchQuery('')
              }}
              className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700"
            >
              Clear All
            </button>
          </div>
        </motion.div>
      )}

      {/* Bulk Assign Panel */}
      {showBulkAssign && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} 
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-gradient-to-r from-brand-50 to-purple-50 border border-brand-100 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Assign Task to Multiple Employees</h3>
            <button onClick={() => setShowBulkAssign(false)} className="p-1 hover:bg-slate-200 rounded-lg">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Task Title</label>
              <input 
                type="text" 
                value={form.title} 
                onChange={e => up('title', e.target.value)}
                placeholder="e.g., Complete project documentation"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-400" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Due Date</label>
              <input 
                type="date" 
                value={form.due_date} 
                onChange={e => up('due_date', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-400" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Priority</label>
              <select 
                value={form.priority} 
                onChange={e => up('priority', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-400"
              >
                {PRIORITY_OPTIONS.map(p => (
                  <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Select Employees ({bulkEmployees.length} selected)
              </label>
              <button 
                onClick={selectAllEmployees}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                {bulkEmployees.length === employees.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200">
              {employees.map(emp => (
                <button
                  key={emp.user_id}
                  onClick={() => toggleBulkEmployee(emp.user_id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    bulkEmployees.includes(emp.user_id)
                      ? 'bg-brand-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {emp.full_name}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleBulkAssign}
            disabled={submitting || bulkEmployees.length === 0 || !form.title}
            className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
          >
            {submitting ? 'Assigning...' : `Assign to ${bulkEmployees.length} Employee${bulkEmployees.length !== 1 ? 's' : ''}`}
          </button>
        </motion.div>
      )}

      {/* 3-column Kanban */}
      <div className="flex gap-4 items-start overflow-x-auto pb-4">

        {/* Left: Dispatch Task form */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          className="w-72 shrink-0 bg-white border border-slate-100 rounded-2xl shadow-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-100 flex items-center justify-center">
              <Plus className="w-3.5 h-3.5 text-brand-600" />
            </div>
            <p className="text-sm font-bold text-slate-800">Quick Assign</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Task Title</label>
              <input type="text" value={form.title} onChange={e => up('title', e.target.value)} required
                placeholder="e.g., Q4 Brand Audit"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-brand-400 transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assign To</label>
              <select value={form.assigned_to} onChange={e => up('assigned_to', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-brand-400 transition-all">
                <option value="all">🌐 All Employees</option>
                {employees.map(emp => (
                  <option key={emp.user_id} value={emp.user_id}>{emp.full_name}</option>
                ))}
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
                {PRIORITY_OPTIONS.map(p => (
                  <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={submitting}
              className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-colors shadow-btn">
              {submitting ? 'Assigning...' : 'Assign Task'}
            </button>
          </form>
        </motion.div>

        {/* Pending Column */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex-1 min-w-[280px]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <p className="text-sm font-bold text-slate-700">To Do</p>
            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 text-xs font-bold flex items-center justify-center">{pendingTasks.length}</span>
          </div>
          <div className="space-y-3">
            {tasksLoading ? (
              <div className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />
            ) : pendingTasks.slice(0, 5).map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                employees={employees}
                onStatusChange={handleStatusUpdate}
                filterEmployee={filterEmployee}
              />
            ))}
            {!tasksLoading && pendingTasks.length === 0 && (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-400">No pending tasks</div>
            )}
          </div>
        </motion.div>

        {/* In Progress Column */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="flex-1 min-w-[280px]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-brand-500" />
            <p className="text-sm font-bold text-slate-700">In Progress</p>
            <span className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 text-xs font-bold flex items-center justify-center">{inProgressTasks.length}</span>
          </div>
          <div className="space-y-3">
            {tasksLoading ? (
              <div className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />
            ) : inProgressTasks.slice(0, 5).map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                employees={employees}
                onStatusChange={handleStatusUpdate}
                filterEmployee={filterEmployee}
              />
            ))}
            {!tasksLoading && inProgressTasks.length === 0 && (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-400">No tasks in progress</div>
            )}
          </div>
        </motion.div>

        {/* Done Column */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="flex-1 min-w-[280px]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <p className="text-sm font-bold text-slate-700">Done</p>
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold flex items-center justify-center">{completedTasks.length}</span>
          </div>
          <div className="space-y-3">
            {tasksLoading ? (
              <div className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />
            ) : completedTasks.slice(0, 5).map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                employees={employees}
                onStatusChange={handleStatusUpdate}
                filterEmployee={filterEmployee}
              />
            ))}
            {!tasksLoading && completedTasks.length === 0 && (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-400">No completed tasks</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Task Card Component
function TaskCard({ 
  task, 
  employees, 
  onStatusChange,
  filterEmployee 
}: { 
  task: any
  employees: Profile[]
  onStatusChange: (taskId: string, status: TaskStatus) => void
  filterEmployee: string
}) {
  const assignee = employees.find(e => e.user_id === task.assigned_to)
  const deadlineStatus = task.due_date && task.status !== 'done' ? (() => {
    const due = new Date(task.due_date)
    const now = new Date()
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return { text: 'Overdue', color: 'text-red-500' }
    if (diffDays <= 1) return { text: 'Due soon', color: 'text-amber-500' }
    return null
  })() : null

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-card hover:shadow-card-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]}`}>
          {task.priority}
        </span>
        <select 
          value={task.status} 
          onChange={e => onStatusChange(task.id, e.target.value as TaskStatus)}
          className="text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:border-brand-400"
        >
          <option value="assigned">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
      </div>
      <p className="text-sm font-semibold text-slate-800 mb-2">{task.title}</p>
      {task.description && (
        <p className="text-xs text-slate-400 mb-3 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-brand-200 flex items-center justify-center text-[9px] font-bold text-brand-700">
            {getInitials(assignee?.full_name || task.profile?.full_name || 'U')}
          </div>
          <span className="text-xs text-slate-500">
            {assignee?.full_name || task.profile?.full_name || 'Unassigned'}
          </span>
        </div>
        {task.due_date && (
          <div className={`flex items-center gap-1 text-xs ${deadlineStatus?.color || 'text-slate-400'}`}>
            <Calendar className="w-3 h-3" /> 
            {formatDate(task.due_date)}
            {deadlineStatus && <span className="font-medium">• {deadlineStatus.text}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
