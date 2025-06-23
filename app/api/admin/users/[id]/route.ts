import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Ottieni un utente specifico
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const supabase = createClient()

    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, role, created_at")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching user:", error)
      return NextResponse.json({ error: "Errore nel caricamento dell'utente" }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}

// PUT - Aggiorna un utente
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { name, email, role } = await request.json()

    // Validazione
    if (!name || !email) {
      return NextResponse.json({ error: "Nome e email sono campi obbligatori" }, { status: 400 })
    }

    const supabase = createClient()

    // Verifica se l'utente esiste
    const { data: existingUser, error: checkError } = await supabase.from("users").select("id").eq("id", id).single()

    if (checkError || !existingUser) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Verifica se l'email è già in uso da un altro utente
    const { data: emailCheck, error: emailCheckError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .neq("id", id) // Esclude l'utente corrente
      .maybeSingle()

    if (emailCheckError) {
      return NextResponse.json({ error: "Errore nella verifica dell'email" }, { status: 500 })
    }

    if (emailCheck) {
      return NextResponse.json({ error: "Email già in uso da un altro utente" }, { status: 400 })
    }

    // Aggiorna l'utente
    const { data, error } = await supabase
      .from("users")
      .update({
        name,
        email,
        role,
      })
      .eq("id", id)
      .select("id, name, email, role, created_at")

    if (error) {
      console.error("Error updating user:", error)

      // Gestione specifica dell'errore di vincolo
      if (error.message && error.message.includes("violates check constraint")) {
        return NextResponse.json(
          {
            error: "Il ruolo specificato non è valido. È necessario eseguire lo script SQL per aggiornare il database.",
          },
          { status: 400 },
        )
      }

      return NextResponse.json({ error: "Errore nell'aggiornamento dell'utente" }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}

// DELETE - Elimina un utente
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const supabase = createClient()

    // Verifica se l'utente esiste
    const { data: existingUser, error: checkError } = await supabase.from("users").select("id").eq("id", id).single()

    if (checkError || !existingUser) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Elimina l'utente
    const { error } = await supabase.from("users").delete().eq("id", id)

    if (error) {
      console.error("Error deleting user:", error)
      return NextResponse.json({ error: "Errore nell'eliminazione dell'utente" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}
