"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserList } from "./user-list"
import { CreateUserForm } from "./create-user-form"
import { EditUserDialog } from "./edit-user-dialog"
import { ChangeUserPasswordDialog } from "./change-user-password-dialog"
import { DeleteUserDialog } from "./delete-user-dialog"
import { Users, UserPlus, RefreshCw } from "lucide-react"
import type { User } from "@/types/database"

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("list")
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [passwordUser, setPasswordUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      setError("")
      const response = await fetch("/api/admin/users")

      if (!response.ok) {
        throw new Error("Errore nel caricamento degli utenti")
      }

      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error("Error fetching users:", error)
      setError("Si è verificato un errore nel caricamento degli utenti")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleEditUser = (user: User) => {
    setEditingUser(user)
  }

  const handleChangePassword = (user: User) => {
    setPasswordUser(user)
  }

  const handleDeleteUser = (user: User) => {
    setDeletingUser(user)
  }

  const handleUserCreated = () => {
    fetchUsers()
    setActiveTab("list")
  }

  const handleUserUpdated = () => {
    fetchUsers()
    setEditingUser(null)
  }

  const handlePasswordChanged = () => {
    setPasswordUser(null)
  }

  const handleUserDeleted = () => {
    fetchUsers()
    setDeletingUser(null)
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Lista Utenti
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Crea Utente
            </TabsTrigger>
          </TabsList>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Aggiorna
          </Button>
        </div>

        <TabsContent value="list" className="mt-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestione Utenti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UserList
                users={users}
                isLoading={isLoading}
                error={error}
                onEdit={handleEditUser}
                onChangePassword={handleChangePassword}
                onDelete={handleDeleteUser}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="mt-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Crea Nuovo Utente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CreateUserForm onUserCreated={handleUserCreated} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog per modificare utente */}
      <EditUserDialog
        isOpen={!!editingUser}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onUserUpdated={handleUserUpdated}
      />

      {/* Dialog per cambiare password */}
      <ChangeUserPasswordDialog
        isOpen={!!passwordUser}
        user={passwordUser}
        onClose={() => setPasswordUser(null)}
        onPasswordChanged={handlePasswordChanged}
      />

      {/* Dialog per eliminare utente */}
      <DeleteUserDialog
        isOpen={!!deletingUser}
        user={deletingUser}
        onClose={() => setDeletingUser(null)}
        onUserDeleted={handleUserDeleted}
      />
    </div>
  )
}
