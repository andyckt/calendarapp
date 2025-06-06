import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

export interface JWTPayload {
  userId: string
  email: string
}

// This would typically come from an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-development'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword)
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

export function extractTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  return authHeader.split(' ')[1]
}

export function getCurrentUser(req: NextRequest): JWTPayload | null {
  const token = extractTokenFromRequest(req)
  if (!token) return null
  
  return verifyToken(token)
} 