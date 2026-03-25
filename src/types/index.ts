export type UserRole = 'admin' | 'employee'

export interface User {
  id: string
  email: string
  role: UserRole
  full_name: string
  department?: string
  position?: string
  avatar_url?: string
  phone?: string
  address?: string
  hire_date?: string
  created_at: string
}

export interface Employee extends User {
  manager_id?: string
  status: 'active' | 'inactive' | 'on_leave'
}

export interface Task {
  id: string
  title: string
  description: string
  status: 'assigned' | 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high'
  assignee_id: string
  assignee?: User
  due_date?: string
  created_at: string
  updated_at: string
}

export interface Request {
  id: string
  type: 'leave' | 'attendance' | 'expense' | 'other'
  status: 'pending' | 'approved' | 'rejected'
  user_id: string
  user?: User
  reason: string
  start_date?: string
  end_date?: string
  created_at: string
  updated_at: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  priority: 'low' | 'medium' | 'high'
  created_by: string
  created_by_user?: User
  created_at: string
  expires_at?: string
  is_active?: boolean
}

export interface Attendance {
  id: string
  user_id: string
  user?: User
  date: string
  check_in?: string
  check_out?: string
  status: 'present' | 'absent' | 'late' | 'on_leave'
  notes?: string
  created_at: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  user_id: string
  created_at: string
}

export interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  onLeave: number
  pendingRequests: number
  totalTasks: number
  completedTasks: number
}

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface Profile {
  id?: string
  user_id: string
  full_name?: string
  email?: string
  phone?: string
  department?: string
  designation?: string
  role?: UserRole
  avatar_url?: string
  created_at?: string
  joined_at?: string
}

export interface LeaveRequest {
  id: string
  user_id: string
  profile?: Profile | null
  type: 'leave' | 'work_from_home' | 'early_leave' | 'comp_off' | 'other'
  from_date: string
  to_date: string
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'on_hold'
  admin_note?: string
  created_at: string
}

export interface AttendanceRecord {
  id: string
  user_id: string
  date: string
  mode: string
  status: 'clocked_in' | 'clocked_out' | 'absent' | 'on_leave' | 'late'
  clock_in_time?: string
  clock_out_time?: string
  clock_out_summary?: { task: string; status: string }[]
  created_at?: string
}

export type RequestType = 'leave' | 'work_from_home' | 'early_leave' | 'comp_off' | 'other'
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'on_hold'
export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'assigned' | 'todo' | 'in_progress' | 'review' | 'done'