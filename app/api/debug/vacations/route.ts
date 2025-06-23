import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    const supabase = createServerClient()

    let query = supabase
      .from("vacation_bookings")
      .select(`
        *,
        users (
          name,
          email
        )
      `)
      .order("start_date", { ascending: true })

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data: vacations, error } = await query

    if (error) {
      console.error("Error fetching debug vacations:", error)
      return NextResponse.json({ error: "Errore nel caricamento delle ferie" }, { status: 500 })
    }

    // Raggruppa per status
    const grouped = vacations?.reduce(
      (acc, vacation) => {
        const status = vacation.status || "unknown"
        if (!acc[status]) acc[status] = []
        acc[status].push({
          id: vacation.id,
          user_name: vacation.users?.name,
          start_date: vacation.start_date,
          end_date: vacation.end_date,
          notes: vacation.notes,
          created_at: vacation.created_at,
        })
        return acc
      },
      {} as Record<string, any[]>,
    )

    return NextResponse.json({
      total: vacations?.length || 0,
      by_status: grouped,
      all_records: vacations?.map((v) => ({
        id: v.id,
        user_name: v.users?.name,
        start_date: v.start_date,
        end_date: v.end_date,
        status: v.status,
        notes: v.notes,
        created_at: v.created_at,
      })),
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}
