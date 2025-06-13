"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { ShiftType, User } from "@/types/database"

interface AddShiftDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (
    userId: string,
    shiftTypeId: string,
    date: string,
    startTime: string,
    endTime: string,
    notes: string,
  ) => Promise<boolean>
  date: string
  shiftTypes: ShiftType[]
  users: User[]
  currentUser: { id: string; role: string; name: string }
  isLoading?: boolean
}

export function AddShiftDialog({
  isOpen,
  onClose,
  onSave,
  date,
  shiftTypes,
  users,
  currentUser,
  isLoading = false,
}: AddShiftDialogProps) {
  const [userId, setUserId] = useState(currentUser.id)
  const [shiftTypeId, setShiftTypeId] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setUserId(currentUser.id)
      setShiftTypeId("")
      setStartTime("")
      setEndTime("")
      setNotes("")
      setError(null)
    }
  }, [isOpen, currentUser.id])

  // Precompila orari quando viene selezionato un tipo di turno
  useEffect(() => {
    if (shiftTypeId) {
      const selectedShiftType = shiftTypes.find((type) => type.id === shiftTypeId)
      if (selectedShiftType) {
        setStartTime(selectedShiftType.start_time)
        setEndTime(selectedShiftType.end_time)
      }
    }
  }, [shiftTypeId, shiftTypes])

  const handleSave = async () => {
    if (!userId || !shiftTypeId || !startTime || !endTime) {
      setError("Tutti i campi sono obbligatori")
      return
    }

    try {
      const success = await onSave(userId, shiftTypeId, date, startTime, endTime, notes)
      if (success) {
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Si è verificato un errore")
    }
  }

  // Determina se l'utente corrente può selezionare altri utenti
  const canSelectOtherUsers = currentUser.role === "admin" || currentUser.role === "moderator"

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Aggiungi Turno</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="user" className="text-right">
              Utente
            </Label>
            <div className="col-span-3">
              <Select value={userId} onValueChange={setUserId} disabled={!canSelectOtherUsers || isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona utente" />
                </SelectTrigger>
                <SelectContent>
                  {canSelectOtherUsers ? (
                    users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value={currentUser.id}>{currentUser.name}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="shift-type" className="text-right">
              Tipo Turno
            </Label>
            <div className="col-span-3">
              <Select value={shiftTypeId} onValueChange={setShiftTypeId} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona tipo turno" />
                </SelectTrigger>
                <SelectContent>
                  {shiftTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="start-time" className="text-right">
              Ora Inizio
            </Label>
            <div className="col-span-3">
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="end-time" className="text-right">
              Ora Fine
            </Label>
            <div className="col-span-3">
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              Note
            </Label>
            <div className="col-span-3">
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Note opzionali"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Salvataggio..." : "Salva"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
