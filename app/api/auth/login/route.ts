import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { comparePasswords, generateToken } from '@/lib/auth'

// Validation schema for login data
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json()
    const validationResult = loginSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      )
    }
    
    const { email, password } = validationResult.data
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })
    
    // If user not found or password doesn't match
    if (!user || !(await comparePasswords(password, user.password))) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
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
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
} 