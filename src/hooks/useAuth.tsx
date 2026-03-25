'use client'

import { useState, useEffect, createContext, useContext, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'employee'

interface Profile {
  user_id: string
  full_name: string
  role: UserRole
  department?: string
  designation?: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  role: UserRole | null
  isAdmin: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  useEffect(() => {
    console.log('[AUTH] AuthProvider mounted')
    console.log('[AUTH] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('[AUTH] Anon key present:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    const init = async () => {
      try {
        console.log('[AUTH] Getting session...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('[AUTH] getSession error:', sessionError)
          setLoading(false)
          return
        }

        console.log('[AUTH] Session result:', session ? 'session found' : 'no session')

        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          console.log('[AUTH] User found, fetching profile for:', currentUser.id)
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', currentUser.id)
            .single()

          if (profileError) {
            console.error('[AUTH] Profile fetch error:', profileError)
          } else {
            console.log('[AUTH] Profile fetched:', profileData?.role)
            setProfile(profileData)
          }
        }
      } catch (err) {
        console.error('[AUTH] Unexpected error in init:', err)
      } finally {
        console.log('[AUTH] Init complete, setting loading false')
        setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[AUTH] Auth state changed, event:', _event)
      const newUser = session?.user ?? null
      setUser(newUser)

      if (newUser) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', newUser.id)
          .single()

        if (profileError) {
          console.error('[AUTH] Profile fetch error on state change:', profileError)
        } else {
          setProfile(profileData)
        }
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    setUser(data.user)

    if (data.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single()
      setProfile(profileData)
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
    setUser(data.user)
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role || null,
        isAdmin: profile?.role === 'admin',
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}