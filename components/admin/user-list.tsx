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
import { Edit, Key, Trash2, MoreHorizontal, Shield, UserIcon, UserCog } from "lucide-react"
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

  // Utenti legacy con username specifici
  const legacyUsers = [
    "vpedone@entermed.it",
    "pterrana@entermed.it",
    "cfazio@entermed.it",
    "ggeraci@entermed.it",
    "spipitone@entermed.it",
  ]

  const getLegacyUsername = (email: string): string | null => {
    const emailToUsernameMap: Record<string, string> = {
      "vpedone@entermed.it": "pedonev",
      "pterrana@entermed.it": "terranap",
      "cfazio@entermed.it": "fazioc",
      "ggeraci@entermed.it": "geracig",
      "spipitone@entermed.it": "pipitones",
    }
    return emailToUsernameMap[email] || null
  }

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
          {users.map((user) => {
            const legacyUsername = getLegacyUsername(user.email)
            const isLegacyUser = legacyUsers.includes(user.email)

            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {isLegacyUser ? (
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-xs">
                        {legacyUsername}
                      </Badge>
                      <div className="text-xs text-gray-500">Username legacy</div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="text-sm">{user.email}</span>
                      <div className="text-xs text-gray-500">Usa email per login</div>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {user.role === "admin" ? (
                    <Badge variant="destructive" className="flex items-center w-fit gap-1">
                      <Shield className="h-3 w-3" />
                      Admin
                    </Badge>
                  ) : user.role === "moderator" ? (
                    <Badge
                      variant="outline"
                      className="flex items-center w-fit gap-1 bg-sky-100 text-sky-700 border-sky-200"
                    >
                      <UserCog className="h-3 w-3" />
                      Mod
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
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 focus:ring-0 focus:ring-offset-0">
                        <span className="sr-only">Apri menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Azioni</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => onEdit(user)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Edit className="h-4 w-4" />
                        Modifica
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => onChangePassword(user)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Key className="h-4 w-4" />
                        Cambia Password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => onDelete(user)}
                        className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                        Elimina
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
