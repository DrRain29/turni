import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const userRole = searchParams.get("user_role")

    if (!userId || !userRole) {
      return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Verifica se l'utente può eliminare questa prenotazione
    const { data: vacation, error: fetchError } = await supabase
      .from("vacation_bookings")
      .select("user_id")
      .eq("id", params.id)
      .single()

    if (fetchError || !vacation) {
      return NextResponse.json({ error: "Prenotazione non trovata" }, { status: 404 })
    }

    // Controlla i permessi: admin può eliminare tutto, user solo le proprie
    const canDelete = userRole === "admin" || vacation.user_id === userId

    if (!canDelete) {
      return NextResponse.json({ error: "Non hai i permessi per eliminare questa prenotazione" }, { status: 403 })
    }

    // Elimina la prenotazione
    const { error: deleteError } = await supabase.from("vacation_bookings").delete().eq("id", params.id)

    if (deleteError) {
      return NextResponse.json({ error: "Errore nell'eliminazione" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}
