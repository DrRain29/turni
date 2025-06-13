"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material"
import { useAuth } from "../contexts/AuthContext"
import type { Shift } from "../types/Shift"
import type { User } from "../types/User"

interface EditShiftDialogProps {
  open: boolean
  onClose: () => void
  shift: Shift
  onSave: (shift: Shift) => void
  users: User[]
}

const EditShiftDialog: React.FC<EditShiftDialogProps> = ({ open, onClose, shift, onSave, users }) => {
  const { currentUser } = useAuth()
  const [startTime, setStartTime] = useState<string>(shift.start_time)
  const [endTime, setEndTime] = useState<string>(shift.end_time)
  const [selectedUserId, setSelectedUserId] = useState<string>(shift.user_id)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    setStartTime(shift.start_time)
    setEndTime(shift.end_time)
    setSelectedUserId(currentUser.role === "admin" || currentUser.role === "moderator" ? shift.user_id : currentUser.id)
  }, [shift, currentUser])

  const handleStartTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStartTime(event.target.value)
  }

  const handleEndTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEndTime(event.target.value)
  }

  const handleUserChange = (event: React.ChangeEvent<{ value: string }>) => {
    setSelectedUserId(event.target.value)
  }

  const validateShift = () => {
    if (!startTime || !endTime) {
      setError("Start and end times are required.")
      return false
    }

    if (new Date(`2000-01-01T${endTime}`) <= new Date(`2000-01-01T${startTime}`)) {
      setError("End time must be after start time.")
      return false
    }

    if (!selectedUserId) {
      setError("A user must be selected.")
      return false
    }

    if (currentUser.role !== "admin" && currentUser.role !== "moderator" && selectedUserId !== currentUser.id) {
      setError("You can only edit your own shifts.")
      return false
    }

    setError("")
    return true
  }

  const handleSave = () => {
    if (validateShift()) {
      const updatedShift: Shift = {
        ...shift,
        start_time: startTime,
        end_time: endTime,
        user_id: selectedUserId,
      }
      onSave(updatedShift)
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Edit Shift</DialogTitle>
      <DialogContent>
        {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}
        <TextField
          label="Start Time"
          type="time"
          value={startTime}
          onChange={handleStartTimeChange}
          fullWidth
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
        <TextField
          label="End Time"
          type="time"
          value={endTime}
          onChange={handleEndTimeChange}
          fullWidth
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
        {(currentUser.role === "admin" || currentUser.role === "moderator") && (
          <FormControl fullWidth margin="normal">
            <InputLabel id="user-select-label">User</InputLabel>
            <Select
              labelId="user-select-label"
              id="user-select"
              value={selectedUserId}
              onChange={handleUserChange}
              label="User"
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EditShiftDialog
