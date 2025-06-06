import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './auth-context'
import apiClient, { Calendar, Event } from './api-client'
import { startOfWeek, endOfWeek, format, parseISO, addDays, addWeeks, subWeeks } from 'date-fns'

type CalendarContextType = {
  calendars: Calendar[]
  events: Event[]
  loading: boolean
  error: string | null
  currentDate: Date
  viewType: 'day' | 'week' | 'month'
  setViewType: (type: 'day' | 'week' | 'month') => void
  refreshEvents: () => Promise<void>
  refreshCalendars: () => Promise<void>
  createEvent: (eventData: any) => Promise<Event>
  updateEvent: (id: string, eventData: any) => Promise<Event>
  deleteEvent: (id: string) => Promise<void>
  createCalendar: (calendarData: any) => Promise<Calendar>
  updateCalendar: (id: string, calendarData: any) => Promise<Calendar>
  deleteCalendar: (id: string) => Promise<void>
  nextPeriod: () => void
  prevPeriod: () => void
  today: () => void
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined)

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('week')

  // Load calendars when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshCalendars()
    }
  }, [isAuthenticated])

  // Load events when authenticated, calendars change, or date/view changes
  useEffect(() => {
    if (isAuthenticated && calendars.length > 0) {
      refreshEvents()
    }
  }, [isAuthenticated, calendars, currentDate, viewType])

  const getDateRange = () => {
    if (viewType === 'day') {
      const start = new Date(currentDate)
      start.setHours(0, 0, 0, 0)
      
      const end = new Date(currentDate)
      end.setHours(23, 59, 59, 999)
      
      return { start, end }
    } else if (viewType === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 })
      const end = endOfWeek(currentDate, { weekStartsOn: 0 })
      return { start, end }
    } else {
      // Month view - simplified for now
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      return { start, end }
    }
  }

  const refreshEvents = async () => {
    if (!isAuthenticated) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { start, end } = getDateRange()
      
      const calendarIds = calendars.map(cal => cal.id)
      
      const fetchedEvents = await apiClient.events.getEvents({
        start: format(start, "yyyy-MM-dd'T'HH:mm:ss"),
        end: format(end, "yyyy-MM-dd'T'HH:mm:ss"),
        calendarId: calendarIds
      })
      
      setEvents(fetchedEvents)
    } catch (err) {
      console.error('Error fetching events:', err)
      setError('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const refreshCalendars = async () => {
    if (!isAuthenticated) return
    
    setLoading(true)
    setError(null)
    
    try {
      const fetchedCalendars = await apiClient.calendars.getCalendars()
      setCalendars(fetchedCalendars)
    } catch (err) {
      console.error('Error fetching calendars:', err)
      setError('Failed to load calendars')
    } finally {
      setLoading(false)
    }
  }

  const createEvent = async (eventData: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const newEvent = await apiClient.events.createEvent(eventData)
      await refreshEvents()
      return newEvent
    } catch (err) {
      console.error('Error creating event:', err)
      setError('Failed to create event')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateEvent = async (id: string, eventData: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const updatedEvent = await apiClient.events.updateEvent(id, eventData)
      await refreshEvents()
      return updatedEvent
    } catch (err) {
      console.error('Error updating event:', err)
      setError('Failed to update event')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteEvent = async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      await apiClient.events.deleteEvent(id)
      await refreshEvents()
    } catch (err) {
      console.error('Error deleting event:', err)
      setError('Failed to delete event')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const createCalendar = async (calendarData: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const newCalendar = await apiClient.calendars.createCalendar(calendarData)
      await refreshCalendars()
      return newCalendar
    } catch (err) {
      console.error('Error creating calendar:', err)
      setError('Failed to create calendar')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateCalendar = async (id: string, calendarData: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const updatedCalendar = await apiClient.calendars.updateCalendar(id, calendarData)
      await refreshCalendars()
      return updatedCalendar
    } catch (err) {
      console.error('Error updating calendar:', err)
      setError('Failed to update calendar')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteCalendar = async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      await apiClient.calendars.deleteCalendar(id)
      await refreshCalendars()
    } catch (err) {
      console.error('Error deleting calendar:', err)
      setError('Failed to delete calendar')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const nextPeriod = () => {
    if (viewType === 'day') {
      setCurrentDate(prev => addDays(prev, 1))
    } else if (viewType === 'week') {
      setCurrentDate(prev => addWeeks(prev, 1))
    } else {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
    }
  }

  const prevPeriod = () => {
    if (viewType === 'day') {
      setCurrentDate(prev => addDays(prev, -1))
    } else if (viewType === 'week') {
      setCurrentDate(prev => subWeeks(prev, 1))
    } else {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
    }
  }

  const today = () => {
    setCurrentDate(new Date())
  }

  return (
    <CalendarContext.Provider
      value={{
        calendars,
        events,
        loading,
        error,
        currentDate,
        viewType,
        setViewType,
        refreshEvents,
        refreshCalendars,
        createEvent,
        updateEvent,
        deleteEvent,
        createCalendar,
        updateCalendar,
        deleteCalendar,
        nextPeriod,
        prevPeriod,
        today,
      }}
    >
      {children}
    </CalendarContext.Provider>
  )
}

export function useCalendar() {
  const context = useContext(CalendarContext)
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider')
  }
  return context
} 