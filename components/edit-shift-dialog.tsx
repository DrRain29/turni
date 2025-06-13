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
import type { Shift, ShiftType, User } from "@/types/database"

interface EditShiftDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (
    shiftId: string,
    userId: string,
    shiftTypeId: string,
    startTime: string,
    endTime: string,
    notes: string,
  ) => Promise<boolean>
  shift: Shift | null
  shiftTypes: ShiftType[]
  users: User[]
  currentUser: { id: string; role: string; name: string }
  isLoading?: boolean
}

export function EditShiftDialog({
  isOpen,
  onClose,
  onSave,
  shift,
  shiftTypes,
  users,
  currentUser,
  isLoading = false,
}: EditShiftDialogProps) {
  const [userId, setUserId] = useState("")
  const [shiftTypeId, setShiftTypeId] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Popola il form quando si apre il dialog o cambia il turno
  useEffect(() => {
    if (isOpen && shift) {
      setUserId(shift.user_id)
      setShiftTypeId(shift.shift_type_id)
      setStartTime(shift.start_time)
      setEndTime(shift.end_time)
      setNotes(shift.notes || "")
      setError(null)
    }
  }, [isOpen, shift])

  const handleSave = async () => {
    if (!shift || !userId || !shiftTypeId || !startTime || !endTime) {
      setError("Tutti i campi sono obbligatori")
      return
    }

    try {
      const success = await onSave(shift.id, userId, shiftTypeId, startTime, endTime, notes)
      if (success) {
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Si è verificato un errore")
    }
  }

  // Determina se l'utente corrente può modificare l'utente assegnato al turno
  const canChangeUser = currentUser.role === "admin" || currentUser.role === "moderator"

  if (!shift) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifica Turno</DialogTitle>
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
              <Select value={userId} onValueChange={setUserId} disabled={!canChangeUser || isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona utente" />
                </SelectTrigger>
                <SelectContent>
                  {canChangeUser ? (
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
