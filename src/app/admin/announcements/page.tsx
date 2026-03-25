'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Pin, MoreHorizontal, Megaphone } from 'lucide-react'
import { BarChart, Bar, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Loader } from '@/components/ui/Loader'
import { Announcement, Profile } from '@/types'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const PULSE_DATA = [{ v: 30 }, { v: 50 }, { v: 40 }, { v: 65 }, { v: 55 }, { v: 70 }, { v: 60 }, { v: 75 }, { v: 65 }]

const CATEGORY_STYLE: Record<string, string> = {
  community: 'text-brand-500',
  system:    'text-slate-400',
  hr:        'text-pink-500',
  general:   'text-slate-400',
}

export default function AnnouncementsPage() {
  const { profile, loading: authLoading } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [employees, setEmployees]         = useState<Profile[]>([])
  const [loading, setLoading]             = useState(true)
  const [submitting, setSubmitting]       = useState(false)
  const [pinned, setPinned]               = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })
  const up = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => { if (profile) loadData() }, [profile])

  async function loadData() {
    const supabase = createClient()
    const [annRes, empRes] = await Promise.all([
      supabase.from('announcements').select('*').order('is_active', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('profiles').select('user_id').eq('role', 'employee'),
    ])
    setAnnouncements(annRes.data || [])
    setEmployees(empRes.data || [])
    setLoading(false)
  }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const supabase = createClient()
    const { data: ann, error } = await supabase.from('announcements').insert({
      created_by: profile!.user_id, title: form.title, content: form.content, is_active: true,
    }).select().single()
    if (error) { toast.error('Could not publish'); setSubmitting(false); return }
    if (employees.length > 0) {
      await supabase.from('notifications').insert(
        employees.map(emp => ({
          user_id: emp.user_id,
          title: `📢 ${form.title}`,
          message: form.content.slice(0, 100) + (form.content.length > 100 ? '...' : ''),
          type: 'announcement', related_id: ann.id,
        }))
      )
    }
    toast.success('Announcement published to all employees!')
    setForm({ title: '', content: '' }); setPinned(false); setSubmitting(false)
    loadData()
  }

  async function toggleActive(ann: Announcement) {
    const supabase = createClient()
    await supabase.from('announcements').update({ is_active: !ann.is_active }).eq('id', ann.id)
    setAnnouncements(prev => prev.map(a => a.id === ann.id ? { ...a, is_active: !ann.is_active } : a))
  }

  async function deleteAnn(id: string) {
    const supabase = createClient()
    await supabase.from('announcements').delete().eq('id', id)
    setAnnouncements(prev => prev.filter(a => a.id !== id))
    toast.success('Deleted')
  }

  if (authLoading) return <Loader />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Announcements</h1>
        <p className="text-sm text-slate-500 mt-0.5">Broadcasting updates across the Luminous Workspace.</p>
      </div>

      <div className="flex gap-5 items-start">

        {/* Left: Post Update form + Engagement Pulse */}
        <div className="w-72 shrink-0 space-y-4">

          {/* Post Update form card */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            className="bg-white border border-slate-100 rounded-2xl shadow-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-xl bg-brand-100 flex items-center justify-center">
                <Megaphone className="w-3.5 h-3.5 text-brand-600" />
              </div>
              <p className="text-sm font-bold text-slate-800">Post Update</p>
            </div>
            <form onSubmit={handlePublish} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Headline</label>
                <input type="text" value={form.title} onChange={e => up('title', e.target.value)} required
                  placeholder="Title of the update"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-brand-400 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Message Body</label>
                <textarea value={form.content} onChange={e => up('content', e.target.value)} required rows={4}
                  placeholder="Write the content here..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-brand-400 transition-all resize-none" />
              </div>
              {/* Pin to top toggle */}
              <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <Pin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-600">Pin to top</span>
                </div>
                <button type="button" onClick={() => setPinned(!pinned)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${pinned ? 'bg-brand-500' : 'bg-slate-200'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${pinned ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors shadow-btn">
                {submitting ? 'Publishing...' : 'Publish Announcement'}
              </button>
            </form>
          </motion.div>

          {/* Engagement Pulse */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="bg-white border border-slate-100 rounded-2xl shadow-card p-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Engagement Pulse</p>
            <ResponsiveContainer width="100%" height={60}>
              <BarChart data={PULSE_DATA} barSize={8}>
                <Bar dataKey="v" radius={[3,3,0,0]}>
                  {PULSE_DATA.map((_, i) => (
                    <rect key={i} fill={i === 7 ? '#6366f1' : '#e0e7ff'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              <span className="text-brand-500 font-bold">84%</span> Read rate this week
            </p>
          </motion.div>
        </div>

        {/* Right: Announcement cards */}
        <div className="flex-1 min-w-0 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
            </div>
          ) : announcements.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-16 text-center">
              <Megaphone className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No announcements yet. Post your first update.</p>
            </div>
          ) : (
            announcements.map((ann, i) => (
              <motion.div key={ann.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className={`bg-white border rounded-2xl shadow-card p-5 ${
                  ann.is_active ? 'border-slate-100' : 'border-slate-100 opacity-60'
                }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
                      <Megaphone className="w-5 h-5 text-brand-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {/* Category + pinned */}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {i === 0 ? 'Company Milestone' : i === 1 ? 'Community' : 'System'}
                        </span>
                        {i === 0 && ann.is_active && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-600 text-[10px] font-bold rounded-full uppercase tracking-wide">
                            📌 Pinned Priority
                          </span>
                        )}
                        {!ann.is_active && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[10px] font-semibold rounded-full">Inactive</span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mb-1">{ann.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">{ann.content}</p>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-400">Posted {formatDate(ann.created_at)}</p>
                        {i === 1 && (
                          <div className="flex -space-x-1.5">
                            {['A','B','C'].map((l, j) => (
                              <div key={j} className="w-5 h-5 rounded-full bg-brand-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-brand-700">{l}</div>
                            ))}
                            <span className="text-xs text-slate-400 ml-2 font-medium">+5</span>
                          </div>
                        )}
                        {i === 2 && (
                          <div className="flex gap-1.5">
                            <span className="px-2 py-0.5 bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold rounded-full uppercase">Required Action</span>
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-full uppercase">IT Security</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => toggleActive(ann)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-all">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}