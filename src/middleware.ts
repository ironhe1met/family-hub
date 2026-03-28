import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('access_token')?.value

  // Public paths — allow without auth
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    // If already logged in, redirect to app
    if (accessToken) {
      return NextResponse.redirect(new URL('/tasks', request.url))
    }
    return NextResponse.next()
  }

  // API routes — let them handle auth themselves
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Protected paths — require auth
  if (!accessToken) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)',
  ],
}
