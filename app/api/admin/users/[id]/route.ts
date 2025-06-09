import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// GET - Ottieni un utente specifico
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()

    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, username, role, created_at")
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Error fetching user:", error)
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
    const { name, email, username, role } = await request.json()

    // Validazione
    if (!name || !email) {
      return NextResponse.json({ error: "Nome e email sono obbligatori" }, { status: 400 })
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

    // Verifica se l'email è già in uso da un altro utente
    const { data: emailUser, error: emailError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .neq("id", params.id) // Escludi l'utente corrente
      .maybeSingle()

    if (emailError) {
      return NextResponse.json({ error: "Errore nella verifica dell'email" }, { status: 500 })
    }

    if (emailUser) {
      return NextResponse.json({ error: "Email già in uso da un altro utente" }, { status: 400 })
    }

    // Verifica se lo username è già in uso (se fornito)
    if (username) {
      const { data: usernameUser, error: usernameError } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .neq("id", params.id) // Escludi l'utente corrente
        .maybeSingle()

      if (usernameError) {
        return NextResponse.json({ error: "Errore nella verifica dello username" }, { status: 500 })
      }

      if (usernameUser) {
        return NextResponse.json({ error: "Username già in uso da un altro utente" }, { status: 400 })
      }
    }

    // Aggiorna l'utente
    const { data, error } = await supabase
      .from("users")
      .update({
        name,
        email,
        username: username || null, // Se non fornito, usa null
        role: role || "user", // Default a "user" se non specificato
      })
      .eq("id", params.id)
      .select("id, name, email, username, role, created_at")

    if (error) {
      console.error("Error updating user:", error)
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

    // Elimina l'utente
    const { error } = await supabase.from("users").delete().eq("id", params.id)

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
