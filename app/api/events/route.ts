import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/middleware'

// Validation schema for creating an event
const createEventSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  location: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  allDay: z.boolean().default(false),
  color: z.string().optional(),
  calendarId: z.string(),
  attendeeIds: z.array(z.string()).optional(),
})

// GET /api/events - Get events for the authenticated user
export async function GET(req: NextRequest) {
  return withAuth(req, async (req, userId) => {
    try {
      const url = new URL(req.url)
      
      // Parse query parameters
      const startParam = url.searchParams.get('start')
      const endParam = url.searchParams.get('end')
      const calendarIds = url.searchParams.getAll('calendarId')
      
      // Build the query filters
      const filters: any = {
        OR: [
          { userId }, // Events owned by the user
          { attendees: { some: { id: userId } } }, // Events where user is an attendee
        ],
      }
      
      // Add date range filter if provided
      if (startParam && endParam) {
        filters.AND = [
          { startTime: { gte: new Date(startParam) } },
          { endTime: { lte: new Date(endParam) } },
        ]
      }
      
      // Add calendar filter if provided
      if (calendarIds.length > 0) {
        filters.calendarId = { in: calendarIds }
      }
      
      // Query events
      const events = await prisma.event.findMany({
        where: filters,
        include: {
          attendees: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          calendar: true,
        },
        orderBy: {
          startTime: 'asc',
        },
      })
      
      return NextResponse.json(events)
    } catch (error) {
      console.error('Get events error:', error)
      return NextResponse.json(
        { error: 'Something went wrong' },
        { status: 500 }
      )
    }
  })
}

// POST /api/events - Create a new event
export async function POST(req: NextRequest) {
  return withAuth(req, async (req, userId) => {
    try {
      // Parse and validate request body
      const body = await req.json()
      const validationResult = createEventSchema.safeParse(body)
      
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validationResult.error.issues },
          { status: 400 }
        )
      }
      
      const { 
        title, 
        description, 
        location, 
        startTime, 
        endTime, 
        allDay, 
        color, 
        calendarId,
        attendeeIds = []
      } = validationResult.data
      
      // Check if the calendar exists and belongs to the user
      const calendar = await prisma.calendar.findUnique({
        where: {
          id: calendarId,
          userId,
        },
      })
      
      if (!calendar) {
        return NextResponse.json(
          { error: 'Calendar not found or not owned by you' },
          { status: 404 }
        )
      }
      
      // Create the event
      const event = await prisma.event.create({
        data: {
          title,
          description,
          location,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          allDay,
          color: color || calendar.color,
          calendarId,
          userId,
          attendees: {
            connect: attendeeIds.map(id => ({ id })),
          },
        },
        include: {
          attendees: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          calendar: true,
        },
      })
      
      return NextResponse.json(event, { status: 201 })
    } catch (error) {
      console.error('Create event error:', error)
      return NextResponse.json(
        { error: 'Something went wrong' },
        { status: 500 }
      )
    }
  })
} 