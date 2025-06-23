import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerClient()

    // Query per tutti i dati
    const [usersResult, shiftsResult, shiftTypesResult] = await Promise.all([
      supabase.from("users").select("id, name, email, role").order("name"),
      supabase
        .from("shifts")
        .select("id, user_id, shift_type_id, date, start_time, end_time, status")
        .eq("status", "scheduled")
        .order("date"),
      supabase.from("shift_types").select("id, name, color, description").order("name"),
    ])

    const response = {
      users: {
        data: usersResult.data,
        error: usersResult.error,
        count: usersResult.data?.length || 0,
      },
      shifts: {
        data: shiftsResult.data,
        error: shiftsResult.error,
        count: shiftsResult.data?.length || 0,
      },
      shiftTypes: {
        data: shiftTypesResult.data,
        error: shiftTypesResult.error,
        count: shiftTypesResult.data?.length || 0,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Debug API error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}
