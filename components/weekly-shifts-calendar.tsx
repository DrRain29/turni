"use client"

import type React from "react"
import { useState } from "react"
import { format, startOfWeek, addDays, isSameDay, isBefore } from "date-fns"

interface User {
  id: string
  name: string
  role?: string
}

interface Shift {
  id: string
  userId: string
  date: Date
}

interface WeeklyShiftsCalendarProps {
  shifts: Shift[]
  users: User[]
  currentUser: User | null
  onShiftAdd: (date: Date) => void
  onShiftRemove: (shiftId: string) => void
}

const WeeklyShiftsCalendar: React.FC<WeeklyShiftsCalendarProps> = ({
  shifts,
  users,
  currentUser,
  onShiftAdd,
  onShiftRemove,
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 })) // Start week on Monday

  const goToPreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7))
  }

  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7))
  }

  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i))

  const getShiftsForDate = (date: Date) => {
    return shifts.filter((shift) => isSameDay(new Date(shift.date), date))
  }

  const getUserById = (userId: string) => {
    return users.find((user) => user.id === userId)
  }

  const canInteractWithPastDays = currentUser?.role === "admin" || currentUser?.role === "moderator"

  const isPastDay = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Normalize today's date
    return isBefore(date, today)
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
        <button onClick={goToPreviousWeek}>Previous Week</button>
        <span>{format(currentWeekStart, "MMMM yyyy")}</span>
        <button onClick={goToNextWeek}>Next Week</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "5px" }}>
        {weekDays.map((day) => (
          <div key={day.toISOString()} style={{ border: "1px solid #ccc", padding: "10px" }}>
            <p>{format(day, "EEE dd")}</p>
            <ul>
              {getShiftsForDate(day).map((shift) => {
                const user = getUserById(shift.userId)
                return (
                  <li key={shift.id}>
                    {user?.name}
                    {currentUser?.role === "admin" && <button onClick={() => onShiftRemove(shift.id)}>Remove</button>}
                  </li>
                )
              })}
            </ul>
            {currentUser && (canInteractWithPastDays || !isPastDay(day)) && (
              <button onClick={() => onShiftAdd(day)}>
                {currentUser?.role === "admin" || currentUser?.role === "moderator" ? "Aggiungi" : "Mio Turno"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default WeeklyShiftsCalendar
