import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const supabase = createServerClient()

    // Cerca l'utente nel database
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, name, password_hash, role, custom_password")
      .eq("email", email)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 })
    }

    // Verifica la password
    let isValidPassword = false

    if (user.custom_password) {
      // Se l'utente ha una password personalizzata, usa quella
      isValidPassword = password === user.custom_password
    } else {
      // Altrimenti usa le password predefinite
      switch (email) {
        case "vpedone@entermed.it":
          isValidPassword = password === "@Vincenzo29"
          break
        case "pterrana@entermed.it":
        case "cfazio@entermed.it":
        case "ggeraci@entermed.it":
          isValidPassword = password === "1234"
          break
        default:
          isValidPassword = false
      }
    }

    if (!isValidPassword) {
      return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 })
    }

    // Restituisce i dati dell'utente incluso il ruolo (senza password)
    const { password_hash, custom_password, ...userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}
