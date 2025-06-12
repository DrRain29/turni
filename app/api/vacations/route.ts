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
    const { user_id, start_date, end_date, notes, target_user_id } = await request.json()

    const supabase = createServerClient()

    // Verifica l'utente corrente
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    // Ottieni i dettagli dell'utente corrente
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user_id)
      .single()

    if (userError) {
      console.error("Error fetching user:", userError)
      return NextResponse.json({ error: "Errore nel recupero utente" }, { status: 500 })
    }

    // Determina l'ID utente finale per cui creare le ferie
    let finalUserId = user_id

    // Se è specificato target_user_id, verifica che l'utente corrente sia admin
    if (target_user_id && target_user_id !== user_id) {
      if (currentUser.role !== "admin") {
        console.log(`User ${user_id} tried to create vacation for ${target_user_id} but is not admin`)
        return NextResponse.json(
          { error: "Solo gli amministratori possono creare ferie per altri utenti" },
          { status: 403 },
        )
      }
      finalUserId = target_user_id
      console.log(`Admin ${user_id} creating vacation for user ${target_user_id}`)
    }

    // Controlla sovrapposizioni per l'utente finale
    const { data: overlapping, error: checkError } = await supabase
      .from("vacation_bookings")
      .select("*")
      .eq("user_id", finalUserId)
      .eq("status", "confirmed")
      .or(`start_date.lte.${end_date},end_date.gte.${start_date}`)

    if (checkError) {
      console.error("Error checking overlaps:", checkError)
      return NextResponse.json({ error: "Errore nella verifica" }, { status: 500 })
    }

    if (overlapping && overlapping.length > 0) {
      // Ottieni il nome dell'utente per il messaggio di errore
      const { data: targetUser } = await supabase.from("users").select("name").eq("id", finalUserId).single()

      const userName = targetUser?.name || "L'utente"
      return NextResponse.json(
        {
          error: `${userName} ha già delle ferie prenotate in questo periodo`,
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
      console.log(`Admin ${user_id} successfully created vacation for user ${finalUserId}`)
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}
