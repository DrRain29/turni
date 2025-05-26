import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { user_id, current_password, new_password } = await request.json()

    if (!user_id || !current_password || !new_password) {
      return NextResponse.json({ error: "Tutti i campi sono obbligatori" }, { status: 400 })
    }

    if (new_password.length < 4) {
      return NextResponse.json({ error: "La nuova password deve essere di almeno 4 caratteri" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Verifica l'utente e la password corrente
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("id, email, custom_password")
      .eq("id", user_id)
      .single()

    if (fetchError || !user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Verifica la password corrente
    let isCurrentPasswordValid = false

    if (user.custom_password) {
      // Se ha una password personalizzata, usa quella
      isCurrentPasswordValid = current_password === user.custom_password
    } else {
      // Altrimenti usa le password predefinite
      switch (user.email) {
        case "vpedone@entermed.it":
          isCurrentPasswordValid = current_password === "@Vincenzo29"
          break
        case "pterrana@entermed.it":
        case "cfazio@entermed.it":
        case "ggeraci@entermed.it":
          isCurrentPasswordValid = current_password === "1234"
          break
        default:
          isCurrentPasswordValid = false
      }
    }

    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: "Password corrente non valida" }, { status: 401 })
    }

    // Aggiorna la password
    const { error: updateError } = await supabase
      .from("users")
      .update({ custom_password: new_password })
      .eq("id", user_id)

    if (updateError) {
      return NextResponse.json({ error: "Errore nell'aggiornamento della password" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Password aggiornata con successo" })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}
