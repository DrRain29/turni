"use client"

import { useState, useRef, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  const menuRef = useRef<HTMLDivElement>(null)

  // Chiudi il menu quando si clicca fuori
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

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

  // Toggle menu
  const toggleMenu = (userId: string) => {
    setOpenMenuId(openMenuId === userId ? null : userId)
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
                <TableCell className="text-right relative">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toggleMenu(user.id)}>
                    <span className="sr-only">Apri menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>

                  {isOpen && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 mt-2 w-44 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                    >
                      <div className="py-1">
                        <div className="px-3 py-1.5 text-xs text-gray-700 font-medium border-b">Azioni</div>
                        <button
                          className="flex items-center w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            setOpenMenuId(null)
                            onEdit(user)
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1.5" />
                          Modifica
                        </button>
                        <button
                          className="flex items-center w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            setOpenMenuId(null)
                            onChangePassword(user)
                          }}
                        >
                          <Key className="h-3 w-3 mr-1.5" />
                          Cambia Password
                        </button>
                        <div className="border-t my-0.5"></div>
                        <button
                          className="flex items-center w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-gray-100"
                          onClick={() => {
                            setOpenMenuId(null)
                            onDelete(user)
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-1.5" />
                          Elimina
                        </button>
                      </div>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
