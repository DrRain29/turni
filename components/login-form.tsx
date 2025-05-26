"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { LogIn } from "lucide-react"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const success = await login(email, password)

    if (!success) {
      setError("Credenziali non valide")
    }

    setIsLoading(false)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogIn className="h-5 w-5" />
          Accesso Dipendenti
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@entermed.it"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Inserisci la tua password"
              required
            />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Accesso in corso..." : "Accedi"}
          </Button>
        </form>
        <div className="mt-4 text-sm text-gray-600">
          <p>
            <strong>Utenti Entermed:</strong>
          </p>
          <div className="space-y-1 mt-2">
            <p>
              <strong>Vincenzo Pedone</strong> (Admin): vpedone@entermed.it
            </p>
            <p>
              <strong>Giorgio Geraci</strong> (Admin): ggeraci@entermed.it
            </p>
            <p>
              <strong>Piero Terrana</strong>: pterrana@entermed.it
            </p>
            <p>
              <strong>Cristian Fazio</strong>: cfazio@entermed.it
            </p>
          </div>
          <p className="mt-2">
            <strong>Password:</strong> Vincenzo: @Vincenzo29 | Altri: 1234
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
