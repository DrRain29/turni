import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const userId = params.id

    const { error } = await supabase.from("users").delete().eq("id", userId)

    if (error) {
      console.error("Error deleting user:", error)

      // Gestione specifica per errori di vincolo di chiave esterna
      if (error.message.includes("foreign key constraint") || error.code === "23503") {
        return NextResponse.json(
          {
            error: "Impossibile eliminare l'utente: ha dei turni associati. Rimuovi prima tutti i turni dell'utente.",
          },
          { status: 400 },
        )
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting user:", error)

    // Gestione dell'errore anche nel catch
    if (error.message && (error.message.includes("foreign key constraint") || error.message.includes("violates"))) {
      return NextResponse.json(
        {
          error: "Impossibile eliminare l'utente: ha dei turni associati. Rimuovi prima tutti i turni dell'utente.",
        },
        { status: 400 },
      )
    }

    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const userId = params.id

    const { data: user, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
