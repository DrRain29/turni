import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { FLEXIBLE_HOURS_USERS } from "@/types/database"

// Funzione helper per calcolare le ore di un turno
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

// Funzione per calcolare le ore totali di un utente in una data
async function calculateUserDailyHours(
  supabase: any,
  userId: string,
  date: string,
  excludeShiftId?: string,
): Promise<number> {
  let query = supabase
    .from("shifts")
    .select("start_time, end_time")
    .eq("user_id", userId)
    .eq("date", date)
    .eq("status", "scheduled")

  if (excludeShiftId) {
    query = query.neq("id", excludeShiftId)
  }

  const { data: existingShifts, error } = await query

  if (error) {
    throw new Error("Errore nel calcolo delle ore esistenti")
  }

  let totalHours = 0
  for (const shift of existingShifts || []) {
    totalHours += calculateShiftHours(shift.start_time, shift.end_time)
  }

  return totalHours
}

// Verifica se l'utente può fare turni con ore flessibili
async function canUserHaveFlexibleHours(supabase: any, userId: string): Promise<boolean> {
  const { data: user, error } = await supabase.from("users").select("email").eq("id", userId).single()

  if (error || !user) return false

  return FLEXIBLE_HOURS_USERS.includes(user.email)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const weekStart = searchParams.get("week_start")

    const supabase = createServerClient()

    // Query per i turni senza join
    let shiftsQuery = supabase
      .from("shifts")
      .select(`
        id,
        user_id,
        shift_type_id,
        date,
        start_time,
        end_time,
        notes,
        status,
        created_at,
        created_by
      `)
      .eq("status", "scheduled")
      .order("date", { ascending: true })

    // Filtra per settimana se specificato
    if (weekStart) {
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      shiftsQuery = shiftsQuery.gte("date", weekStart).lte("date", weekEnd.toISOString().split("T")[0])
    }

    const { data: shifts, error: shiftsError } = await shiftsQuery

    if (shiftsError) {
      console.error("Error fetching shifts:", shiftsError)
      return NextResponse.json({ error: "Errore nel caricamento dei turni" }, { status: 500 })
    }

    // Query separate per utenti e tipi di turno
    const { data: users, error: usersError } = await supabase.from("users").select("id, name, email")

    const { data: shiftTypes, error: shiftTypesError } = await supabase
      .from("shift_types")
      .select("id, name, color, description")

    if (usersError || shiftTypesError) {
      console.error("Error fetching related data:", { usersError, shiftTypesError })
      return NextResponse.json({ error: "Errore nel caricamento dei dati correlati" }, { status: 500 })
    }

    // Combina i dati manualmente
    const enrichedShifts = shifts?.map((shift) => {
      const user = users?.find((u) => u.id === shift.user_id)
      const shiftType = shiftTypes?.find((st) => st.id === shift.shift_type_id)

      return {
        ...shift,
        users: user ? { id: user.id, name: user.name, email: user.email } : null,
        shift_types: shiftType
          ? {
              id: shiftType.id,
              name: shiftType.name,
              color: shiftType.color,
              description: shiftType.description,
            }
          : null,
      }
    })

    return NextResponse.json(enrichedShifts || [])
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, shift_type_id, date, start_time, end_time, notes, created_by } = await request.json()

    if (!start_time || !end_time) {
      return NextResponse.json({ error: "Orari di inizio e fine sono obbligatori" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Calcola le ore del nuovo turno
    const newShiftHours = calculateShiftHours(start_time, end_time)

    // Calcola le ore già assegnate per l'utente in quella data
    const existingHours = await calculateUserDailyHours(supabase, user_id, date)

    // Calcola le ore totali dopo l'aggiunta del nuovo turno
    const totalHours = existingHours + newShiftHours

    // Verifica se l'utente può fare turni con ore flessibili
    const canFlexibleHours = await canUserHaveFlexibleHours(supabase, user_id)

    // Verifica i limiti di ore (aggiornato a 2 ore minimo, 9 ore massimo)
    if (totalHours > 9) {
      return NextResponse.json(
        {
          error: `Limite massimo di 9 ore al giorno superato. Ore attuali: ${existingHours.toFixed(1)}h, nuovo turno: ${newShiftHours.toFixed(1)}h, totale: ${totalHours.toFixed(1)}h`,
        },
        { status: 400 },
      )
    }

    // Solo per utenti che non possono fare ore flessibili, verifica il minimo di 2 ore
    if (!canFlexibleHours && totalHours < 2) {
      return NextResponse.json(
        {
          error: `Minimo 2 ore al giorno richieste. Ore totali: ${totalHours.toFixed(1)}h`,
        },
        { status: 400 },
      )
    }

    // Controlla sovrapposizioni orarie per lo stesso utente nella stessa data
    const { data: existing, error: checkError } = await supabase
      .from("shifts")
      .select("start_time, end_time")
      .eq("user_id", user_id)
      .eq("date", date)
      .eq("status", "scheduled")

    if (checkError) {
      return NextResponse.json({ error: "Errore nella verifica" }, { status: 500 })
    }

    // Verifica sovrapposizioni orarie
    for (const existingShift of existing || []) {
      const newStart = start_time
      const newEnd = end_time
      const existingStart = existingShift.start_time
      const existingEnd = existingShift.end_time

      // Controlla sovrapposizione
      if (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      ) {
        return NextResponse.json(
          {
            error: `Sovrapposizione oraria rilevata con un turno esistente (${existingStart.slice(0, 5)}-${existingEnd.slice(0, 5)})`,
          },
          { status: 400 },
        )
      }
    }

    // Inserisce il nuovo turno
    const { data, error } = await supabase
      .from("shifts")
      .insert({
        user_id,
        shift_type_id,
        date,
        start_time,
        end_time,
        notes,
        created_by,
        status: "scheduled",
      })
      .select()

    if (error) {
      console.error("Error creating shift:", error)
      return NextResponse.json({ error: "Errore nella creazione del turno" }, { status: 500 })
    }

    // Recupera i dati correlati per la risposta
    const { data: user } = await supabase.from("users").select("id, name, email").eq("id", user_id).single()

    const { data: shiftType } = await supabase
      .from("shift_types")
      .select("id, name, color, description")
      .eq("id", shift_type_id)
      .single()

    const enrichedShift = {
      ...data[0],
      users: user ? { id: user.id, name: user.name, email: user.email } : null,
      shift_types: shiftType
        ? {
            id: shiftType.id,
            name: shiftType.name,
            color: shiftType.color,
            description: shiftType.description,
          }
        : null,
    }

    return NextResponse.json(enrichedShift)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}
