import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const userId = params.id

    // First, check if the user exists
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("id, email, role")
      .eq("id", userId)
      .single()

    if (fetchError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent deletion of admin users (optional safety check)
    if (user.role === "admin") {
      return NextResponse.json({ error: "Cannot delete admin users" }, { status: 403 })
    }

    // Option 1: If you've updated the foreign key constraints with CASCADE,
    // this simple delete should work:
    const { error: deleteError } = await supabase.from("users").delete().eq("id", userId)

    if (deleteError) {
      console.error("Error deleting user:", deleteError)

      // If we still get a foreign key constraint error, handle it manually
      if (deleteError.message.includes("foreign key constraint")) {
        return await handleManualDeletion(supabase, userId)
      }

      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Fallback function for manual deletion if CASCADE isn't set up
async function handleManualDeletion(supabase: any, userId: string) {
  try {
    // Start a transaction-like approach by handling related records first

    // Option A: Delete all shifts created by this user
    const { error: shiftsError } = await supabase.from("shifts").delete().eq("created_by", userId)

    if (shiftsError) {
      console.error("Error deleting user shifts:", shiftsError)
      return NextResponse.json({ error: "Failed to delete user shifts" }, { status: 500 })
    }

    // Option B: Or set assigned shifts to null instead of deleting them
    const { error: assignedShiftsError } = await supabase
      .from("shifts")
      .update({ assigned_to: null })
      .eq("assigned_to", userId)

    if (assignedShiftsError) {
      console.error("Error updating assigned shifts:", assignedShiftsError)
      return NextResponse.json({ error: "Failed to update assigned shifts" }, { status: 500 })
    }

    // Add any other related table cleanup here
    // For example:
    // - time_off_requests
    // - user_preferences
    // - etc.

    // Finally, delete the user
    const { error: deleteError } = await supabase.from("users").delete().eq("id", userId)

    if (deleteError) {
      console.error("Error deleting user after cleanup:", deleteError)
      return NextResponse.json({ error: "Failed to delete user after cleanup" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in manual deletion:", error)
    return NextResponse.json({ error: "Failed to delete user manually" }, { status: 500 })
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
