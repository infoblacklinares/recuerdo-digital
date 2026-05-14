import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const cookie = request.cookies.get('admin_auth')

  if (!cookie || cookie.value !== 'true') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/dashboard', '/admin/dashboard/:path*'],
}
