import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// Funzione per ottenere l'inizio della settimana (lunedì) - corretta
function getWeekStart(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()) // Evita problemi di fuso orario
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Lunedì come primo giorno
  d.setDate(diff)

  // Formatta la data come YYYY-MM-DD senza problemi di fuso orario
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const dayOfMonth = String(d.getDate()).padStart(2, "0")

  return `${year}-${month}-${dayOfMonth}`
}

// Funzione per ottenere la fine della settimana (domenica) - corretta
function getWeekEnd(date: Date): string {
  const weekStartDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = weekStartDate.getDay()
  const diff = weekStartDate.getDate() - day + (day === 0 ? -6 : 1) // Lunedì
  weekStartDate.setDate(diff + 6) // Domenica (lunedì + 6 giorni)

  // Formatta la data come YYYY-MM-DD senza problemi di fuso orario
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

    console.log(`Fetching shifts from ${weekStart} to ${weekEnd}`) // Debug log

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

    console.log(`Found ${shifts?.length || 0} shifts for the week`) // Debug log

    // Ottieni tutti gli utenti
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, email")
      .order("name", { ascending: true })

    if (usersError) {
      console.error("Error fetching users:", usersError)
      return NextResponse.json({ error: "Errore nel caricamento degli utenti" }, { status: 500 })
    }

    // Calcola le statistiche per la settimana corrente
    const userStats = users.map((user) => {
      const userShifts = shifts?.filter((shift) => shift.user_id === user.id) || []

      let totalHours = 0
      const shiftsByType: Record<string, { count: number; hours: number; color: string }> = {}
      const shiftsByDay: Record<string, { count: number; hours: number }> = {}

      userShifts.forEach((shift) => {
        // Calcola ore del turno
        const [startHour, startMinute] = shift.start_time.split(":").map(Number)
        const [endHour, endMinute] = shift.end_time.split(":").map(Number)

        const startMinutes = startHour * 60 + startMinute
        let endMinutes = endHour * 60 + endMinute

        if (endMinutes <= startMinutes) {
          endMinutes += 24 * 60
        }

        const hours = (endMinutes - startMinutes) / 60
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
        const shiftDate = new Date(shift.date + "T00:00:00") // Evita problemi di fuso orario
        const dayName = shiftDate.toLocaleDateString("it-IT", { weekday: "long" })
        if (!shiftsByDay[dayName]) {
          shiftsByDay[dayName] = { count: 0, hours: 0 }
        }

        shiftsByDay[dayName].count += 1
        shiftsByDay[dayName].hours += hours
      })

      return {
        user_id: user.id,
        name: user.name,
        email: user.email,
        totalHours: Math.round(totalHours * 10) / 10, // Arrotonda a 1 decimale
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
