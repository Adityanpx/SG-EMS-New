'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, CalendarCheck, ClipboardList,
  FileText, Users, Menu, X, Search, Plus
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/lib/auth'
import { NotificationBell } from '@/components/shared/NotificationBell'
import { Loader } from '@/components/ui/Loader'
import { getInitials } from '@/lib/utils'

const NAV = [
  { href: '/employee/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/employee/attendance', label: 'Attendance',   icon: CalendarCheck },
  { href: '/employee/tasks',      label: 'Tasks',        icon: ClipboardList },
  { href: '/employee/requests',  label: 'Requests',     icon: FileText },
  { href: '/employee/team',      label: 'Employees',    icon: Users },
]

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading, isAdmin } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && isAdmin) router.replace('/admin/dashboard')
  }, [loading, isAdmin, router])

  if (loading) {
    console.log('[EMPLOYEE LAYOUT] Loading — loading:', loading, 'profile:', profile, 'isAdmin:', isAdmin)
    return <Loader />
  }
  if (!profile) {
    console.log('[EMPLOYEE LAYOUT] Rendering null — profile:', profile, 'isAdmin:', isAdmin)
    return null
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-[220px] flex flex-col
        bg-white border-r border-slate-100
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-50">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-btn shrink-0">
            <span className="text-white text-sm font-bold">∞</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-none">SG Infinity</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Luminous Workspace</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}>
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-brand-500' : 'text-slate-400'}`} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* New Request button + Sign out */}
        <div className="px-3 py-4 border-t border-slate-50 space-y-1">
          <Link href="/employee/requests"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-btn">
            <Plus className="w-4 h-4" />
            New Request
          </Link>
          <button onClick={signOut}
            className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-50">
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="h-[60px] bg-white border-b border-slate-100 flex items-center gap-4 px-5 shrink-0">
          {/* Mobile hamburger */}
          <button className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Search */}
          <div className="flex items-center gap-2 flex-1 max-w-sm bg-slate-100 rounded-full px-3.5 py-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search for tasks, team members..."
              className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none w-full"
            />
          </div>

          <div className="flex-1" />

          {/* Right: Bell + User */}
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800 leading-none">{profile.full_name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{profile.designation || 'Employee'}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {getInitials(profile.full_name)}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}