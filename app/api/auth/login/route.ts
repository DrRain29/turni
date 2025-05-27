import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json() // 'email' ora contiene l'username

    const supabase = createServerClient()

    // Mappa username alle email esistenti nel database
    const usernameToEmailMap: Record<string, string> = {
      pedonev: "vpedone@entermed.it",
      terranap: "pterrana@entermed.it",
      fazioc: "cfazio@entermed.it",
      ggeraci: "ggeraci@entermed.it", // Se esiste ancora
    }

    // Ottieni l'email dal mapping username
    const actualEmail = usernameToEmailMap[email] || email

    // Cerca l'utente nel database usando l'email mappata
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, name, password_hash, role")
      .eq("email", actualEmail)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 })
    }

    // Verifica la password usando l'username inserito
    let isValidPassword = false

    switch (
      email // 'email' contiene l'username inserito
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
      case "ggeraci":
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
