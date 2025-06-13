"use client"

import type React from "react"

import { useState } from "react"
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
  // Stato per tenere traccia del menu aperto
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

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

  // Funzioni per gestire le azioni
  const handleAction = (action: (user: User) => void, user: User) => {
    return (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setOpenMenuId(null)
      action(user)
    }
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
            const isOpen = openMenuId === user.id

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
                  <DropdownMenu open={isOpen} onOpenChange={(open) => setOpenMenuId(open ? user.id : null)}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <span className="sr-only">Apri menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuLabel className="text-xs">Azioni</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <div onMouseDown={(e) => e.preventDefault()}>
                        <DropdownMenuItem
                          className="text-xs cursor-pointer flex items-center gap-1.5"
                          onClick={handleAction(onEdit, user)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Modifica
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-xs cursor-pointer flex items-center gap-1.5"
                          onClick={handleAction(onChangePassword, user)}
                        >
                          <Key className="h-3.5 w-3.5" />
                          Cambia Password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-xs cursor-pointer flex items-center gap-1.5 text-red-600 focus:text-red-600"
                          onClick={handleAction(onDelete, user)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Elimina
                        </DropdownMenuItem>
                      </div>
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
