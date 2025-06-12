import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { start_date, end_date, notes, user_id, user_role } = await request.json()

    if (!user_id || !user_role) {
      return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Verifica se l'utente può modificare questa prenotazione
    const { data: vacation, error: fetchError } = await supabase
      .from("vacation_bookings")
      .select("user_id")
      .eq("id", params.id)
      .single()

    if (fetchError || !vacation) {
      return NextResponse.json({ error: "Prenotazione non trovata" }, { status: 404 })
    }

    // Controlla i permessi: admin può modificare tutto, user solo le proprie
    const canEdit = user_role === "admin" || vacation.user_id === user_id

    console.log(
      `Edit vacation - User: ${user_id}, Role: ${user_role}, Vacation owner: ${vacation.user_id}, Can edit: ${canEdit}`,
    )

    if (!canEdit) {
      return NextResponse.json({ error: "Non hai i permessi per modificare questa prenotazione" }, { status: 403 })
    }

    // Controlla sovrapposizioni con altre prenotazioni (escludendo quella corrente)
    const { data: overlapping, error: checkError } = await supabase
      .from("vacation_bookings")
      .select("*")
      .eq("user_id", vacation.user_id) // Usa l'ID del proprietario originale delle ferie
      .eq("status", "confirmed")
      .neq("id", params.id)
      .or(`start_date.lte.${end_date},end_date.gte.${start_date}`)

    if (checkError) {
      return NextResponse.json({ error: "Errore nella verifica" }, { status: 500 })
    }

    if (overlapping && overlapping.length > 0) {
      return NextResponse.json({ error: "Le nuove date si sovrappongono con altre ferie esistenti" }, { status: 400 })
    }

    if (user_role === "admin" && vacation.user_id !== user_id) {
      console.log(`Admin ${user_id} is editing vacation of user ${vacation.user_id}`)
    }

    // Aggiorna la prenotazione
    const { data, error } = await supabase
      .from("vacation_bookings")
      .update({
        start_date,
        end_date,
        notes,
      })
      .eq("id", params.id)
      .select()

    if (error) {
      return NextResponse.json({ error: "Errore nella modifica" }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}
