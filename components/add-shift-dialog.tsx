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
import { addShift } from "../firebase/firestore"
import { getAllUsers } from "../firebase/firestore"

interface AddShiftDialogProps {
  open: boolean
  onClose: () => void
  onShiftAdded: () => void
}

const AddShiftDialog: React.FC<AddShiftDialogProps> = ({ open, onClose, onShiftAdded }) => {
  const { currentUser } = useAuth()
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [selectedUserId, setSelectedUserId] = useState(
    currentUser.role === "admin" || currentUser.role === "moderator" ? "" : currentUser.id,
  )
  const [users, setUsers] = useState([])
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await getAllUsers()
        setUsers(usersData)
      } catch (error) {
        console.error("Error fetching users:", error)
      }
    }

    fetchUsers()
  }, [])

  const handleStartTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStartTime(event.target.value)
  }

  const handleEndTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEndTime(event.target.value)
  }

  const handleUserChange = (event: any) => {
    setSelectedUserId(event.target.value)
  }

  const validateShift = () => {
    if (!startTime || !endTime) {
      setError("Please enter both start and end times.")
      return false
    }

    if (!selectedUserId) {
      setError("Please select a user.")
      return false
    }

    if (new Date(`2000-01-01T${endTime}`) <= new Date(`2000-01-01T${startTime}`)) {
      setError("End time must be after start time.")
      return false
    }

    if (currentUser.role !== "admin" && currentUser.role !== "moderator" && selectedUserId !== currentUser.id) {
      setError("You can only create shifts for yourself.")
      return false
    }

    setError("")
    return true
  }

  const handleSubmit = async () => {
    if (validateShift()) {
      try {
        await addShift(selectedUserId, startTime, endTime)
        onShiftAdded()
        onClose()
      } catch (err) {
        console.error("Error adding shift:", err)
        setError("Failed to add shift. Please try again.")
      }
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add Shift</DialogTitle>
      <DialogContent>
        {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}
        <TextField
          label="Start Time"
          type="time"
          fullWidth
          margin="normal"
          value={startTime}
          onChange={handleStartTimeChange}
          InputLabelProps={{
            shrink: true,
          }}
        />
        <TextField
          label="End Time"
          type="time"
          fullWidth
          margin="normal"
          value={endTime}
          onChange={handleEndTimeChange}
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
              label="User"
              onChange={handleUserChange}
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
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Add Shift
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddShiftDialog
