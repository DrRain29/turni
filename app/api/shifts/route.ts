import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerClient()

    // Prima otteniamo tutti i turni
    const { data: shifts, error: shiftsError } = await supabase
      .from("shifts")
      .select("*")
      .eq("status", "scheduled")
      .order("date", { ascending: true })

    if (shiftsError) {
      console.error("Error fetching shifts:", shiftsError)
      return NextResponse.json({ error: "Errore nel caricamento dei turni" }, { status: 500 })
    }

    // Poi otteniamo tutti gli utenti
    const { data: users, error: usersError } = await supabase.from("users").select("id, name, email")

    if (usersError) {
      console.error("Error fetching users:", usersError)
      return NextResponse.json({ error: "Errore nel caricamento degli utenti" }, { status: 500 })
    }

    // Poi otteniamo tutti i tipi di turno
    const { data: shiftTypes, error: shiftTypesError } = await supabase.from("shift_types").select("*")

    if (shiftTypesError) {
      console.error("Error fetching shift types:", shiftTypesError)
      return NextResponse.json({ error: "Errore nel caricamento dei tipi di turno" }, { status: 500 })
    }

    // Creiamo delle mappe per lookup veloce
    const usersMap = new Map(users?.map((user) => [user.id, user]) || [])
    const shiftTypesMap = new Map(shiftTypes?.map((st) => [st.id, st]) || [])

    // Combiniamo i dati manualmente
    const enrichedShifts =
      shifts?.map((shift) => ({
        ...shift,
        users: usersMap.get(shift.user_id) || null,
        shift_types: shiftTypesMap.get(shift.shift_type_id) || null,
      })) || []

    console.log("Shifts found:", shifts?.length || 0)
    console.log("Users found:", users?.length || 0)
    console.log("Shift types found:", shiftTypes?.length || 0)
    console.log("Sample enriched shift:", enrichedShifts[0])

    return NextResponse.json(enrichedShifts)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    const { data: shift, error } = await supabase
      .from("shifts")
      .insert([
        {
          user_id: body.user_id,
          shift_type_id: body.shift_type_id,
          date: body.date,
          start_time: body.start_time,
          end_time: body.end_time,
          notes: body.notes || null,
          status: "scheduled",
          created_by: body.created_by,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating shift:", error)
      return NextResponse.json({ error: "Errore nella creazione del turno" }, { status: 500 })
    }

    return NextResponse.json(shift)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}
