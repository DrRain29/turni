"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserPlus, AlertCircle, Check } from "lucide-react"

interface CreateUserFormProps {
  onUserCreated: () => void
}

export function CreateUserForm({ onUserCreated }: CreateUserFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("user")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!name || !email || !password || !username) {
      setError("Nome, email, username e password sono campi obbligatori")
      return
    }

    if (password.length < 6) {
      setError("La password deve essere di almeno 6 caratteri")
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          username,
          password,
          role,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Errore nella creazione dell'utente")
      }

      setSuccess("Utente creato con successo!")
      setName("")
      setEmail("")
      setUsername("")
      setPassword("")
      setRole("user")

      // Notifica il componente padre
      setTimeout(() => {
        onUserCreated()
      }, 1500)
    } catch (error: any) {
      setError(error.message || "Si è verificato un errore")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nome Completo *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome e Cognome"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@esempio.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username per login *</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            required
          />
          <p className="text-xs text-gray-500">Questo username verrà utilizzato per l'accesso</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimo 6 caratteri"
            required
            minLength={6}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Ruolo *</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger id="role">
              <SelectValue placeholder="Seleziona ruolo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">Utente</SelectItem>
              <SelectItem value="admin">Amministratore</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
        <UserPlus className="h-4 w-4 mr-2" />
        {isLoading ? "Creazione in corso..." : "Crea Utente"}
      </Button>
    </form>
  )
}
