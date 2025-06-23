import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email e password sono obbligatori" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Cerca l'utente nel database
    const { data: user, error } = await supabase.from("users").select("*").eq("email", email).single()

    if (error || !user) {
      return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 })
    }

    // Verifica la password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 })
    }

    // Restituisce i dati dell'utente (senza la password)
    const { password_hash, ...userWithoutPassword } = user

    return NextResponse.json({
      user: userWithoutPassword,
      message: "Login effettuato con successo",
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}
