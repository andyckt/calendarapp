import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/middleware'

// Validation schema for creating a calendar
const createCalendarSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().default('bg-blue-500'),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
})

// GET /api/calendars - Get all calendars for the authenticated user
export async function GET(req: NextRequest) {
  return withAuth(req, async (_, userId) => {
    const calendars = await prisma.calendar.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(calendars)
  })
}

// POST /api/calendars - Create a new calendar
export async function POST(req: NextRequest) {
  return withAuth(req, async (req, userId) => {
    try {
      // Parse and validate request body
      const body = await req.json()
      const validationResult = createCalendarSchema.safeParse(body)
      
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validationResult.error.issues },
          { status: 400 }
        )
      }
      
      const { name, color, description, isDefault } = validationResult.data
      
      // If this calendar is set as default, unset any existing default calendars
      if (isDefault) {
        await prisma.calendar.updateMany({
          where: {
            userId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        })
      }
      
      // Create the calendar
      const calendar = await prisma.calendar.create({
        data: {
          name,
          color,
          description,
          isDefault,
          userId,
        },
      })
      
      return NextResponse.json(calendar, { status: 201 })
    } catch (error) {
      console.error('Create calendar error:', error)
      return NextResponse.json(
        { error: 'Something went wrong' },
        { status: 500 }
      )
    }
  })
} 