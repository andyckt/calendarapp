"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Settings,
  Menu,
  Clock,
  MapPin,
  Users,
  Calendar as CalendarIcon,
  Pause,
  Sparkles,
  X,
  LogOut,
} from "lucide-react"
import { format, parseISO, startOfWeek, addDays, isToday } from "date-fns"
import { useAuth } from "@/lib/auth-context"
import { useCalendar } from "@/lib/calendar-context"
import { Event } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import EventForm from "@/components/calendar/event-form"
import { toast } from "sonner"

export default function Home() {
  const { user, logout } = useAuth()
  const { 
    calendars,
    events,
    loading,
    error,
    currentDate,
    viewType,
    setViewType,
    nextPeriod,
    prevPeriod,
    today: goToToday,
    deleteEvent
  } = useCalendar()

  const [isLoaded, setIsLoaded] = useState(false)
  const [showAIPopup, setShowAIPopup] = useState(false)
  const [typedText, setTypedText] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false)
  const [isEditEventOpen, setIsEditEventOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  useEffect(() => {
    setIsLoaded(true)

    // Show AI popup after 3 seconds
    const popupTimer = setTimeout(() => {
      setShowAIPopup(true)
    }, 3000)

    return () => clearTimeout(popupTimer)
  }, [])

  useEffect(() => {
    if (showAIPopup) {
      const text =
        "Looks like you don't have that many meetings today. Shall I play some Hans Zimmer essentials to help you get into your Flow State?"
      let i = 0
      const typingInterval = setInterval(() => {
        if (i < text.length) {
          setTypedText((prev) => prev + text.charAt(i))
          i++
        } else {
          clearInterval(typingInterval)
        }
      }, 50)

      return () => clearInterval(typingInterval)
    }
  }, [showAIPopup])

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
  }

  const handleCreateEvent = () => {
    setIsCreateEventOpen(true)
  }

  const handleEditEvent = () => {
    if (selectedEvent) {
      setIsEditEventOpen(true)
      setSelectedEvent(null)
    }
  }

  const handleDeleteEvent = async () => {
    if (selectedEvent) {
      try {
        await deleteEvent(selectedEvent.id)
        toast.success("Event deleted successfully")
        setSelectedEvent(null)
        setConfirmDeleteOpen(false)
      } catch (error) {
        toast.error("Failed to delete event")
      }
    }
  }

  // Sample calendar days for the week view
  const weekStartDate = startOfWeek(currentDate, { weekStartsOn: 0 })
  const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i))
  const timeSlots = Array.from({ length: 9 }, (_, i) => i + 8) // 8 AM to 4 PM

  // Helper function to calculate event position and height
  const calculateEventStyle = (startTime: string, endTime: string) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    
    const startHour = start.getHours() + start.getMinutes() / 60
    const endHour = end.getHours() + end.getMinutes() / 60
    
    // Adjust for events outside our time range (8am-4pm)
    const visibleStartHour = Math.max(startHour, 8)
    const visibleEndHour = Math.min(endHour, 17)
    
    const top = (visibleStartHour - 8) * 80 // 80px per hour
    const height = (visibleEndHour - visibleStartHour) * 80
    
    return { top: `${top}px`, height: `${height}px` }
  }

  // Sample calendar for mini calendar
  const currentMonth = format(currentDate, "MMMM yyyy")
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  const miniCalendarDays = Array.from({ length: daysInMonth + firstDayOfMonth }, (_, i) =>
    i < firstDayOfMonth ? null : i - firstDayOfMonth + 1,
  )

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
    // Here you would typically also control the actual audio playback
  }

  const handleLogout = () => {
    logout()
    toast.success("Logged out successfully")
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image */}
      <Image
        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop"
        alt="Beautiful mountain landscape"
        fill
        className="object-cover"
        priority
      />

      {/* Navigation */}
      <header
        className={`absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-8 py-6 opacity-0 ${isLoaded ? "animate-fade-in" : ""}`}
        style={{ animationDelay: "0.2s" }}
      >
        <div className="flex items-center gap-4">
          <Menu className="h-6 w-6 text-white" />
          <span className="text-2xl font-semibold text-white drop-shadow-lg">Calendar</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
            <input
              type="text"
              placeholder="Search"
              className="rounded-full bg-white/10 backdrop-blur-sm pl-10 pr-4 py-2 text-white placeholder:text-white/70 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
          <Settings className="h-6 w-6 text-white drop-shadow-md" />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout}
            className="text-white hover:bg-white/10"
          >
            <LogOut className="h-5 w-5" />
          </Button>
          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shadow-md">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative h-screen w-full pt-20 flex">
        {/* Sidebar */}
        <div
          className={`w-64 h-full bg-white/10 backdrop-blur-lg p-4 shadow-xl border-r border-white/20 rounded-tr-3xl opacity-0 ${isLoaded ? "animate-fade-in" : ""} flex flex-col justify-between`}
          style={{ animationDelay: "0.4s" }}
        >
          <div>
            <button 
              className="mb-6 flex items-center justify-center gap-2 rounded-full bg-blue-500 px-4 py-3 text-white w-full"
              onClick={handleCreateEvent}
            >
              <Plus className="h-5 w-5" />
              <span>Create</span>
            </button>

            {/* Mini Calendar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium">{currentMonth}</h3>
                <div className="flex gap-1">
                  <button className="p-1 rounded-full hover:bg-white/20">
                    <ChevronLeft className="h-4 w-4 text-white" />
                  </button>
                  <button className="p-1 rounded-full hover:bg-white/20">
                    <ChevronRight className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                  <div key={i} className="text-xs text-white/70 font-medium py-1">
                    {day}
                  </div>
                ))}

                {miniCalendarDays.map((day, i) => {
                  const date = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : null
                  const isCurrentDay = date ? isToday(date) : false
                  
                  return (
                    <div
                      key={i}
                      className={`text-xs rounded-full w-7 h-7 flex items-center justify-center ${
                        isCurrentDay ? "bg-blue-500 text-white" : "text-white hover:bg-white/20"
                      } ${!day ? "invisible" : ""}`}
                    >
                      {day}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* My Calendars */}
            <div>
              <h3 className="text-white font-medium mb-3">My calendars</h3>
              <div className="space-y-2">
                {calendars.map((cal) => (
                  <div key={cal.id} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-sm ${cal.color}`}></div>
                    <span className="text-white text-sm">{cal.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* New position for the big plus button */}
          <button 
            className="mt-6 flex items-center justify-center gap-2 rounded-full bg-blue-500 p-4 text-white w-14 h-14 self-start"
            onClick={handleCreateEvent}
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>

        {/* Calendar View */}
        <div
          className={`flex-1 flex flex-col opacity-0 ${isLoaded ? "animate-fade-in" : ""}`}
          style={{ animationDelay: "0.6s" }}
        >
          {/* Calendar Controls */}
          <div className="flex items-center justify-between p-4 border-b border-white/20">
            <div className="flex items-center gap-4">
              <button 
                className="px-4 py-2 text-white bg-blue-500 rounded-md"
                onClick={goToToday}
              >
                Today
              </button>
              <div className="flex">
                <button 
                  className="p-2 text-white hover:bg-white/10 rounded-l-md"
                  onClick={prevPeriod}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button 
                  className="p-2 text-white hover:bg-white/10 rounded-r-md"
                  onClick={nextPeriod}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <h2 className="text-xl font-semibold text-white">
                {format(currentDate, "MMMM d")}
              </h2>
            </div>

            <div className="flex items-center gap-2 rounded-md p-1">
              <button
                onClick={() => setViewType("day")}
                className={`px-3 py-1 rounded ${viewType === "day" ? "bg-white/20" : ""} text-white text-sm`}
              >
                Day
              </button>
              <button
                onClick={() => setViewType("week")}
                className={`px-3 py-1 rounded ${viewType === "week" ? "bg-white/20" : ""} text-white text-sm`}
              >
                Week
              </button>
              <button
                onClick={() => setViewType("month")}
                className={`px-3 py-1 rounded ${viewType === "month" ? "bg-white/20" : ""} text-white text-sm`}
              >
                Month
              </button>
            </div>
          </div>

          {/* Week View */}
          <div className="flex-1 overflow-auto p-4">
            <div className="bg-white/20 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl h-full">
              {/* Week Header */}
              <div className="grid grid-cols-8 border-b border-white/20">
                <div className="p-2 text-center text-white/50 text-xs"></div>
                {weekDays.map((day, i) => {
                  const date = weekDates[i]
                  const isCurrentDay = isToday(date)
                  
                  return (
                    <div key={i} className="p-2 text-center border-l border-white/20">
                      <div className="text-xs text-white/70 font-medium">{day}</div>
                      <div
                        className={`text-lg font-medium mt-1 text-white ${isCurrentDay ? "bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center mx-auto" : ""}`}
                      >
                        {format(date, "d")}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Time Grid */}
              <div className="grid grid-cols-8">
                {/* Time Labels */}
                <div className="text-white/70">
                  {timeSlots.map((time, i) => (
                    <div key={i} className="h-20 border-b border-white/10 pr-2 text-right text-xs">
                      {time > 12 ? `${time - 12} PM` : `${time} AM`}
                    </div>
                  ))}
                </div>

                {/* Days Columns */}
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const currentDayDate = weekDates[dayIndex]
                  
                  return (
                    <div key={dayIndex} className="border-l border-white/20 relative">
                      {timeSlots.map((_, timeIndex) => (
                        <div key={timeIndex} className="h-20 border-b border-white/10"></div>
                      ))}

                      {/* Events */}
                      {events
                        .filter(event => {
                          const eventDate = new Date(event.startTime)
                          return eventDate.getDate() === currentDayDate.getDate() &&
                                eventDate.getMonth() === currentDayDate.getMonth() &&
                                eventDate.getFullYear() === currentDayDate.getFullYear()
                        })
                        .map((event, i) => {
                          const eventStyle = calculateEventStyle(event.startTime, event.endTime)
                          return (
                            <div
                              key={i}
                              className={`absolute ${event.color || 'bg-blue-500'} rounded-md p-2 text-white text-xs shadow-md cursor-pointer transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:shadow-lg`}
                              style={{
                                ...eventStyle,
                                left: "4px",
                                right: "4px",
                              }}
                              onClick={() => handleEventClick(event)}
                            >
                              <div className="font-medium">{event.title}</div>
                              <div className="opacity-80 text-[10px] mt-1">
                                {`${format(new Date(event.startTime), "h:mm a")} - ${format(new Date(event.endTime), "h:mm a")}`}
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* AI Popup */}
        {showAIPopup && (
          <div className="fixed bottom-8 right-8 z-20">
            <div className="w-[450px] relative bg-gradient-to-br from-blue-400/30 via-blue-500/30 to-blue-600/30 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-blue-300/30 text-white">
              <button
                onClick={() => setShowAIPopup(false)}
                className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-blue-300" />
                </div>
                <div className="min-h-[80px]">
                  <p className="text-base font-light">{typedText}</p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={togglePlay}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors font-medium"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowAIPopup(false)}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors font-medium"
                >
                  No
                </button>
              </div>
              {isPlaying && (
                <div className="mt-4 flex items-center justify-between">
                  <button
                    className="flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-white text-sm hover:bg-white/20 transition-colors"
                    onClick={togglePlay}
                  >
                    <Pause className="h-4 w-4" />
                    <span>Pause Hans Zimmer</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${selectedEvent.color || 'bg-blue-500'} p-6 rounded-lg shadow-xl max-w-md w-full mx-4`}>
              <h3 className="text-2xl font-bold mb-4 text-white">{selectedEvent.title}</h3>
              <div className="space-y-3 text-white">
                <p className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  {`${format(new Date(selectedEvent.startTime), "h:mm a")} - ${format(new Date(selectedEvent.endTime), "h:mm a")}`}
                </p>
                {selectedEvent.location && (
                  <p className="flex items-center">
                    <MapPin className="mr-2 h-5 w-5" />
                    {selectedEvent.location}
                  </p>
                )}
                <p className="flex items-center">
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {format(new Date(selectedEvent.startTime), "EEEE, MMMM d, yyyy")}
                </p>
                {selectedEvent.attendees?.length > 0 && (
                  <p className="flex items-start">
                    <Users className="mr-2 h-5 w-5 mt-1" />
                    <span>
                      <strong>Attendees:</strong>
                      <br />
                      {selectedEvent.attendees.map(a => a.name).join(", ")}
                    </span>
                  </p>
                )}
                {selectedEvent.description && (
                  <p>
                    <strong>Description:</strong> {selectedEvent.description}
                  </p>
                )}
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="bg-red-500/20 hover:bg-red-500/30 text-white border-red-500/30"
                >
                  Delete
                </Button>
                <Button
                  variant="outline"
                  onClick={handleEditEvent}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => setSelectedEvent(null)}
                  className="bg-white text-gray-800 hover:bg-gray-100"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Create Event Dialog */}
        <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
          <DialogContent className="max-w-md bg-transparent border-0 p-0">
            <EventForm onClose={() => setIsCreateEventOpen(false)} defaultDate={currentDate} />
          </DialogContent>
        </Dialog>

        {/* Edit Event Dialog */}
        <Dialog open={isEditEventOpen} onOpenChange={setIsEditEventOpen}>
          <DialogContent className="max-w-md bg-transparent border-0 p-0">
            {selectedEvent && (
              <EventForm 
                event={selectedEvent} 
                onClose={() => {
                  setIsEditEventOpen(false)
                  setSelectedEvent(null)
                }} 
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Confirm Delete Dialog */}
        <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
          <DialogContent className="max-w-md">
            <h2 className="text-xl font-bold mb-4">Delete Event</h2>
            <p className="mb-6">Are you sure you want to delete this event? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteEvent}>
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
