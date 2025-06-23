"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, User } from "lucide-react"

interface VacationDescriptionDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (description: string, userId?: string) => void
  selectedDates: string[]
  isLoading: boolean
  isAdmin?: boolean
  currentUserId?: string
}

interface UserType {
  id: string
  name: string
  email: string
}

export function VacationDescriptionDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedDates,
  isLoading,
  isAdmin = false,
  currentUserId,
}: VacationDescriptionDialogProps) {
  const [description, setDescription] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUserId || "")
  const [users, setUsers] = useState<UserType[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Carica la lista degli utenti se è admin
  useEffect(() => {
    if (isAdmin && isOpen) {
      setLoadingUsers(true)
      fetch("/api/users")
        .then((res) => res.json())
        .then((data) => {
          setUsers(data)
          // Se non è stato selezionato un utente, usa l'utente corrente come default
          if (!selectedUserId && currentUserId) {
            setSelectedUserId(currentUserId)
          }
        })
        .catch((error) => {
          console.error("Errore nel caricamento utenti:", error)
        })
        .finally(() => {
          setLoadingUsers(false)
        })
    }
  }, [isAdmin, isOpen, currentUserId, selectedUserId])

  // Reset quando si chiude il dialog
  useEffect(() => {
    if (!isOpen) {
      setDescription("")
      setSelectedUserId(currentUserId || "")
    }
  }, [isOpen, currentUserId])

  const getConsecutiveRanges = (dates: string[]) => {
    if (dates.length === 0) return []

    const sortedDates = dates.sort()
    const ranges: { start: string; end: string; count: number }[] = []
    let currentStart = sortedDates[0]
    let currentEnd = sortedDates[0]

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1])
      const currentDate = new Date(sortedDates[i])
      const diffDays = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)

      if (diffDays === 1) {
        currentEnd = sortedDates[i]
      } else {
        ranges.push({
          start: currentStart,
          end: currentEnd,
          count:
            Math.floor((new Date(currentEnd).getTime() - new Date(currentStart).getTime()) / (1000 * 60 * 60 * 24)) + 1,
        })
        currentStart = sortedDates[i]
        currentEnd = sortedDates[i]
      }
    }

    ranges.push({
      start: currentStart,
      end: currentEnd,
      count:
        Math.floor((new Date(currentEnd).getTime() - new Date(currentStart).getTime()) / (1000 * 60 * 60 * 24)) + 1,
    })

    return ranges
  }

  const handleConfirm = () => {
    const finalUserId = isAdmin ? selectedUserId : currentUserId
    onConfirm(description, finalUserId)
  }

  const selectedUser = users.find((user) => user.id === selectedUserId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Conferma Prenotazione Ferie
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selezione utente per admin */}
          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="user-select" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Utente
              </Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={loadingUsers}>
                <SelectTrigger id="user-select">
                  <SelectValue placeholder={loadingUsers ? "Caricamento..." : "Seleziona utente"} />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedUser && (
                <p className="text-sm text-gray-600">
                  Stai creando ferie per: <strong>{selectedUser.name}</strong>
                </p>
              )}
            </div>
          )}

          {/* Riepilogo date selezionate */}
          <div className="space-y-2">
            <Label>Periodi selezionati:</Label>
            <div className="bg-blue-50 p-3 rounded-lg space-y-1">
              {getConsecutiveRanges(selectedDates).map((range, index) => (
                <div key={index} className="text-sm">
                  <strong>
                    {new Date(range.start).toLocaleDateString("it-IT")}
                    {range.start !== range.end && ` - ${new Date(range.end).toLocaleDateString("it-IT")}`}
                  </strong>
                  <span className="text-gray-600 ml-2">
                    ({range.count} {range.count === 1 ? "giorno" : "giorni"})
                  </span>
                </div>
              ))}
              <div className="text-sm font-medium text-blue-700 mt-2">
                Totale: {selectedDates.length} {selectedDates.length === 1 ? "giorno" : "giorni"}
              </div>
            </div>
          </div>

          {/* Descrizione */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrizione (opzionale)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Es. Vacanza estiva, ferie natalizie..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Annulla
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || (isAdmin && !selectedUserId)}>
            {isLoading ? "Prenotazione..." : "Conferma Prenotazione"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
