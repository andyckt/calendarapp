import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/middleware'

// Validation schema for updating a calendar
const updateCalendarSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().optional(),
  description: z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
})

// GET /api/calendars/[id] - Get a specific calendar
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (_, userId) => {
    const { id } = params

    const calendar = await prisma.calendar.findUnique({
      where: {
        id,
        userId, // Ensure the calendar belongs to the user
      },
    })

    if (!calendar) {
      return NextResponse.json(
        { error: 'Calendar not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(calendar)
  })
}

// PATCH /api/calendars/[id] - Update a calendar
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req, userId) => {
    try {
      const { id } = params

      // Parse and validate request body
      const body = await req.json()
      const validationResult = updateCalendarSchema.safeParse(body)
      
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validationResult.error.issues },
          { status: 400 }
        )
      }
      
      const data = validationResult.data
      
      // Check if the calendar exists and belongs to the user
      const existingCalendar = await prisma.calendar.findUnique({
        where: {
          id,
          userId,
        },
      })
      
      if (!existingCalendar) {
        return NextResponse.json(
          { error: 'Calendar not found' },
          { status: 404 }
        )
      }
      
      // If setting this calendar as default, unset any existing default calendars
      if (data.isDefault) {
        await prisma.calendar.updateMany({
          where: {
            userId,
            isDefault: true,
            id: { not: id }, // Don't update the current calendar
          },
          data: {
            isDefault: false,
          },
        })
      }
      
      // Update the calendar
      const updatedCalendar = await prisma.calendar.update({
        where: {
          id,
        },
        data,
      })
      
      return NextResponse.json(updatedCalendar)
    } catch (error) {
      console.error('Update calendar error:', error)
      return NextResponse.json(
        { error: 'Something went wrong' },
        { status: 500 }
      )
    }
  })
}

// DELETE /api/calendars/[id] - Delete a calendar
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (_, userId) => {
    try {
      const { id } = params
      
      // Check if the calendar exists and belongs to the user
      const existingCalendar = await prisma.calendar.findUnique({
        where: {
          id,
          userId,
        },
      })
      
      if (!existingCalendar) {
        return NextResponse.json(
          { error: 'Calendar not found' },
          { status: 404 }
        )
      }
      
      // Don't allow deleting the default calendar
      if (existingCalendar.isDefault) {
        return NextResponse.json(
          { error: 'Cannot delete the default calendar' },
          { status: 400 }
        )
      }
      
      // Check if there's at least one other calendar
      const calendarsCount = await prisma.calendar.count({
        where: {
          userId,
        },
      })
      
      if (calendarsCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the only calendar' },
          { status: 400 }
        )
      }
      
      // Delete the calendar (this will also delete associated events due to cascade)
      await prisma.calendar.delete({
        where: {
          id,
        },
      })
      
      return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
      console.error('Delete calendar error:', error)
      return NextResponse.json(
        { error: 'Something went wrong' },
        { status: 500 }
      )
    }
  })
} 