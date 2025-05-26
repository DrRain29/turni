import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerClient()

    // Ottieni tutti i turni con informazioni utente e tipo turno
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

    // Calcola le statistiche
    const userStats = users.map((user) => {
      const userShifts = shifts?.filter((shift) => shift.user_id === user.id) || []

      let totalHours = 0
      const shiftsByType: Record<string, { count: number; hours: number; color: string }> = {}

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
      })

      return {
        user_id: user.id,
        name: user.name,
        email: user.email,
        totalHours: Math.round(totalHours * 10) / 10, // Arrotonda a 1 decimale
        totalShifts: userShifts.length,
        shiftsByType,
      }
    })

    // Ordina per ore totali (decrescente)
    userStats.sort((a, b) => b.totalHours - a.totalHours)

    // Calcola statistiche generali
    const totalHours = userStats.reduce((sum, user) => sum + user.totalHours, 0)
    const totalShifts = userStats.reduce((sum, user) => sum + user.totalShifts, 0)
    const activeUsers = userStats.filter((user) => user.totalHours > 0).length

    return NextResponse.json({
      userStats,
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
