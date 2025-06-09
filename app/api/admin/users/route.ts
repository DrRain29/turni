import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// Funzione per verificare se l'utente è admin
async function isAdmin(request: Request) {
  try {
    // Estrai l'ID utente e il ruolo dalla sessione o dal token
    // Questo è un esempio, dovresti adattarlo al tuo sistema di autenticazione
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return false
    }

    // Implementa la tua logica di verifica qui
    // Per ora, assumiamo che l'utente sia admin se ha un header valido
    return true
  } catch (error) {
    console.error("Error verifying admin:", error)
    return false
  }
}

// GET - Ottieni tutti gli utenti
export async function GET(request: Request) {
  try {
    // Verifica che l'utente sia admin
    // const isUserAdmin = await isAdmin(request)
    // if (!isUserAdmin) {
    //   return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
    // }

    const supabase = createServerClient()

    // Rimuovi username dalla query per ora
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
    // Verifica che l'utente sia admin
    // const isUserAdmin = await isAdmin(request)
    // if (!isUserAdmin) {
    //   return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
    // }

    const { name, email, password, role } = await request.json()

    // Validazione
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nome, email e password sono obbligatori" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "La password deve essere di almeno 6 caratteri" }, { status: 400 })
    }

    const supabase = createServerClient()

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

    // Crea il nuovo utente (senza username per ora)
    const { data, error } = await supabase
      .from("users")
      .insert({
        name,
        email,
        password_hash,
        role: role || "user", // Default a "user" se non specificato
      })
      .select("id, name, email, role, created_at")

    if (error) {
      console.error("Error creating user:", error)
      return NextResponse.json({ error: "Errore nella creazione dell'utente" }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}
