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
        eventAttendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
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

    // Transform to maintain backwards compatibility
    const attendees = event.eventAttendees.map(ea => ea.user);

    // Check if the user has permission to view this event
    const hasPermission = event.userId === userId || 
                        attendees.some((attendee) => attendee.id === userId)
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to view this event' },
        { status: 403 }
      )
    }

    // Transform the response to maintain backwards compatibility
    const { eventAttendees, ...rest } = event;
    return NextResponse.json({
      ...rest,
      attendees
    })
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
          eventAttendees: {
            include: {
              user: true
            }
          },
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
      
      // Remove attendeeIds from updateData
      const { attendeeIds } = data
      if (attendeeIds) {
        delete updateData.attendeeIds
      }
      
      // Update the event basic info first
      const updatedEvent = await prisma.event.update({
        where: {
          id,
        },
        data: updateData,
        include: {
          eventAttendees: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              }
            }
          },
          calendar: true,
        },
      })
      
      // Handle attendees updates separately if needed
      if (attendeeIds) {
        // Get current attendee IDs
        const currentAttendeeIds = existingEvent.eventAttendees.map(ea => ea.userId);
        
        // Determine attendees to add and remove
        const attendeesToAdd = attendeeIds.filter(id => !currentAttendeeIds.includes(id));
        const attendeesToRemove = currentAttendeeIds.filter(id => !attendeeIds.includes(id));
        
        // Add new attendees
        if (attendeesToAdd.length > 0) {
          await Promise.all(
            attendeesToAdd.map(attendeeId => 
              prisma.eventAttendee.create({
                data: {
                  userId: attendeeId,
                  eventId: id
                }
              })
            )
          );
        }
        
        // Remove attendees
        if (attendeesToRemove.length > 0) {
          await Promise.all(
            attendeesToRemove.map(attendeeId => 
              prisma.eventAttendee.deleteMany({
                where: {
                  eventId: id,
                  userId: attendeeId
                }
              })
            )
          );
        }
        
        // Fetch the updated event with attendees
        const refreshedEvent = await prisma.event.findUnique({
          where: { id },
          include: {
            eventAttendees: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  }
                }
              }
            },
            calendar: true,
          }
        });
        
        // Transform to maintain backwards compatibility
        const { eventAttendees, ...rest } = refreshedEvent!;
        return NextResponse.json({
          ...rest,
          attendees: eventAttendees.map(ea => ea.user)
        });
      }
      
      // Transform the response to maintain backwards compatibility
      const { eventAttendees, ...rest } = updatedEvent;
      return NextResponse.json({
        ...rest,
        attendees: eventAttendees.map(ea => ea.user)
      });
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
      
      // Delete the event (will cascade delete related eventAttendees)
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