import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerClient()

    const { data: vacations, error } = await supabase
      .from("vacation_bookings")
      .select(`
        *,
        users (
          name,
          email
        )
      `)
      .eq("status", "confirmed")
      .order("start_date", { ascending: true })

    if (error) {
      console.error("Error fetching vacations:", error)
      return NextResponse.json({ error: "Errore nel caricamento delle ferie" }, { status: 500 })
    }

    return NextResponse.json(vacations)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, start_date, end_date, notes } = await request.json()

    const supabase = createServerClient()

    // Controlla sovrapposizioni
    const { data: overlapping, error: checkError } = await supabase
      .from("vacation_bookings")
      .select("*")
      .eq("user_id", user_id)
      .eq("status", "confirmed")
      .or(`start_date.lte.${end_date},end_date.gte.${start_date}`)

    if (checkError) {
      return NextResponse.json({ error: "Errore nella verifica" }, { status: 500 })
    }

    if (overlapping && overlapping.length > 0) {
      return NextResponse.json({ error: "Hai già delle ferie prenotate in questo periodo" }, { status: 400 })
    }

    // Inserisce la nuova prenotazione
    const { data, error } = await supabase
      .from("vacation_bookings")
      .insert({
        user_id,
        start_date,
        end_date,
        notes,
        status: "confirmed",
      })
      .select()

    if (error) {
      return NextResponse.json({ error: "Errore nella prenotazione" }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}
