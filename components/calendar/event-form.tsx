"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useCalendar } from "@/lib/calendar-context"
import { Event, Calendar as CalendarType } from "@/lib/api-client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { CalendarIcon, Loader2 } from "lucide-react"

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  date: z.date(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  allDay: z.boolean().default(false),
  calendarId: z.string(),
  color: z.string().optional(),
})

type EventFormValues = z.infer<typeof eventSchema>

interface EventFormProps {
  event?: Event
  onClose: () => void
  defaultDate?: Date
}

export default function EventForm({ event, onClose, defaultDate = new Date() }: EventFormProps) {
  const { calendars, createEvent, updateEvent } = useCalendar()
  const [submitting, setSubmitting] = useState(false)
  
  const isEditing = !!event
  
  const defaultValues: Partial<EventFormValues> = isEditing
    ? {
        title: event.title,
        description: event.description || "",
        location: event.location || "",
        date: new Date(event.startTime),
        startTime: format(new Date(event.startTime), "HH:mm"),
        endTime: format(new Date(event.endTime), "HH:mm"),
        allDay: event.allDay,
        calendarId: event.calendarId,
        color: event.color || "",
      }
    : {
        title: "",
        description: "",
        location: "",
        date: defaultDate,
        startTime: "09:00",
        endTime: "10:00",
        allDay: false,
        calendarId: calendars[0]?.id || "",
        color: "",
      }

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues,
  })

  async function onSubmit(data: EventFormValues) {
    setSubmitting(true)
    
    try {
      // Convert form data to API format
      const { date, startTime, endTime, ...rest } = data
      
      // Create ISO date strings
      const [startHour, startMinute] = startTime.split(":").map(Number)
      const [endHour, endMinute] = endTime.split(":").map(Number)
      
      const startDate = new Date(date)
      startDate.setHours(startHour, startMinute, 0, 0)
      
      const endDate = new Date(date)
      endDate.setHours(endHour, endMinute, 0, 0)
      
      // Ensure end time is after start time
      if (endDate <= startDate) {
        toast.error("End time must be after start time")
        return
      }
      
      const eventData = {
        ...rest,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      }
      
      if (isEditing && event) {
        await updateEvent(event.id, eventData)
        toast.success("Event updated successfully")
      } else {
        await createEvent(eventData)
        toast.success("Event created successfully")
      }
      
      onClose()
    } catch (error) {
      console.error("Error submitting event:", error)
      toast.error(isEditing ? "Failed to update event" : "Failed to create event")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl text-white">
      <h2 className="text-xl font-bold mb-6">{isEditing ? "Edit Event" : "Create Event"}</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Event title"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-300" />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal bg-white/10 border-white/20 text-white",
                            !field.value && "text-white/50"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-red-300" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="calendarId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calendar</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Select a calendar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {calendars.map((calendar: CalendarType) => (
                        <SelectItem key={calendar.id} value={calendar.id}>
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-sm mr-2 ${calendar.color}`}></div>
                            <span>{calendar.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-300" />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      className="bg-white/10 border-white/20 text-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-300" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      className="bg-white/10 border-white/20 text-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-300" />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Location (optional)"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage className="text-red-300" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Description (optional)"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[100px]"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage className="text-red-300" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="allDay"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/20 p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>All Day</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={submitting}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : isEditing ? "Update Event" : "Create Event"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
} 