"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { VacationBooking } from "@/types/database"
import { ChevronLeft, ChevronRight, Calendar, Check, X, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { VacationDescriptionDialog } from "./vacation-description-dialog"
import { EditVacationDialog } from "./edit-vacation-dialog"
import { useIsMobile } from "@/hooks/use-mobile"

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
  const isMobile = useIsMobile()

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

    // Gli admin possono selezionare qualsiasi giorno (tranne quelli passati)
    // Gli utenti normali non possono selezionare giorni con ferie di altri
    if (vacationsOnDay.length > 0 && !isAdmin && !vacationsOnDay.some((v) => v.user_id === currentUser.id)) {
      return
    }

    if (isSelecting) {
      setSelectedDates((prev) => {
        if (prev.includes(dateString)) {
          return prev.filter((d) => d !== dateString)
        } else {
          if (prev.length > 0) {
            const allDates = [...prev, dateString].sort()
            const startDate = new Date(allDates[0])
            const endDate = new Date(allDates[allDates.length - 1])

            const dateRange: string[] = []
            const currentDateIter = new Date(startDate)

            while (currentDateIter <= endDate) {
              const dateStr = currentDateIter.toISOString().split("T")[0]

              const checkDate = new Date(dateStr)
              const today = new Date()
              today.setHours(0, 0, 0, 0)

              if (checkDate >= today) {
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

  // VISTA MOBILE - Lista delle ferie del mese
  if (isMobile) {
    const monthVacations = vacations.filter((vacation) => {
      const vacationStart = new Date(vacation.start_date)
      const vacationEnd = new Date(vacation.end_date)
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      return (
        (vacationStart >= monthStart && vacationStart <= monthEnd) ||
        (vacationEnd >= monthStart && vacationEnd <= monthEnd) ||
        (vacationStart <= monthStart && vacationEnd >= monthEnd)
      )
    })

    return (
      <>
        <Card className="w-full">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Ferie {monthNames[currentDate.getMonth()]}
                {isSelecting && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Selezione
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={previousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-center text-sm text-gray-600">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>

            {/* Controlli di selezione per mobile */}
            {isLoggedIn && currentUser && (
              <div className="flex flex-col gap-3 pt-3">
                {!isSelecting ? (
                  <Button onClick={startSelection} size="sm" variant="outline" className="w-full h-10">
                    <Calendar className="h-4 w-4 mr-2" />
                    Seleziona Ferie dal Calendario
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button
                        onClick={confirmSelection}
                        size="sm"
                        disabled={selectedDates.length === 0}
                        className="flex-1 h-10"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Conferma ({selectedDates.length})
                      </Button>
                      <Button onClick={cancelSelection} size="sm" variant="outline" className="flex-1 h-10">
                        <X className="h-4 w-4 mr-2" />
                        Annulla
                      </Button>
                    </div>

                    {selectedDates.length > 0 && (
                      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                        <strong>Periodi selezionati:</strong>
                        <div className="mt-1">
                          {getConsecutiveRanges(selectedDates).map((range, index) => (
                            <div key={index} className="text-sm">
                              {new Date(range.start).toLocaleDateString("it-IT")}
                              {range.start !== range.end && ` - ${new Date(range.end).toLocaleDateString("it-IT")}`} (
                              {range.count} {range.count === 1 ? "giorno" : "giorni"})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Lista ferie del mese */}
            {monthVacations.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">Nessuna ferie in {monthNames[currentDate.getMonth()]}</p>
                <p className="text-sm">Seleziona le date per prenotare le tue ferie</p>
              </div>
            ) : (
              monthVacations.map((vacation) => (
                <div key={vacation.id} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold text-base">{vacation.users?.name}</span>
                      {vacation.user_id === currentUser?.id && (
                        <Badge variant="default" className="text-xs">
                          Le tue ferie
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditVacation(vacation)}
                          className="h-8 w-8 p-0"
                        >
                          ✎
                        </Button>
                      )}
                      {isAdmin && onDeleteVacation && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteVacation(vacation.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(vacation.start_date).toLocaleDateString("it-IT")} -{" "}
                        {new Date(vacation.end_date).toLocaleDateString("it-IT")}
                      </span>
                    </div>

                    <div className="text-sm text-gray-500">
                      {Math.ceil(
                        (new Date(vacation.end_date).getTime() - new Date(vacation.start_date).getTime()) /
                          (1000 * 60 * 60 * 24),
                      ) + 1}{" "}
                      giorni
                    </div>

                    {vacation.notes && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded italic">
                        <strong>Descrizione:</strong> {vacation.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Calendario semplificato per selezione su mobile */}
            {isSelecting && (
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-medium mb-3 text-center">Tocca i giorni per selezionare</h3>
                <div className="grid grid-cols-7 gap-1">
                  {["L", "M", "M", "G", "V", "S", "D"].map((day) => (
                    <div key={day} className="text-center text-xs font-medium p-2 text-gray-600">
                      {day}
                    </div>
                  ))}

                  {/* Giorni vuoti all'inizio */}
                  {Array.from({ length: adjustedFirstDay }, (_, i) => (
                    <div key={`empty-${i}`} className="h-10"></div>
                  ))}

                  {/* Giorni del mese */}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1
                    const vacationsOnDay = isDateInVacation(day)
                    const isSelected = isDateSelected(day)
                    const isPast = isDateInPast(day)
                    const hasOtherVacations = vacationsOnDay.some((v) => v.user_id !== currentUser?.id)

                    return (
                      <button
                        key={day}
                        onClick={() => handleDateClick(day)}
                        disabled={
                          isPast ||
                          (hasOtherVacations && !vacationsOnDay.some((v) => v.user_id === currentUser?.id) && !isAdmin)
                        }
                        className={cn("h-10 text-sm font-medium rounded transition-colors", {
                          "bg-blue-500 text-white": isSelected,
                          "bg-gray-200 text-gray-400 cursor-not-allowed": isPast,
                          "bg-red-100 text-red-600 cursor-not-allowed":
                            hasOtherVacations && !vacationsOnDay.some((v) => v.user_id === currentUser?.id) && !isAdmin,
                          "bg-white border hover:bg-blue-50": !isSelected && !isPast && (!hasOtherVacations || isAdmin),
                          "bg-green-100 border-green-300":
                            vacationsOnDay.some((v) => v.user_id === currentUser?.id) && !isSelected,
                        })}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <VacationDescriptionDialog
          isOpen={showDescriptionDialog}
          onClose={() => setShowDescriptionDialog(false)}
          onConfirm={handleBookingConfirm}
          selectedDates={selectedDates}
          isLoading={isBooking}
        />

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

  // VISTA DESKTOP - Calendario originale (mantenuto per desktop)
  const renderCalendarDays = () => {
    const days = []

    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-20 md:h-24"></div>)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const vacationsOnDay = isDateInVacation(day)
      const isSelected = isDateSelected(day)
      const isPast = isDateInPast(day)
      const hasOtherVacations = vacationsOnDay.some((v) => v.user_id !== currentUser?.id)
      const hasMyVacations = vacationsOnDay.some((v) => v.user_id === currentUser?.id)

      days.push(
        <div
          key={day}
          className={cn("h-20 md:h-24 border border-gray-200 p-1 md:p-2 relative cursor-pointer transition-colors", {
            "bg-blue-100 border-blue-300": isSelected,
            "bg-gray-100 cursor-not-allowed": isPast,
            "bg-red-50 cursor-not-allowed": hasOtherVacations && !hasMyVacations && !isAdmin, // Admin può cliccare
            "hover:bg-gray-50": isLoggedIn && !isPast && (!hasOtherVacations || isAdmin) && !isSelected,
            "hover:bg-blue-50": isLoggedIn && !isPast && (!hasOtherVacations || isAdmin) && isSelecting,
          })}
          onClick={() => handleDateClick(day)}
        >
          <div
            className={cn("font-medium text-sm md:text-base", {
              "text-gray-400": isPast,
              "text-blue-600": isSelected,
            })}
          >
            {day}
          </div>

          {vacationsOnDay.length > 0 && (
            <div className="mt-1 space-y-1">
              {vacationsOnDay.slice(0, 2).map((vacation, index) => (
                <div key={vacation.id} className="flex items-center justify-between gap-1">
                  <Badge
                    variant={vacation.user_id === currentUser?.id ? "default" : "secondary"}
                    className="text-xs px-1 py-0 flex-1 truncate min-w-0"
                    title={`${vacation.users?.name}: ${vacation.notes || "Ferie"}`}
                  >
                    <span className="truncate">{vacation.users?.name}</span>
                  </Badge>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditVacation(vacation)
                        }}
                        className="text-blue-500 hover:text-blue-700 text-sm md:text-base p-1 hover:bg-blue-100 rounded"
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
                        className="text-red-500 hover:text-red-700 text-sm md:text-base p-1 hover:bg-red-100 rounded"
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
              <div className="w-3 h-3 md:w-4 md:h-4 bg-blue-600 rounded-full"></div>
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
        <CardHeader className="pb-4 md:pb-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Calendar className="h-5 w-5 md:h-6 md:w-6" />
                Calendario Ferie
                {isSelecting && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Modalità Selezione
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={previousMonth} className="h-9 md:h-8">
                  <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
                <span className="font-medium text-sm md:text-base min-w-[140px] md:min-w-[180px] text-center">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </span>
                <Button variant="outline" size="sm" onClick={nextMonth} className="h-9 md:h-8">
                  <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </div>
            </div>

            {/* Controlli di selezione - Desktop */}
            {isLoggedIn && currentUser && (
              <div className="flex flex-col gap-3">
                {!isSelecting ? (
                  <Button onClick={startSelection} size="sm" variant="outline" className="w-full sm:w-auto h-10 md:h-9">
                    <Calendar className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                    Seleziona Ferie dal Calendario
                  </Button>
                ) : (
                  <div className="flex flex-col gap-3 w-full">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <Button
                        onClick={confirmSelection}
                        size="sm"
                        disabled={selectedDates.length === 0}
                        className="flex-1 h-10 md:h-9"
                      >
                        <Check className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                        Conferma ({selectedDates.length} giorni)
                      </Button>
                      <Button onClick={cancelSelection} size="sm" variant="outline" className="flex-1 h-10 md:h-9">
                        <X className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                        Annulla
                      </Button>
                    </div>

                    {selectedDates.length > 0 && (
                      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                        <strong>Periodi selezionati:</strong>
                        <div className="mt-1">
                          {getConsecutiveRanges(selectedDates).map((range, index) => (
                            <div key={index} className="text-sm">
                              {new Date(range.start).toLocaleDateString("it-IT")}
                              {range.start !== range.end && ` - ${new Date(range.end).toLocaleDateString("it-IT")}`} (
                              {range.count} {range.count === 1 ? "giorno" : "giorni"})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Legenda - Desktop */}
            <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 md:w-4 md:h-4 bg-blue-100 border border-blue-300 rounded"></div>
                <span>Giorni selezionati</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 md:w-4 md:h-4 bg-gray-100 rounded"></div>
                <span>Giorni passati</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 md:w-4 md:h-4 bg-red-50 border border-red-200 rounded"></div>
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
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 text-sm md:text-base">✎</span>
                  <span>Modifica</span>
                  <span className="text-red-600 text-sm md:text-base ml-2">×</span>
                  <span>Elimina</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-7 gap-0 mb-3 md:mb-4">
            {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day) => (
              <div
                key={day}
                className="h-10 md:h-12 flex items-center justify-center font-medium bg-gray-50 border border-gray-200 text-sm md:text-base"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0">{renderCalendarDays()}</div>
        </CardContent>
      </Card>

      <VacationDescriptionDialog
        isOpen={showDescriptionDialog}
        onClose={() => setShowDescriptionDialog(false)}
        onConfirm={handleBookingConfirm}
        selectedDates={selectedDates}
        isLoading={isBooking}
      />

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
