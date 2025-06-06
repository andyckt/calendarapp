import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'

// Validation schema for registration data
const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
})

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json()
    const validationResult = registerSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      )
    }
    
    const { name, email, password } = validationResult.data
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password)
    
    // Create user and default calendar in a transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create the user
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      })
      
      // Create a default calendar for the user
      await tx.calendar.create({
        data: {
          name: 'My Calendar',
          color: 'bg-blue-500',
          isDefault: true,
          userId: newUser.id,
        },
      })
      
      return newUser
    })
    
    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    })
    
    // Return user data and token
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
} 