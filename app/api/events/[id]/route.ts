import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/middleware'

// Validation schema for updating an event
const updateEventSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  allDay: z.boolean().optional(),
  color: z.string().optional(),
  calendarId: z.string().optional(),
  attendeeIds: z.array(z.string()).optional(),
})

// GET /api/events/[id] - Get a specific event
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (_, userId) => {
    const { id } = params

    const event = await prisma.event.findUnique({
      where: {
        id,
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

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Check if the user has permission to view this event
    const hasPermission = event.userId === userId || 
                        event.attendees.some((attendee: { id: string }) => attendee.id === userId)
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to view this event' },
        { status: 403 }
      )
    }

    return NextResponse.json(event)
  })
}

// PATCH /api/events/[id] - Update an event
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req, userId) => {
    try {
      const { id } = params

      // Parse and validate request body
      const body = await req.json()
      const validationResult = updateEventSchema.safeParse(body)
      
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validationResult.error.issues },
          { status: 400 }
        )
      }
      
      const data = validationResult.data
      
      // Get the existing event
      const existingEvent = await prisma.event.findUnique({
        where: {
          id,
        },
        include: {
          attendees: true,
        },
      })
      
      if (!existingEvent) {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        )
      }
      
      // Only the event owner can update it
      if (existingEvent.userId !== userId) {
        return NextResponse.json(
          { error: 'You do not have permission to update this event' },
          { status: 403 }
        )
      }
      
      // If calendarId is provided, ensure it belongs to the user
      if (data.calendarId) {
        const calendar = await prisma.calendar.findUnique({
          where: {
            id: data.calendarId,
            userId,
          },
        })
        
        if (!calendar) {
          return NextResponse.json(
            { error: 'Calendar not found or not owned by you' },
            { status: 404 }
          )
        }
      }
      
      // Prepare update data
      const updateData: any = { ...data }
      
      // Convert date strings to Date objects
      if (updateData.startTime) {
        updateData.startTime = new Date(updateData.startTime)
      }
      
      if (updateData.endTime) {
        updateData.endTime = new Date(updateData.endTime)
      }
      
      // Handle attendees updates
      const { attendeeIds } = data
      if (attendeeIds) {
        delete updateData.attendeeIds
        
        // Get current attendees
        const currentAttendeeIds = existingEvent.attendees.map((a: { id: string }) => a.id)
        
        // Determine attendees to connect and disconnect
        const attendeesToConnect = attendeeIds.filter((id: string) => !currentAttendeeIds.includes(id))
        const attendeesToDisconnect = currentAttendeeIds.filter((id: string) => !attendeeIds.includes(id))
        
        updateData.attendees = {
          connect: attendeesToConnect.map(id => ({ id })),
          disconnect: attendeesToDisconnect.map(id => ({ id })),
        }
      }
      
      // Update the event
      const updatedEvent = await prisma.event.update({
        where: {
          id,
        },
        data: updateData,
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
      
      return NextResponse.json(updatedEvent)
    } catch (error) {
      console.error('Update event error:', error)
      return NextResponse.json(
        { error: 'Something went wrong' },
        { status: 500 }
      )
    }
  })
}

// DELETE /api/events/[id] - Delete an event
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (_, userId) => {
    try {
      const { id } = params
      
      // Get the event
      const event = await prisma.event.findUnique({
        where: {
          id,
        },
      })
      
      if (!event) {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        )
      }
      
      // Only the event owner can delete it
      if (event.userId !== userId) {
        return NextResponse.json(
          { error: 'You do not have permission to delete this event' },
          { status: 403 }
        )
      }
      
      // Delete the event
      await prisma.event.delete({
        where: {
          id,
        },
      })
      
      return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
      console.error('Delete event error:', error)
      return NextResponse.json(
        { error: 'Something went wrong' },
        { status: 500 }
      )
    }
  })
} 