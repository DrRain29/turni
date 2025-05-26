"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { VacationBooking } from "@/types/database"
import { ChevronLeft, ChevronRight, Calendar, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { VacationDescriptionDialog } from "./vacation-description-dialog"
import { EditVacationDialog } from "./edit-vacation-dialog"

interface VacationCalendarProps {
  vacations: VacationBooking[]
  isAdmin?: boolean
  currentUser?: { id: string; role: string; name: string }
  onDeleteVacation?: (vacationId: string) => void
  onBookVacation?: (startDate: string, endDate: string, description: string) => Promise<boolean>
  onEditVacation?: (vacationId: string, startDate: string, endDate: string, notes: string) => Promise<boolean>
  isLoggedIn?: boolean
}

export function VacationCalendar({
  vacations,
  isAdmin = false,
  currentUser,
  onDeleteVacation,
  onBookVacation,
  onEditVacation,
  isLoggedIn = false,
}: VacationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [isSelecting, setIsSelecting] = useState(false)
  const [showDescriptionDialog, setShowDescriptionDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingVacation, setEditingVacation] = useState<VacationBooking | null>(null)
  const [isBooking, setIsBooking] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const monthNames = [
    "Gennaio",
    "Febbraio",
    "Marzo",
    "Aprile",
    "Maggio",
    "Giugno",
    "Luglio",
    "Agosto",
    "Settembre",
    "Ottobre",
    "Novembre",
    "Dicembre",
  ]

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

  const formatDateString = (year: number, month: number, day: number) => {
    return new Date(year, month, day).toISOString().split("T")[0]
  }

  const isDateInVacation = (date: number) => {
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), date)
    const dateString = checkDate.toISOString().split("T")[0]

    return vacations.filter((vacation) => {
      return dateString >= vacation.start_date && dateString <= vacation.end_date
    })
  }

  const isDateSelected = (date: number) => {
    const dateString = formatDateString(currentDate.getFullYear(), currentDate.getMonth(), date)
    return selectedDates.includes(dateString)
  }

  const isDateInPast = (date: number) => {
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return checkDate < today
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleDateClick = (date: number) => {
    if (!isLoggedIn || !currentUser || isDateInPast(date)) return

    const dateString = formatDateString(currentDate.getFullYear(), currentDate.getMonth(), date)
    const vacationsOnDay = isDateInVacation(date)

    // Non permettere selezione su giorni già occupati da altri
    if (vacationsOnDay.length > 0 && !vacationsOnDay.some((v) => v.user_id === currentUser.id)) {
      return
    }

    if (isSelecting) {
      setSelectedDates((prev) => {
        if (prev.includes(dateString)) {
          return prev.filter((d) => d !== dateString)
        } else {
          // Se abbiamo già delle date selezionate, riempi automaticamente il range
          if (prev.length > 0) {
            const allDates = [...prev, dateString].sort()
            const startDate = new Date(allDates[0])
            const endDate = new Date(allDates[allDates.length - 1])

            // Genera tutte le date nel range
            const dateRange: string[] = []
            const currentDateIter = new Date(startDate)

            while (currentDateIter <= endDate) {
              const dateStr = currentDateIter.toISOString().split("T")[0]

              // Controlla se il giorno è disponibile (non occupato da altri e non nel passato)
              const checkDate = new Date(dateStr)
              const today = new Date()
              today.setHours(0, 0, 0, 0)

              if (checkDate >= today) {
                // Verifica se il giorno è libero
                const dayVacations = vacations.filter((vacation) => {
                  return dateStr >= vacation.start_date && dateStr <= vacation.end_date
                })

                const hasOtherVacations = dayVacations.some((v) => v.user_id !== currentUser.id)

                if (!hasOtherVacations) {
                  dateRange.push(dateStr)
                }
              }

              currentDateIter.setDate(currentDateIter.getDate() + 1)
            }

            return dateRange
          } else {
            return [dateString]
          }
        }
      })
    }
  }

  const handleEditVacation = (vacation: VacationBooking) => {
    setEditingVacation(vacation)
    setShowEditDialog(true)
  }

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
        // Giorno consecutivo
        currentEnd = sortedDates[i]
      } else {
        // Gap trovato, salva il range corrente
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

    // Aggiungi l'ultimo range
    ranges.push({
      start: currentStart,
      end: currentEnd,
      count:
        Math.floor((new Date(currentEnd).getTime() - new Date(currentStart).getTime()) / (1000 * 60 * 60 * 24)) + 1,
    })

    return ranges
  }

  const startSelection = () => {
    setIsSelecting(true)
    setSelectedDates([])
  }

  const cancelSelection = () => {
    setIsSelecting(false)
    setSelectedDates([])
  }

  const confirmSelection = () => {
    if (selectedDates.length === 0) return
    setShowDescriptionDialog(true)
  }

  const handleBookingConfirm = async (description: string) => {
    if (!onBookVacation) return

    setIsBooking(true)
    const sortedDates = selectedDates.sort()
    const startDate = sortedDates[0]
    const endDate = sortedDates[sortedDates.length - 1]

    const success = await onBookVacation(startDate, endDate, description)

    if (success) {
      setIsSelecting(false)
      setSelectedDates([])
      setShowDescriptionDialog(false)
    }

    setIsBooking(false)
  }

  const handleEditConfirm = async (vacationId: string, startDate: string, endDate: string, notes: string) => {
    if (!onEditVacation) return false

    setIsEditing(true)
    const success = await onEditVacation(vacationId, startDate, endDate, notes)
    setIsEditing(false)

    if (success) {
      setShowEditDialog(false)
      setEditingVacation(null)
    }

    return success
  }

  const renderCalendarDays = () => {
    const days = []

    // Giorni vuoti all'inizio
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-20"></div>)
    }

    // Giorni del mese
    for (let day = 1; day <= daysInMonth; day++) {
      const vacationsOnDay = isDateInVacation(day)
      const isSelected = isDateSelected(day)
      const isPast = isDateInPast(day)
      const hasOtherVacations = vacationsOnDay.some((v) => v.user_id !== currentUser?.id)
      const hasMyVacations = vacationsOnDay.some((v) => v.user_id === currentUser?.id)

      days.push(
        <div
          key={day}
          className={cn("h-20 border border-gray-200 p-1 relative cursor-pointer transition-colors", {
            "bg-blue-100 border-blue-300": isSelected,
            "bg-gray-100 cursor-not-allowed": isPast,
            "bg-red-50 cursor-not-allowed": hasOtherVacations && !hasMyVacations,
            "hover:bg-gray-50": isLoggedIn && !isPast && !hasOtherVacations && !isSelected,
            "hover:bg-blue-50": isLoggedIn && !isPast && !hasOtherVacations && isSelecting,
          })}
          onClick={() => handleDateClick(day)}
        >
          <div
            className={cn("font-medium text-sm", {
              "text-gray-400": isPast,
              "text-blue-600": isSelected,
            })}
          >
            {day}
          </div>

          {vacationsOnDay.length > 0 && (
            <div className="mt-1 space-y-1">
              {vacationsOnDay.slice(0, 2).map((vacation, index) => (
                <div key={vacation.id} className="flex items-center justify-between">
                  <Badge
                    variant={vacation.user_id === currentUser?.id ? "default" : "secondary"}
                    className="text-xs px-1 py-0 flex-1 truncate"
                    title={`${vacation.users?.name}: ${vacation.notes || "Ferie"}`}
                  >
                    {vacation.users?.name}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditVacation(vacation)
                        }}
                        className="text-blue-500 hover:text-blue-700 text-xs"
                        title="Modifica ferie"
                      >
                        ✎
                      </button>
                    )}
                    {isAdmin && onDeleteVacation && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteVacation(vacation.id)
                        }}
                        className="text-red-500 hover:text-red-700 text-xs"
                        title="Elimina ferie"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {vacationsOnDay.length > 2 && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  +{vacationsOnDay.length - 2}
                </Badge>
              )}
            </div>
          )}

          {isSelected && (
            <div className="absolute top-1 right-1">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            </div>
          )}
        </div>,
      )
    }

    return days
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendario Ferie
              {isSelecting && (
                <Badge variant="outline" className="ml-2">
                  Modalità Selezione
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-[150px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Controlli di selezione */}
          {isLoggedIn && currentUser && (
            <div className="flex items-center gap-2 pt-2">
              {!isSelecting ? (
                <Button onClick={startSelection} size="sm" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Seleziona Ferie dal Calendario
                </Button>
              ) : (
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-center gap-2">
                    <Button onClick={confirmSelection} size="sm" disabled={selectedDates.length === 0}>
                      <Check className="h-4 w-4 mr-2" />
                      Conferma ({selectedDates.length} giorni)
                    </Button>
                    <Button onClick={cancelSelection} size="sm" variant="outline">
                      <X className="h-4 w-4 mr-2" />
                      Annulla
                    </Button>
                  </div>

                  {/* Mostra i range selezionati */}
                  {selectedDates.length > 0 && (
                    <div className="text-xs text-gray-600">
                      <strong>Periodi selezionati:</strong>
                      {getConsecutiveRanges(selectedDates).map((range, index) => (
                        <span key={index} className="ml-2">
                          {new Date(range.start).toLocaleDateString("it-IT")}
                          {range.start !== range.end && ` - ${new Date(range.end).toLocaleDateString("it-IT")}`}(
                          {range.count} {range.count === 1 ? "giorno" : "giorni"})
                          {index < getConsecutiveRanges(selectedDates).length - 1 && ","}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Legenda */}
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
              <span>Giorni selezionati</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-100 rounded"></div>
              <span>Giorni passati</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-50 border border-red-200 rounded"></div>
              <span>Giorni occupati</span>
            </div>
            {currentUser && (
              <div className="flex items-center gap-1">
                <Badge variant="default" className="text-xs px-1 py-0">
                  Le tue ferie
                </Badge>
              </div>
            )}
            {isAdmin && (
              <div className="flex items-center gap-1">
                <span className="text-blue-600">✎</span>
                <span>Modifica</span>
                <span className="text-red-600 ml-2">×</span>
                <span>Elimina</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-7 gap-0 mb-4">
            {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day) => (
              <div
                key={day}
                className="h-10 flex items-center justify-center font-medium bg-gray-50 border border-gray-200"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0">{renderCalendarDays()}</div>
        </CardContent>
      </Card>

      {/* Dialog per inserire la descrizione */}
      <VacationDescriptionDialog
        isOpen={showDescriptionDialog}
        onClose={() => setShowDescriptionDialog(false)}
        onConfirm={handleBookingConfirm}
        selectedDates={selectedDates}
        isLoading={isBooking}
      />

      {/* Dialog per modificare le ferie */}
      <EditVacationDialog
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false)
          setEditingVacation(null)
        }}
        onSave={handleEditConfirm}
        vacation={editingVacation}
        isLoading={isEditing}
      />
    </>
  )
}
