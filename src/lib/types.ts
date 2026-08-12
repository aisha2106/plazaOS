export type Role = 'admin' | 'tenant'

export type PaginatedResponse<T> = {
  data: T[]
  total: number
}

export type PaymentStatus = 'paid' | 'pending' | 'overdue'

export interface Payment {
  id: string
  amount: number
  date: string
  method?: string
  status: PaymentStatus
  receiptUrl?: string
}

export type MaintenanceStatus = 'open' | 'in_progress' | 'closed'

export type MaintenancePriority = 'low' | 'medium' | 'high'

export interface MaintenanceRequest {
  id: string
  title: string
  description?: string
  priority?: MaintenancePriority
  category?: string
  status: MaintenanceStatus
  createdAt: string
  images?: string[]
}

export interface Announcement {
  id: string
  title: string
  body: string
  important?: boolean
  createdAt: string
}

export type NotificationType = 'payment' | 'maintenance' | 'announcement' | 'appointment'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  body?: string
  date: string
  read: boolean
}

export interface Profile {
  id: string
  name: string
  email: string
  phone?: string
  unit?: string
  leaseStart?: string
  leaseEnd?: string
  monthlyRent?: number
  nextDueDate?: string
  balance?: number
}

export interface CalendarEvent {
  id: string
  title: string
  date: string
  time?: string
  location?: string
  status?: string
  notes?: string
}
