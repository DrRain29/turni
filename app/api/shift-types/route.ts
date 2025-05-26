import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerClient()

    const { data: shiftTypes, error } = await supabase
      .from("shift_types")
      .select("*")
      .order("start_time", { ascending: true })

    if (error) {
      console.error("Error fetching shift types:", error)
      return NextResponse.json({ error: "Errore nel caricamento dei tipi di turno" }, { status: 500 })
    }

    return NextResponse.json(shiftTypes)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}
