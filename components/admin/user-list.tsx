"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, Key, Trash2, MoreHorizontal, Shield, UserIcon } from "lucide-react"
import type { User } from "@/types/database"

interface UserListProps {
  users: User[]
  isLoading: boolean
  error: string
  onEdit: (user: User) => void
  onChangePassword: (user: User) => void
  onDelete: (user: User) => void
}

export function UserList({ users, isLoading, error, onEdit, onChangePassword, onDelete }: UserListProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Caricamento utenti...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Nessun utente trovato.</p>
      </div>
    )
  }

  // Mappa username alle email esistenti nel database
  const usernameToEmailMap: Record<string, string> = {
    pedonev: "vpedone@entermed.it",
    terranap: "pterrana@entermed.it",
    fazioc: "cfazio@entermed.it",
    geracig: "ggeraci@entermed.it",
    pipitones: "spipitone@entermed.it",
  }

  // Inverti la mappatura per ottenere email -> username
  const emailToUsernameMap: Record<string, string> = {}
  Object.entries(usernameToEmailMap).forEach(([username, email]) => {
    emailToUsernameMap[email] = username
  })

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Username per Login</TableHead>
            <TableHead>Ruolo</TableHead>
            <TableHead className="text-right">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                {emailToUsernameMap[user.email] || <span className="text-gray-400 italic">Usa email per login</span>}
              </TableCell>
              <TableCell>
                {user.role === "admin" ? (
                  <Badge variant="destructive" className="flex items-center w-fit gap-1">
                    <Shield className="h-3 w-3" />
                    Admin
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="flex items-center w-fit gap-1">
                    <UserIcon className="h-3 w-3" />
                    Utente
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <span className="sr-only">Apri menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Azioni</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit(user)} className="flex items-center gap-2 cursor-pointer">
                      <Edit className="h-4 w-4" />
                      Modifica
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onChangePassword(user)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Key className="h-4 w-4" />
                      Cambia Password
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(user)}
                      className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      Elimina
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
