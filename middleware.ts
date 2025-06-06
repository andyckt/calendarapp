import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define which routes should be public (accessible without login)
const publicRoutes = ['/auth']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if the pathname is a public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // If this is an API route, don't redirect
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }
  
  // Get the token from cookies or headers
  const token = request.cookies.get('token')?.value || request.headers.get('Authorization')?.split(' ')[1]
  
  // If there's no token and it's not a public route, redirect to login
  if (!token && !isPublicRoute) {
    const url = new URL('/auth', request.url)
    return NextResponse.redirect(url)
  }
  
  // If there's a token and user is trying to access auth page, redirect to home
  if (token && isPublicRoute) {
    const url = new URL('/', request.url)
    return NextResponse.redirect(url)
  }
  
  return NextResponse.next()
}

export const config = {
  // Matcher for routes that should go through this middleware
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
} 