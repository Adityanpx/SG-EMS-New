'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Loader } from '@/components/ui/Loader'
import { Profile } from '@/types'
import { getInitials } from '@/lib/utils'

export default function TeamPage() {
  const { profile, loading: authLoading } = useAuth()
  const [team, setTeam]       = useState<Profile[]>([])
  const [search, setSearch]   = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (profile) loadTeam() }, [profile])

  async function loadTeam() {
    const supabase = createClient()
    const { data } = await supabase.from('profiles').select('*').eq('role', 'employee').order('full_name')
    setTeam(data || [])
    setLoading(false)
  }

  const filtered = team.filter(e =>
    (e.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.department || '').toLowerCase().includes(search.toLowerCase())
  )

  if (authLoading) return <Loader />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Team</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          <span className="text-brand-500 font-semibold">{team.length} employees</span> at SG Infinity
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-card max-w-sm">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search team members..."
          className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none w-full" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-slate-200 border-t-brand-500 rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((member, i) => (
            <motion.div key={member.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-white border border-slate-100 rounded-2xl p-5 shadow-card hover:shadow-card-md hover:border-brand-100 transition-all">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-200 to-brand-400 flex items-center justify-center text-base font-bold text-white">
                    {getInitials(member.full_name)}
                  </div>
                  {member.user_id !== profile?.user_id && (
                    <div className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
                  )}
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {member.full_name}
                  {member.user_id === profile?.user_id && (
                    <span className="ml-1 text-xs text-brand-500 font-normal">(You)</span>
                  )}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{member.designation || 'Employee'}</p>
                <span className="mt-2 px-2.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-semibold rounded-full uppercase tracking-wide">
                  {member.department || 'No department'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}