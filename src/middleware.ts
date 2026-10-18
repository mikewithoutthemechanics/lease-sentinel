import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // The Hlaza storefront is public and session-free — bypass Supabase auth for it.
  if (request.nextUrl.pathname === '/shop' || request.nextUrl.pathname.startsWith('/shop/')) {
    return NextResponse.next()
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
