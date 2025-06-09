import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// PUT - Aggiorna la password di un utente
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { password } = await request.json()

    // Validazione
    if (!password) {
      return NextResponse.json({ error: "La password è obbligatoria" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "La password deve essere di almeno 6 caratteri" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Verifica se l'utente esiste
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("id", params.id)
      .single()

    if (checkError || !existingUser) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Crea l'hash della password (in un'applicazione reale)
    // In questo esempio, memorizziamo la password in chiaro per semplicità
    // In produzione, usa bcrypt o un altro algoritmo di hashing
    const password_hash = password // In produzione: await bcrypt.hash(password, 10)

    // Aggiorna la password dell'utente
    const { error } = await supabase
      .from("users")
      .update({
        password_hash,
      })
      .eq("id", params.id)

    if (error) {
      console.error("Error updating password:", error)
      return NextResponse.json({ error: "Errore nell'aggiornamento della password" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}
