import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json() // 'email' ora contiene l'username

    console.log("🔍 Login attempt:", { username: email, password: "***" })

    const supabase = createServerClient()

    // Mappa username alle email esistenti nel database
    const usernameToEmailMap: Record<string, string> = {
      pedonev: "vpedone@entermed.it",
      terranap: "pterrana@entermed.it",
      fazioc: "cfazio@entermed.it",
      geracig: "ggeraci@entermed.it",
      pipitones: "spipitone@entermed.it", // Nuovo utente aggiunto
    }

    // Ottieni l'email dal mapping username o usa direttamente l'input come email
    const actualEmail = usernameToEmailMap[email] || email
    console.log("📧 Email mapping:", { username: email, actualEmail })

    // Cerca l'utente nel database usando l'email mappata
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

    // Verifica la password usando l'username inserito o direttamente la password nel database
    let isValidPassword = false

    // Prima controlla le password hardcoded per gli utenti esistenti
    switch (email) {
      case "pedonev":
        isValidPassword = password === "@Vincenzo29"
        break
      case "terranap":
        isValidPassword = password === "@Anita123"
        break
      case "fazioc":
        isValidPassword = password === "@Silvia123"
        break
      case "geracig":
        isValidPassword = password === "Entermed$01"
        break
      case "pipitones":
        isValidPassword = password === "Entermed$01"
        break
      default:
        // Per i nuovi utenti, verifica la password nel database
        isValidPassword = password === user.password_hash
    }

    console.log("🔐 Password validation:", { username: email, isValid: isValidPassword })

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
