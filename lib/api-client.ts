// API client for interacting with the backend

// Base API URL
const API_BASE_URL = '/api'

// Types
export interface User {
  id: string
  name: string | null
  email: string
}

export interface Calendar {
  id: string
  name: string
  color: string
  description: string | null
  isDefault: boolean
  userId: string
  createdAt: string
  updatedAt: string
}

export interface Event {
  id: string
  title: string
  description: string | null
  location: string | null
  startTime: string
  endTime: string
  allDay: boolean
  color: string | null
  calendarId: string
  userId: string
  createdAt: string
  updatedAt: string
  attendees: User[]
  calendar: Calendar
}

export interface AuthResponse {
  user: User
  token: string
}

// Helper for making authenticated requests
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token')
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Something went wrong')
  }
  
  return response.json()
}

// Auth APIs
export const authApi = {
  register: async (data: { name: string; email: string; password: string }): Promise<AuthResponse> => {
    return fetchWithAuth<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  
  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    return fetchWithAuth<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

// Calendar APIs
export const calendarApi = {
  getCalendars: async (): Promise<Calendar[]> => {
    return fetchWithAuth<Calendar[]>('/calendars')
  },
  
  getCalendar: async (id: string): Promise<Calendar> => {
    return fetchWithAuth<Calendar>(`/calendars/${id}`)
  },
  
  createCalendar: async (data: { 
    name: string
    color?: string
    description?: string
    isDefault?: boolean
  }): Promise<Calendar> => {
    return fetchWithAuth<Calendar>('/calendars', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  
  updateCalendar: async (id: string, data: {
    name?: string
    color?: string
    description?: string | null
    isDefault?: boolean
  }): Promise<Calendar> => {
    return fetchWithAuth<Calendar>(`/calendars/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },
  
  deleteCalendar: async (id: string): Promise<{ success: boolean }> => {
    return fetchWithAuth<{ success: boolean }>(`/calendars/${id}`, {
      method: 'DELETE',
    })
  },
}

// Event APIs
export const eventApi = {
  getEvents: async (params?: {
    start?: string
    end?: string
    calendarId?: string | string[]
  }): Promise<Event[]> => {
    const searchParams = new URLSearchParams()
    
    if (params?.start) searchParams.append('start', params.start)
    if (params?.end) searchParams.append('end', params.end)
    
    if (params?.calendarId) {
      const calendarIds = Array.isArray(params.calendarId) 
        ? params.calendarId 
        : [params.calendarId]
      
      calendarIds.forEach(id => searchParams.append('calendarId', id))
    }
    
    const queryString = searchParams.toString()
    const endpoint = queryString ? `/events?${queryString}` : '/events'
    
    return fetchWithAuth<Event[]>(endpoint)
  },
  
  getEvent: async (id: string): Promise<Event> => {
    return fetchWithAuth<Event>(`/events/${id}`)
  },
  
  createEvent: async (data: {
    title: string
    description?: string
    location?: string
    startTime: string
    endTime: string
    allDay?: boolean
    color?: string
    calendarId: string
    attendeeIds?: string[]
  }): Promise<Event> => {
    return fetchWithAuth<Event>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  
  updateEvent: async (id: string, data: {
    title?: string
    description?: string | null
    location?: string | null
    startTime?: string
    endTime?: string
    allDay?: boolean
    color?: string
    calendarId?: string
    attendeeIds?: string[]
  }): Promise<Event> => {
    return fetchWithAuth<Event>(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },
  
  deleteEvent: async (id: string): Promise<{ success: boolean }> => {
    return fetchWithAuth<{ success: boolean }>(`/events/${id}`, {
      method: 'DELETE',
    })
  },
}

// Export a default client with all APIs
const apiClient = {
  auth: authApi,
  calendars: calendarApi,
  events: eventApi,
}

export default apiClient 