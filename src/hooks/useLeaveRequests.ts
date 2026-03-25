'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LeaveRequest, RequestStatus, Profile } from '@/types'

export interface LeaveRequestWithProfile extends LeaveRequest {
  profile?: Profile | null
}

export function useLeaveRequests(userId?: string, isAdmin: boolean = false) {
  const [requests, setRequests] = useState<LeaveRequestWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('leave_requests')
        .select('*')
        .order('created_at', { ascending: false })

      // If not admin, filter by user_id
      if (!isAdmin && userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading leave requests:', error)
        setRequests([])
      } else {
        setRequests((data || []) as LeaveRequestWithProfile[])
      }
    } catch (err) {
      console.error('Exception loading leave requests:', err)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [supabase, userId, isAdmin])

  useEffect(() => {
    let isMounted = true
    let channel: any = null

    const init = async () => {
      await loadRequests()
      
      if (!isMounted) return

      // Set up real-time subscription with error handling
      try {
        channel = supabase
          .channel('leave-requests-realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'leave_requests',
            },
            (payload: any) => {
              console.log('Leave request change received:', payload)
              
              if (!isMounted) return

              if (payload.eventType === 'INSERT') {
                const newRequest = payload.new
                setRequests(prev => {
                  // Avoid duplicates
                  if (prev.some(r => r.id === newRequest.id)) return prev
                  return [newRequest as LeaveRequestWithProfile, ...prev]
                })
              } else if (payload.eventType === 'UPDATE') {
                const updatedRequest = payload.new
                setRequests(prev =>
                  prev.map(r =>
                    r.id === updatedRequest.id
                      ? { ...r, ...updatedRequest }
                      : r
                  )
                )
              } else if (payload.eventType === 'DELETE') {
                const deletedRequest = payload.old
                setRequests(prev => prev.filter(r => r.id !== deletedRequest.id))
              }
            }
          )
          .subscribe((status: string) => {
            console.log('Leave requests realtime subscription status:', status)
          })
      } catch (err) {
        console.error('Error setting up leave requests realtime:', err)
      }
    }

    init()

    return () => {
      isMounted = false
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [loadRequests, supabase, userId, isAdmin])

  const submitRequest = async (requestData: {
    user_id: string
    type: LeaveRequest['type']
    from_date: string
    to_date: string
    reason: string
  }) => {
    const { data, error } = await supabase
      .from('leave_requests')
      .insert(requestData)
      .select()
      .single()

    if (error) {
      console.error('Error submitting request:', error)
      throw error
    }

    return data as LeaveRequestWithProfile
  }

  const updateRequestStatus = async (
    requestId: string,
    status: RequestStatus,
    adminNote?: string
  ) => {
    const { error } = await supabase
      .from('leave_requests')
      .update({
        status,
        admin_note: adminNote || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (error) {
      console.error('Error updating request:', error)
      throw error
    }

    return { success: true }
  }

  return {
    requests,
    loading,
    refresh: loadRequests,
    submitRequest,
    updateRequestStatus,
  }
}
