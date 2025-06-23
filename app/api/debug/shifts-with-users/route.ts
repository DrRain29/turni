import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerClient()

    // Test diretto della query
    const { data: shifts, error } = await supabase
      .from("shifts")
      .select(`
        *,
        users (
          id,
          name,
          email
        ),
        shift_types (
          id,
          name,
          color
        )
      `)
      .eq("status", "scheduled")
      .limit(5)

    return NextResponse.json({
      success: !error,
      error: error?.message,
      data: shifts,
      count: shifts?.length || 0,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      data: null,
      count: 0,
    })
  }
}
