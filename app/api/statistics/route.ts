import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// Funzione per calcolare correttamente le ore di un turno
function calculateShiftHours(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(":").map(Number)
  const [endHour, endMinute] = endTime.split(":").map(Number)

  const startMinutes = startHour * 60 + startMinute
  let endMinutes = endHour * 60 + endMinute

  // Gestisce turni notturni che attraversano la mezzanotte
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60 // Aggiunge 24 ore
  }

  return (endMinutes - startMinutes) / 60
}

// Funzione per ottenere l'inizio della settimana (lunedì)
function getWeekStart(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const dayOfMonth = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${dayOfMonth}`
}

// Funzione per ottenere la fine della settimana (domenica)
function getWeekEnd(date: Date): string {
  const weekStartDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = weekStartDate.getDay()
  const diff = weekStartDate.getDate() - day + (day === 0 ? -6 : 1)
  weekStartDate.setDate(diff + 6)

  const year = weekStartDate.getFullYear()
  const month = String(weekStartDate.getMonth() + 1).padStart(2, "0")
  const dayOfMonth = String(weekStartDate.getDate()).padStart(2, "0")
  return `${year}-${month}-${dayOfMonth}`
}

export async function GET() {
  try {
    const supabase = createServerClient()

    // Calcola l'inizio e la fine della settimana corrente
    const today = new Date()
    const weekStart = getWeekStart(today)
    const weekEnd = getWeekEnd(today)

    // Ottieni tutti i turni della settimana corrente con informazioni utente e tipo turno
    const { data: shifts, error: shiftsError } = await supabase
      .from("shifts")
      .select(`
        id,
        user_id,
        start_time,
        end_time,
        date,
        users!shifts_user_id_fkey (
          id,
          name,
          email
        ),
        shift_types (
          name,
          color
        )
      `)
      .eq("status", "scheduled")
      .gte("date", weekStart)
      .lte("date", weekEnd)
      .order("date", { ascending: true })

    if (shiftsError) {
      console.error("Error fetching shifts:", shiftsError)
      return NextResponse.json({ error: "Errore nel caricamento dei turni" }, { status: 500 })
    }

    // Ottieni tutti gli utenti
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, email")
      .order("name", { ascending: true })

    if (usersError) {
      console.error("Error fetching users:", usersError)
      return NextResponse.json({ error: "Errore nel caricamento degli utenti" }, { status: 500 })
    }

    // Genera array dei giorni della settimana
    const weekDays = []
    const startDate = new Date(weekStart + "T00:00:00")
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate)
      day.setDate(startDate.getDate() + i)
      const dayString = day.toISOString().split("T")[0]
      weekDays.push({
        date: dayString,
        dayName: day.toLocaleDateString("it-IT", { weekday: "long" }),
        dayShort: day.toLocaleDateString("it-IT", { weekday: "short" }),
        dayNumber: day.getDate(),
        formatted: day.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }),
      })
    }

    // Calcola le statistiche per la settimana corrente
    const userStats = users.map((user) => {
      const userShifts = shifts?.filter((shift) => shift.user_id === user.id) || []

      let totalHours = 0
      const shiftsByType: Record<string, { count: number; hours: number; color: string }> = {}
      const shiftsByDay: Record<string, { count: number; hours: number; shifts: any[] }> = {}

      // Inizializza tutti i giorni della settimana
      weekDays.forEach((day) => {
        shiftsByDay[day.date] = { count: 0, hours: 0, shifts: [] }
      })

      userShifts.forEach((shift) => {
        // FIX: Usa la funzione corretta per calcolare le ore
        const hours = calculateShiftHours(shift.start_time, shift.end_time)
        totalHours += hours

        // Raggruppa per tipo turno
        const shiftTypeName = shift.shift_types?.name || "Altro"
        const shiftTypeColor = shift.shift_types?.color || "#666666"

        if (!shiftsByType[shiftTypeName]) {
          shiftsByType[shiftTypeName] = { count: 0, hours: 0, color: shiftTypeColor }
        }

        shiftsByType[shiftTypeName].count += 1
        shiftsByType[shiftTypeName].hours += hours

        // Raggruppa per giorno
        if (shiftsByDay[shift.date]) {
          shiftsByDay[shift.date].count += 1
          shiftsByDay[shift.date].hours += hours
          shiftsByDay[shift.date].shifts.push({
            ...shift,
            hours: hours,
          })
        }
      })

      return {
        user_id: user.id,
        name: user.name,
        email: user.email,
        totalHours: Math.round(totalHours * 10) / 10,
        totalShifts: userShifts.length,
        shiftsByType,
        shiftsByDay,
      }
    })

    // Ordina per ore totali (decrescente)
    userStats.sort((a, b) => b.totalHours - a.totalHours)

    // Calcola statistiche generali
    const totalHours = userStats.reduce((sum, user) => sum + user.totalHours, 0)
    const totalShifts = userStats.reduce((sum, user) => sum + user.totalShifts, 0)
    const activeUsers = userStats.filter((user) => user.totalHours > 0).length

    // Formatta le date per il frontend
    const weekStartFormatted = new Date(weekStart + "T00:00:00").toLocaleDateString("it-IT")
    const weekEndFormatted = new Date(weekEnd + "T00:00:00").toLocaleDateString("it-IT")

    return NextResponse.json({
      userStats,
      weekDays,
      weekInfo: {
        start: weekStart,
        end: weekEnd,
        startFormatted: weekStartFormatted,
        endFormatted: weekEndFormatted,
        isCurrentWeek: true,
      },
      summary: {
        totalHours: Math.round(totalHours * 10) / 10,
        totalShifts,
        activeUsers,
        totalUsers: users.length,
        averageHoursPerUser: activeUsers > 0 ? Math.round((totalHours / activeUsers) * 10) / 10 : 0,
      },
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}
