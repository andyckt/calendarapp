import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from './auth'

export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = getCurrentUser(req)

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return handler(req, user.userId)
} 