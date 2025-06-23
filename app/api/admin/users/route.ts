import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Ottieni tutti gli utenti
export async function GET(request: Request) {
  try {
    const supabase = createClient()

    const { data: users, error } = await supabase
      .from("users")
      .select("id, name, email, role, created_at")
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: "Errore nel caricamento degli utenti" }, { status: 500 })
    }

    return NextResponse.json(users)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}

// POST - Crea un nuovo utente
export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json()

    // Validazione
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nome, email e password sono obbligatori" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "La password deve essere di almeno 6 caratteri" }, { status: 400 })
    }

    const supabase = createClient()

    // Verifica se l'email è già in uso
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (checkError) {
      return NextResponse.json({ error: "Errore nella verifica dell'email" }, { status: 500 })
    }

    if (existingUser) {
      return NextResponse.json({ error: "Email già in uso" }, { status: 400 })
    }

    // Crea l'hash della password (in un'applicazione reale)
    // In questo esempio, memorizziamo la password in chiaro per semplicità
    // In produzione, usa bcrypt o un altro algoritmo di hashing
    const password_hash = password // In produzione: await bcrypt.hash(password, 10)

    // Crea il nuovo utente con il ruolo specificato
    const { data, error } = await supabase
      .from("users")
      .insert({
        name,
        email,
        password_hash,
        role: role || "user", // Usa direttamente il ruolo specificato
      })
      .select("id, name, email, role, created_at")

    if (error) {
      console.error("Error creating user:", error)

      // Gestione specifica dell'errore di vincolo
      if (error.message && error.message.includes("violates check constraint")) {
        return NextResponse.json(
          {
            error: "Il ruolo specificato non è valido. È necessario eseguire lo script SQL per aggiornare il database.",
          },
          { status: 400 },
        )
      }

      return NextResponse.json({ error: "Errore nella creazione dell'utente" }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}
