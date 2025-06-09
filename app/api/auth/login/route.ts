import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json() // 'email' contiene l'username/email inserito

    console.log("🔍 Login attempt:", { username: email, password: "***" })

    const supabase = createServerClient()

    // Mappa username alle email esistenti nel database (utenti legacy)
    const usernameToEmailMap: Record<string, string> = {
      pedonev: "vpedone@entermed.it",
      terranap: "pterrana@entermed.it",
      fazioc: "cfazio@entermed.it",
      geracig: "ggeraci@entermed.it",
      pipitones: "spipitone@entermed.it",
    }

    // Password hardcoded per utenti legacy
    const legacyPasswords: Record<string, string> = {
      pedonev: "@Vincenzo29",
      terranap: "@Anita123",
      fazioc: "@Silvia123",
      geracig: "Entermed$01",
      pipitones: "Entermed$01",
    }

    let actualEmail = email
    let isLegacyUser = false

    // Controlla se è un utente legacy
    if (usernameToEmailMap[email]) {
      actualEmail = usernameToEmailMap[email]
      isLegacyUser = true
      console.log("📧 Legacy user detected:", { username: email, actualEmail })
    } else {
      console.log("📧 New user or email login:", { email })
    }

    // Cerca l'utente nel database usando l'email
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, name, password_hash, role")
      .eq("email", actualEmail)
      .single()

    console.log("👤 Database query result:", { user: user ? "found" : "not found", error })

    if (error || !user) {
      console.log("❌ User not found in database")
      return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 })
    }

    // Verifica la password
    let isValidPassword = false

    if (isLegacyUser) {
      // Per utenti legacy, usa le password hardcoded
      isValidPassword = password === legacyPasswords[email]
      console.log("🔐 Legacy password validation:", { username: email, isValid: isValidPassword })
    } else {
      // Per nuovi utenti, verifica la password nel database
      isValidPassword = password === user.password_hash
      console.log("🔐 Database password validation:", { email: actualEmail, isValid: isValidPassword })
    }

    if (!isValidPassword) {
      console.log("❌ Invalid password")
      return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 })
    }

    console.log("✅ Login successful for:", user.name)

    // Restituisce i dati dell'utente incluso il ruolo (senza password)
    const { password_hash, ...userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}
