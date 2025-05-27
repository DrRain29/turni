export interface User {
  id: string
  email: string
  name: string
  password_hash: string
  created_at: string
  role: "user" | "admin"
}

export interface VacationBooking {
  id: string
  user_id: string
  start_date: string
  end_date: string
  status: "confirmed" | "pending" | "cancelled"
  notes?: string
  created_at: string
  users?: {
    name: string
    email: string
  }
}

export interface ShiftType {
  id: string
  name: string
  start_time: string
  end_time: string
  color: string
  description?: string
  created_at: string
}

export interface Shift {
  id: string
  user_id: string
  shift_type_id: string
  date: string
  start_time: string
  end_time: string
  notes?: string
  status: "scheduled" | "completed" | "absent" | "cancelled"
  created_at: string
  created_by?: string
  users?: {
    name: string
    email: string
  }
  shift_types?: ShiftType
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: "user" | "admin"
}

// Helper per identificare turni con orari fissi
export const FIXED_TIME_SHIFTS = ["Aeroporto", "IRCAC"]
export const MINIMUM_DAILY_HOURS = 2 // Cambiato da 3 a 2
// Aggiorna il limite massimo di ore giornaliere da 8 a 9
export const MAXIMUM_DAILY_HOURS = 9 // Cambiato da 8 a 9

// Utenti che possono fare turni con meno ore (rimosso il concetto di "turni spezzati")
export const FLEXIBLE_HOURS_USERS = ["vpedone@entermed.it"] // Vincenzo può fare turni con meno ore
