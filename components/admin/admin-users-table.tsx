"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit } from "lucide-react"
import { DeleteUserDialog } from "./delete-user-dialog"

interface User {
  id: string
  email: string
  name?: string
  role?: string
  created_at: string
}

interface AdminUsersTableProps {
  users: User[]
}

export function AdminUsersTable({ users: initialUsers }: AdminUsersTableProps) {
  const [users, setUsers] = useState(initialUsers)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)

  const handleDeleteSuccess = () => {
    if (deleteUser) {
      setUsers(users.filter((user) => user.id !== deleteUser.id))
      setDeleteUser(null)
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      user.role === "admin" ? "destructive" : user.role === "moderator" ? "default" : "secondary"
                    }
                    className={
                      user.role === "admin"
                        ? "bg-red-500 hover:bg-red-600"
                        : user.role === "moderator"
                          ? "bg-blue-500 hover:bg-blue-600"
                          : ""
                    }
                  >
                    {user.role === "admin" ? "ADMIN" : user.role === "moderator" ? "MOD" : "USER"}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteUser(user)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {deleteUser && (
        <DeleteUserDialog
          user={deleteUser}
          open={!!deleteUser}
          onOpenChange={(open) => !open && setDeleteUser(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </>
  )
}
