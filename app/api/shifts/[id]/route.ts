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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user_id, shift_type_id, start_time, end_time, notes, current_user_id, current_user_role } =
      await request.json()

    if (!current_user_id || !current_user_role) {
      return NextResponse.json({ error: "Parametri di autenticazione mancanti" }, { status: 400 })
    }

    if (!start_time || !end_time) {
      return NextResponse.json({ error: "Orari di inizio e fine sono obbligatori" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Verifica se il turno esiste
    const { data: existingShift, error: fetchError } = await supabase
      .from("shifts")
      .select("user_id, date")
      .eq("id", params.id)
      .single()

    if (fetchError || !existingShift) {
      return NextResponse.json({ error: "Turno non trovato" }, { status: 404 })
    }

    // Controlla i permessi: admin può modificare tutto, user solo i propri turni
    const canEdit = current_user_role === "admin" || existingShift.user_id === current_user_id

    if (!canEdit) {
      return NextResponse.json({ error: "Non hai i permessi per modificare questo turno" }, { status: 403 })
    }

    // Se non è admin, può modificare solo i propri turni (non può cambiare utente)
    const finalUserId = current_user_role === "admin" ? user_id : existingShift.user_id

    // Calcola le ore del nuovo turno
    const newShiftHours = calculateShiftHours(start_time, end_time)

    // Calcola le ore già assegnate per l'utente in quella data (escludendo il turno corrente)
    const existingHours = await calculateUserDailyHours(supabase, finalUserId, existingShift.date, params.id)

    // Calcola le ore totali dopo la modifica
    const totalHours = existingHours + newShiftHours

    // Verifica se l'utente può fare turni con ore flessibili
    const canFlexibleHours = await canUserHaveFlexibleHours(supabase, finalUserId)

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
          error: `Minimo 2 ore al giorno richieste. Ore totali dopo la modifica: ${totalHours.toFixed(1)}h`,
        },
        { status: 400 },
      )
    }

    // Controlla sovrapposizioni orarie per lo stesso utente nella stessa data (escludendo il turno corrente)
    const { data: existing, error: checkError } = await supabase
      .from("shifts")
      .select("start_time, end_time")
      .eq("user_id", finalUserId)
      .eq("date", existingShift.date)
      .eq("status", "scheduled")
      .neq("id", params.id)

    if (checkError) {
      return NextResponse.json({ error: "Errore nella verifica" }, { status: 500 })
    }

    // Verifica sovrapposizioni orarie
    for (const existingShiftTime of existing || []) {
      const newStart = start_time
      const newEnd = end_time
      const existingStart = existingShiftTime.start_time
      const existingEnd = existingShiftTime.end_time

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

    // Aggiorna il turno
    const { data, error } = await supabase
      .from("shifts")
      .update({
        user_id: finalUserId,
        shift_type_id,
        start_time,
        end_time,
        notes,
      })
      .eq("id", params.id)
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
        created_by,
        users!shifts_user_id_fkey (
          id,
          name,
          email
        ),
        shift_types (
          id,
          name,
          color,
          description
        )
      `)

    if (error) {
      return NextResponse.json({ error: "Errore nella modifica del turno" }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const currentUserId = searchParams.get("current_user_id")
    const currentUserRole = searchParams.get("current_user_role")

    if (!currentUserId || !currentUserRole) {
      return NextResponse.json({ error: "Parametri di autenticazione mancanti" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Verifica se il turno esiste
    const { data: shift, error: fetchError } = await supabase
      .from("shifts")
      .select("user_id, date")
      .eq("id", params.id)
      .single()

    if (fetchError || !shift) {
      return NextResponse.json({ error: "Turno non trovato" }, { status: 404 })
    }

    // Controlla i permessi: admin può eliminare tutto, user solo i propri turni
    const canDelete = currentUserRole === "admin" || shift.user_id === currentUserId

    if (!canDelete) {
      return NextResponse.json({ error: "Non hai i permessi per eliminare questo turno" }, { status: 403 })
    }

    // Calcola le ore rimanenti dopo l'eliminazione
    const remainingHours = await calculateUserDailyHours(supabase, shift.user_id, shift.date, params.id)

    // Verifica se l'utente può fare turni con ore flessibili
    const canFlexibleHours = await canUserHaveFlexibleHours(supabase, shift.user_id)

    // Se l'utente ha altri turni nella stessa data e non può fare ore flessibili, verifica che rimangano almeno 2 ore
    if (!canFlexibleHours && remainingHours > 0 && remainingHours < 2) {
      return NextResponse.json(
        {
          error: `Non è possibile eliminare il turno: rimarrebbero solo ${remainingHours.toFixed(1)} ore (minimo 2 ore richieste)`,
        },
        { status: 400 },
      )
    }

    // Elimina il turno
    const { error: deleteError } = await supabase.from("shifts").delete().eq("id", params.id)

    if (deleteError) {
      return NextResponse.json({ error: "Errore nell'eliminazione del turno" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}
