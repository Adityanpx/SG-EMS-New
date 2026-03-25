'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Task, TaskStatus, TaskPriority } from '@/types'

export interface TaskWithProfile extends Task {
  profile?: {
    full_name?: string
    avatar_url?: string
    department?: string
  }
}

export function useTasks(userId?: string, isAdmin: boolean = false) {
  const [tasks, setTasks] = useState<TaskWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      // If not admin, filter by assigned_to
      if (!isAdmin && userId) {
        query = query.or(`assigned_to.eq.${userId},assigned_to.is.null`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading tasks:', error)
        setTasks([])
      } else {
        setTasks((data || []) as TaskWithProfile[])
      }
    } catch (err) {
      console.error('Exception loading tasks:', err)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [supabase, userId, isAdmin])

  useEffect(() => {
    let isMounted = true
    let channel: any = null

    const init = async () => {
      await loadTasks()
      
      if (!isMounted) return

      // Set up real-time subscription with error handling
      try {
        channel = supabase
          .channel('tasks-realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'tasks',
            },
            (payload: any) => {
              console.log('Task change received:', payload)
              
              if (!isMounted) return

              if (payload.eventType === 'INSERT') {
                const newTask = payload.new
                setTasks(prev => {
                  // Avoid duplicates
                  if (prev.some(t => t.id === newTask.id)) return prev
                  return [newTask as TaskWithProfile, ...prev]
                })
              } else if (payload.eventType === 'UPDATE') {
                const updatedTask = payload.new
                setTasks(prev =>
                  prev.map(t =>
                    t.id === updatedTask.id
                      ? { ...t, ...updatedTask }
                      : t
                  )
                )
              } else if (payload.eventType === 'DELETE') {
                const deletedTask = payload.old
                setTasks(prev => prev.filter(t => t.id !== deletedTask.id))
              }
            }
          )
          .subscribe((status: string) => {
            console.log('Tasks realtime subscription status:', status)
          })
      } catch (err) {
        console.error('Error setting up tasks realtime:', err)
      }
    }

    init()

    return () => {
      isMounted = false
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [loadTasks, supabase])

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', taskId)

    if (error) {
      console.error('Error updating task:', error)
      throw error
    }

    return { success: true }
  }

  const createTask = async (taskData: {
    title: string
    description?: string
    assigned_to?: string | null
    assigned_by: string
    due_date?: string
    priority: TaskPriority
    status?: TaskStatus
  }) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single()

    if (error) {
      console.error('Error creating task:', error)
      throw error
    }

    return data as TaskWithProfile
  }

  return {
    tasks,
    loading,
    refresh: loadTasks,
    updateTaskStatus,
    createTask,
  }
}
