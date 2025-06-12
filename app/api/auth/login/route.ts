import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json() // 'email' contiene l'username/email inserito

    console.log("🔍 Login attempt:", { username: email })

    const supabase = createServerClient()

    // Mappa username alle email esistenti nel database (utenti legacy)
    const usernameToEmailMap: Record<string, string> = {
      pedonev: "vpedone@entermed.it",
      terranap: "pterrana@entermed.it",
      fazioc: "cfazio@entermed.it",
      geracig: "ggeraci@entermed.it",
      pipitones: "spipitone@entermed.it",
    }

    // Password hardcoded per utenti legacy (CORRETTE)
    const legacyPasswords: Record<string, string> = {
      pedonev: "@Vincenzo29",
      terranap: "@Anita123",
      fazioc: "@Silvia123",
      geracig: "Entermed$01",
      pipitones: "Entermed$01",
    }

    let actualEmail = email
    let isLegacyUser = false
    let legacyUsername = ""

    // Controlla se è un utente legacy (login con username)
    if (usernameToEmailMap[email]) {
      actualEmail = usernameToEmailMap[email]
      isLegacyUser = true
      legacyUsername = email
      console.log("📧 Legacy user detected:", { username: email, actualEmail })
    } else {
      // Potrebbe essere un login con email diretta
      console.log("📧 Email login attempt:", { email })
    }

    // Cerca l'utente nel database usando l'email
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, name, password_hash, role")
      .eq("email", actualEmail)
      .single()

    if (error || !user) {
      console.log("❌ User not found in database for email:", actualEmail)
      return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 })
    }

    // Verifica la password
    let isValidPassword = false

    if (isLegacyUser && legacyUsername) {
      console.log("🔐 Verifying legacy user password for:", legacyUsername)

      // Per utenti legacy, verifica prima se hanno una password aggiornata nel database
      if (user.password_hash && user.password_hash.length > 0) {
        // Prova prima la password nel database (se l'hanno cambiata)
        isValidPassword = password === user.password_hash
        console.log("🔐 Trying database password:", isValidPassword)

        // Se la password del database non funziona, prova quella legacy
        if (!isValidPassword && legacyPasswords[legacyUsername]) {
          isValidPassword = password === legacyPasswords[legacyUsername]
          console.log("🔐 Trying legacy password:", isValidPassword)
        }
      } else {
        // Se non c'è password nel database, usa quella legacy
        if (legacyPasswords[legacyUsername]) {
          isValidPassword = password === legacyPasswords[legacyUsername]
          console.log("🔐 Using legacy password only:", isValidPassword)
        }
      }
    } else {
      // Per nuovi utenti o login con email, verifica solo la password nel database
      isValidPassword = password === user.password_hash
      console.log("🔐 Database password validation for new user:", isValidPassword)
    }

    if (!isValidPassword) {
      console.log("❌ Invalid password for user:", user.email)
      return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 })
    }

    console.log("✅ Login successful for:", user.name)

    // Restituisce i dati dell'utente (senza password)
    const { password_hash, ...userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("❌ Login error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}
