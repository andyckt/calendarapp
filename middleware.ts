import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl
  
  // Define public routes that don't need authentication
  const isPublicRoute = pathname.startsWith('/auth')
  
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

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
} 