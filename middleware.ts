import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl
  
  // Define public routes that don't need authentication
  const isPublicRoute = pathname.startsWith('/auth')
  const isRootPath = pathname === '/'
  
  // Always allow access to the root path initially
  // This helps with initial loading in production
  if (isRootPath) {
    // If not authenticated, redirect to auth page
    if (!token) {
      return NextResponse.redirect(new URL('/auth', request.url))
    }
    // If authenticated, allow access to root
    return NextResponse.next()
  }
  
  // If authenticated and trying to access auth page, redirect to home
  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  // If not authenticated and trying to access protected route, redirect to auth
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }
  
  return NextResponse.next()
}

// Update matcher to exclude more static assets and API routes
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)'
  ],
} 