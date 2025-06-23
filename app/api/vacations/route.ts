import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerClient()

    const { data: vacations, error } = await supabase
      .from("vacation_bookings")
      .select(`
        *,
        users (
          name,
          email
        )
      `)
      .eq("status", "confirmed")
      .order("start_date", { ascending: true })

    if (error) {
      console.error("Error fetching vacations:", error)
      return NextResponse.json({ error: "Errore nel caricamento delle ferie" }, { status: 500 })
    }

    return NextResponse.json(vacations)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, user_role, start_date, end_date, notes, target_user_id } = await request.json()
    console.log("POST /api/vacations - Received request:", { user_id, user_role, target_user_id, start_date, end_date })

    const supabase = createServerClient()

    // Determina l'ID utente finale per cui creare le ferie
    let finalUserId = user_id

    // Se è specificato target_user_id, verifica che l'utente corrente sia admin o moderator
    if (target_user_id && target_user_id !== user_id) {
      // Verifica direttamente il ruolo passato dal client
      if (user_role !== "admin" && user_role !== "moderator") {
        console.log(
          `User ${user_id} (role: ${user_role}) tried to create vacation for ${target_user_id} but is not admin/moderator`,
        )
        return NextResponse.json(
          { error: "Solo gli amministratori e i moderatori possono creare ferie per altri utenti" },
          { status: 403 },
        )
      }
      finalUserId = target_user_id
      console.log(`${user_role} ${user_id} creating vacation for user ${target_user_id}`)
    }

    // CORREZIONE: Controlla sovrapposizioni REALI per l'utente finale
    // Due intervalli si sovrappongono se:
    // - L'inizio del nuovo intervallo è prima della fine dell'esistente E
    // - La fine del nuovo intervallo è dopo l'inizio dell'esistente
    const { data: overlapping, error: checkError } = await supabase
      .from("vacation_bookings")
      .select(`
        *,
        users (
          name,
          email
        )
      `)
      .eq("user_id", finalUserId)
      .eq("status", "confirmed")
      .lte("start_date", end_date)
      .gte("end_date", start_date)

    if (checkError) {
      console.error("Error checking overlaps:", checkError)
      return NextResponse.json({ error: "Errore nella verifica" }, { status: 500 })
    }

    console.log(
      `DEBUG: Checking overlaps for ${start_date} to ${end_date}:`,
      overlapping?.map((b) => ({
        id: b.id,
        start_date: b.start_date,
        end_date: b.end_date,
        status: b.status,
        user_name: b.users?.name,
      })),
    )

    if (overlapping && overlapping.length > 0) {
      // Ottieni il nome dell'utente per il messaggio di errore
      const { data: targetUser } = await supabase.from("users").select("name").eq("id", finalUserId).single()

      const userName = targetUser?.name || "L'utente"
      const conflictDetails = overlapping
        .map(
          (v) =>
            `${new Date(v.start_date).toLocaleDateString("it-IT")} - ${new Date(v.end_date).toLocaleDateString("it-IT")}`,
        )
        .join(", ")

      console.log(`REAL CONFLICT: ${userName} has overlapping vacations: ${conflictDetails}`)

      return NextResponse.json(
        {
          error: `${userName} ha già delle ferie che si sovrappongono in questo periodo: ${conflictDetails}`,
        },
        { status: 400 },
      )
    }

    // Inserisce la nuova prenotazione
    const { data, error } = await supabase
      .from("vacation_bookings")
      .insert({
        user_id: finalUserId,
        start_date,
        end_date,
        notes,
        status: "confirmed",
      })
      .select(`
        *,
        users (
          name,
          email
        )
      `)

    if (error) {
      console.error("Error creating vacation:", error)
      return NextResponse.json({ error: "Errore nella prenotazione" }, { status: 500 })
    }

    // Log dell'operazione
    if (finalUserId !== user_id) {
      console.log(`${user_role} ${user_id} successfully created vacation for user ${finalUserId}`)
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}
