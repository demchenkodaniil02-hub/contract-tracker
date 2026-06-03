import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isResetPage = request.nextUrl.pathname === '/reset-password'

  // Пропускаем публичные страницы и API
  if (isLoginPage || isResetPage) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
