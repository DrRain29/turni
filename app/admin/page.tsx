import { createClient } from "@/lib/supabase/server"
import { AdminUsersTable } from "@/components/admin/admin-users-table"

export default async function AdminPage() {
  const supabase = createClient()

  const { data: users, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching users:", error)
    return <div>Error loading users</div>
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">Manage users and system settings</p>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Users</h2>
          <AdminUsersTable users={users || []} />
        </div>
      </div>
    </div>
  )
}
