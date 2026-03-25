import { createClient } from '@/lib/supabase/client'

export type UserRole = 'admin' | 'employee'

export interface User {
  id: string
  email: string
  role: UserRole
  full_name: string
  department?: string
  position?: string
  avatar_url?: string
}

export async function signIn(email: string, password: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export async function signUp(email: string, password: string, fullName: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export async function getUserRole(userId: string): Promise<UserRole> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data.role as UserRole
}

export function setLoginTimestamp() {
  localStorage.setItem('lastLogin', new Date().toISOString())
}