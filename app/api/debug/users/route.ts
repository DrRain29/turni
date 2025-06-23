import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Prima verifichiamo se la tabella users esiste
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_name", "users")

    console.log("Tables check:", { tables, tablesError })

    // Proviamo a ottenere tutti gli utenti
    const { data: users, error: usersError } = await supabase.from("users").select("*")

    console.log("Users query result:", { users, usersError })

    // Proviamo anche con una query raw
    const { data: rawUsers, error: rawError } = await supabase.rpc("get_all_users").catch(() => {
      // Se la funzione non esiste, proviamo una query diretta
      return supabase.from("users").select("*")
    })

    return NextResponse.json({
      tablesCheck: { tables, tablesError },
      usersQuery: { users, usersError },
      rawQuery: { rawUsers, rawError },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Debug API error:", error)
    return NextResponse.json(
      {
        error: "Errore del server",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

// POST - Ricrea gli utenti di base
export async function POST() {
  try {
    const supabase = createClient()

    // Utenti di base da ricreare
    const baseUsers = [
      {
        name: "Amministratore",
        email: "admin@entermed.it",
        password_hash: "admin123",
        role: "admin",
      },
      {
        name: "Utente Test",
        email: "test@entermed.it",
        password_hash: "test123",
        role: "user",
      },
      {
        name: "Moderatore",
        email: "moderator@entermed.it",
        password_hash: "mod123",
        role: "moderator",
      },
    ]

    const results = []

    for (const user of baseUsers) {
      const { data, error } = await supabase
        .from("users")
        .upsert(user, {
          onConflict: "email",
          ignoreDuplicates: false,
        })
        .select()

      results.push({ user: user.email, data, error })
    }

    return NextResponse.json({
      message: "Utenti ricreati",
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Debug POST error:", error)
    return NextResponse.json(
      {
        error: "Errore nella ricreazione degli utenti",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
