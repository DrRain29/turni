import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// Funzione per calcolare correttamente le ore di un turno, gestendo la pausa pranzo in modo specifico
function calculateShiftHours(
  startTime: string,
  endTime: string,
  date: string,
  shiftType: string,
  userName: string,
): number {
  const [startHour, startMinute] = startTime.split(":").map(Number)
  const [endHour, endMinute] = endTime.split(":").map(Number)

  const startMinutes = startHour * 60 + startMinute
  let endMinutes = endHour * 60 + endMinute

  // Gestisce turni notturni che attraversano la mezzanotte
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60 // Aggiunge 24 ore
  }

  // Calcola le ore totali
  const totalHours = (endMinutes - startMinutes) / 60

  // Verifica se è un giorno feriale (1-5 = lunedì-venerdì)
  const dayOfWeek = new Date(date).getDay()
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5

  // Caso speciale: turno "Ircac" - la pausa è già considerata nell'orario (13-14)
  const isIrcacShift = shiftType?.toLowerCase() === "ircac"

  // Caso speciale: turno "Aeroporto" - non viene conteggiata l'ora di pausa
  const isAeroportoShift = shiftType?.toLowerCase().includes("aeroporto")

  // Caso speciale: Giorgio Geraci è esente dall'ora di pausa
  const isExemptUser = userName === "Giorgio Geraci"

  // Log per debug
  console.log(
    `Calcolo ore per ${userName}, turno ${shiftType}, data ${date}, giorno ${dayOfWeek}, ore totali ${totalHours}`,
  )

  // Se è un giorno feriale, non è un turno speciale (Ircac o Aeroporto), non è un utente esente, e il turno è abbastanza lungo (>= 5 ore), sottrae 1 ora di pausa
  if (isWeekday && !isIrcacShift && !isAeroportoShift && !isExemptUser && totalHours >= 5) {
    console.log(
      `Sottratta 1 ora di pausa per ${userName}, turno ${shiftType} del ${date} (${startTime}-${endTime}): ${totalHours} -> ${totalHours - 1}`,
    )
    return totalHours - 1
  }

  // Per i turni Ircac nei giorni feriali, registra che non viene sottratta la pausa
  if (isWeekday && isIrcacShift) {
    console.log(
      `Turno Ircac del ${date} (${startTime}-${endTime}): pausa già considerata nell'orario, ore totali: ${totalHours}`,
    )
  }

  // Per i turni Aeroporto nei giorni feriali, registra che non viene sottratta la pausa
  if (isWeekday && isAeroportoShift) {
    console.log(
      `Turno Aeroporto del ${date} (${startTime}-${endTime}): non viene conteggiata l'ora di pausa, ore totali: ${totalHours}`,
    )
  }

  // Per Giorgio Geraci, registra che è esente dalla pausa
  if (isExemptUser) {
    console.log(`${userName} è esente dall'ora di pausa, ore totali: ${totalHours}`)
  }

  return totalHours
}

// Funzione per ottenere l'inizio della settimana (lunedì) - FIX FUSO ORARIO
function getWeekStart(date: Date): string {
  // Crea una nuova data evitando problemi di fuso orario
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)

  // Formatta manualmente per evitare problemi di fuso orario
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const dayOfMonth = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${dayOfMonth}`
}

// Funzione per ottenere la fine della settimana (domenica) - FIX FUSO ORARIO
function getWeekEnd(date: Date): string {
  // Crea una nuova data evitando problemi di fuso orario
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff + 6) // Aggiungi 6 giorni per arrivare alla domenica

  // Formatta manualmente per evitare problemi di fuso orario
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const dayOfMonth = String(d.getDate()).padStart(2, "0")
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
          id,
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

    // Genera array dei giorni della settimana - FIX FUSO ORARIO
    const weekDays = []
    for (let i = 0; i < 7; i++) {
      // Crea la data manualmente per evitare problemi di fuso orario
      const [year, month, day] = weekStart.split("-").map(Number)
      const dayDate = new Date(year, month - 1, day + i) // month - 1 perché i mesi partono da 0

      const dayString = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, "0")}-${String(dayDate.getDate()).padStart(2, "0")}`

      weekDays.push({
        date: dayString,
        dayName: dayDate.toLocaleDateString("it-IT", { weekday: "long" }),
        dayShort: dayDate.toLocaleDateString("it-IT", { weekday: "short" }),
        dayNumber: dayDate.getDate(),
        formatted: dayDate.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }),
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
        // Usa la funzione aggiornata per calcolare le ore, passando anche il tipo di turno e il nome utente
        const shiftTypeName = shift.shift_types?.name || "Altro"
        const userName = shift.users?.name || ""
        const hours = calculateShiftHours(shift.start_time, shift.end_time, shift.date, shiftTypeName, userName)
        totalHours += hours

        // Raggruppa per tipo turno
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
            isIrcac: shiftTypeName.toLowerCase() === "ircac",
            isAeroporto: shiftTypeName.toLowerCase().includes("aeroporto"),
            isExempt: userName === "Giorgio Geraci",
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
        isExempt: user.name === "Giorgio Geraci",
      }
    })

    // Ordina per ore totali (decrescente)
    userStats.sort((a, b) => b.totalHours - a.totalHours)

    // Calcola statistiche generali
    const totalHours = userStats.reduce((sum, user) => sum + user.totalHours, 0)
    const totalShifts = userStats.reduce((sum, user) => sum + user.totalShifts, 0)
    const activeUsers = userStats.filter((user) => user.totalHours > 0).length

    // Formatta le date per il frontend - FIX FUSO ORARIO
    const [startYear, startMonth, startDay] = weekStart.split("-").map(Number)
    const [endYear, endMonth, endDay] = weekEnd.split("-").map(Number)

    const weekStartFormatted = new Date(startYear, startMonth - 1, startDay).toLocaleDateString("it-IT")
    const weekEndFormatted = new Date(endYear, endMonth - 1, endDay).toLocaleDateString("it-IT")

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
