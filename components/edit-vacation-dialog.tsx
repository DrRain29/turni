"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

interface EditVacationDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  vacation: Vacation | null
  onVacationUpdated: (vacation: Vacation) => void
  onVacationDeleted: (id: number) => void
  currentUser: User | null
}

const formSchema = z.object({
  start_date: z.date(),
  end_date: z.date(),
  reason: z.string().min(2, {
    message: "Reason must be at least 2 characters.",
  }),
  status: z.enum(["pending", "approved", "rejected"]),
})

export function EditVacationDialog({
  open,
  setOpen,
  vacation,
  onVacationUpdated,
  onVacationDeleted,
  currentUser,
}: EditVacationDialogProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start_date: vacation?.start_date ? new Date(vacation.start_date) : new Date(),
      end_date: vacation?.end_date ? new Date(vacation.end_date) : new Date(),
      reason: vacation?.reason || "",
      status: vacation?.status || "pending",
    },
    mode: "onChange",
  })

  useEffect(() => {
    if (vacation) {
      form.reset({
        start_date: vacation?.start_date ? new Date(vacation.start_date) : new Date(),
        end_date: vacation?.end_date ? new Date(vacation.end_date) : new Date(),
        reason: vacation?.reason || "",
        status: vacation?.status || "pending",
      })
    }
  }, [vacation, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!vacation) return

    const updatedVacation = {
      ...vacation,
      start_date: values.start_date.toISOString(),
      end_date: values.end_date.toISOString(),
      reason: values.reason,
      status: values.status,
    }

    try {
      const response = await fetch(`/api/vacations/${vacation.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedVacation),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Vacation updated successfully.",
        })
        onVacationUpdated(updatedVacation)
        setOpen(false)
      } else {
        toast({
          title: "Error",
          description: "Failed to update vacation.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update vacation.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteVacation = async () => {
    if (!vacation) return

    try {
      const response = await fetch(`/api/vacations/${vacation.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Vacation deleted successfully.",
        })
        onVacationDeleted(vacation.id)
        setOpen(false)
      } else {
        toast({
          title: "Error",
          description: "Failed to delete vacation.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete vacation.",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{/* <Button variant="outline">Edit</Button> */}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Vacation</AlertDialogTitle>
          {vacation && currentUser?.role === "admin" && vacation.user_id !== currentUser.id && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Attenzione:</strong> Stai modificando le ferie di <strong>{vacation.users?.name}</strong>
              </p>
            </div>
          )}
          <AlertDialogDescription>Make changes to your vacation request here.</AlertDialogDescription>
        </AlertDialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>The date your vacation will start.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>The date your vacation will end.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Why are you requesting this vacation?" className="resize-none" {...field} />
                  </FormControl>
                  <FormDescription>Please provide a reason for your vacation request.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {currentUser?.role === "admin" && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Set the status of this vacation request.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              {currentUser?.role === "admin" && (
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" type="button">
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this vacation request from our
                        servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteVacation}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button type="submit">Save changes</Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
