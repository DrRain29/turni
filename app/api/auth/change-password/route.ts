import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { user_id, current_password, new_password } = await request.json()

    if (!user_id || !current_password || !new_password) {
      return NextResponse.json({ error: "Tutti i campi sono obbligatori" }, { status: 400 })
    }

    if (new_password.length < 6) {
      return NextResponse.json({ error: "La nuova password deve essere di almeno 6 caratteri" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Verifica l'utente
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("id, email, password_hash")
      .eq("id", user_id)
      .single()

    if (fetchError || !user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    console.log("🔍 Change password attempt for user:", user.email)

    // Mappa email agli username per utenti legacy
    const emailToUsernameMap: Record<string, string> = {
      "vpedone@entermed.it": "pedonev",
      "pterrana@entermed.it": "terranap",
      "cfazio@entermed.it": "fazioc",
      "ggeraci@entermed.it": "geracig",
      "spipitone@entermed.it": "pipitones",
    }

    // Password hardcoded per utenti legacy
    const legacyPasswords: Record<string, string> = {
      pedonev: "@Vincenzo29",
      terranap: "@Anita123",
      fazioc: "@Silvia123",
      geracig: "Entermed$01",
      pipitones: "Entermed$01",
    }

    // Verifica la password corrente
    let isCurrentPasswordValid = false
    const username = emailToUsernameMap[user.email]
    const isLegacyUser = !!username

    if (isLegacyUser && username) {
      console.log("🔐 Verifying legacy user password for:", username)

      // Controlla se l'utente ha mai cambiato la password
      const hasCustomPassword =
        user.password_hash && user.password_hash.length > 0 && user.password_hash !== legacyPasswords[username]

      if (hasCustomPassword) {
        // L'utente ha cambiato la password - USA SOLO quella nel database
        isCurrentPasswordValid = current_password === user.password_hash
        console.log("🔐 User has custom password, using database only:", isCurrentPasswordValid)
      } else {
        // L'utente NON ha mai cambiato la password - USA SOLO quella legacy
        isCurrentPasswordValid = current_password === legacyPasswords[username]
        console.log("🔐 User has original password, using legacy only:", isCurrentPasswordValid)
      }
    } else {
      // Per nuovi utenti, verifica solo la password nel database
      isCurrentPasswordValid = current_password === user.password_hash
      console.log("🔐 Database password validation for new user:", isCurrentPasswordValid)
    }

    if (!isCurrentPasswordValid) {
      console.log("❌ Invalid current password for user:", user.email)
      return NextResponse.json({ error: "Password corrente non valida" }, { status: 401 })
    }

    // Aggiorna la password nel database
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_hash: new_password, // In produzione: await bcrypt.hash(new_password, 10)
      })
      .eq("id", user_id)

    if (updateError) {
      console.error("Error updating password:", updateError)
      return NextResponse.json({ error: "Errore nell'aggiornamento della password" }, { status: 500 })
    }

    console.log("✅ Password successfully changed for:", user.email)
    return NextResponse.json({
      success: true,
      message: "Password aggiornata con successo",
    })
  } catch (error) {
    console.error("❌ Change password error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}
