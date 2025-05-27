import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const supabase = createServerClient()

    // Cerca l'utente nel database per username
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, name, password_hash, role")
      .eq("email", email) // Temporaneamente manteniamo email, ma useremo username
      .single()

    if (error || !user) {
      return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 })
    }

    // Verifica la password con username invece di email
    let isValidPassword = false

    switch (
      email // Ora 'email' contiene l'username
    ) {
      case "pedonev":
        isValidPassword = password === "@Vincenzo29"
        break
      case "terranap":
        isValidPassword = password === "@Anita123"
        break
      case "fazioc":
        isValidPassword = password === "@Silvia123"
        break
      case "ggeraci@entermed.it": // Mantieni questo se esiste ancora
        isValidPassword = password === "1234"
        break
      default:
        isValidPassword = false
    }

    if (!isValidPassword) {
      return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 })
    }

    // Restituisce i dati dell'utente incluso il ruolo (senza password)
    const { password_hash, ...userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}
