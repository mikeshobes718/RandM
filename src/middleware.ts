import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // Redirect apex domain to www
  if (hostname === 'reviewsandmarketing.com') {
    const url = request.nextUrl.clone();
    url.host = 'www.reviewsandmarketing.com';
    return NextResponse.redirect(url, 301);
  }

  // Pass URL parameters to dashboard layout for edit mode detection
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const fromEdit = request.nextUrl.searchParams.get('from') === 'edit';
    console.log('[MIDDLEWARE] Dashboard request:', {
      pathname: request.nextUrl.pathname,
      search: request.nextUrl.search,
      fromEdit,
      url: request.nextUrl.toString()
    });
    
    const response = NextResponse.next();
    response.headers.set('x-url', request.nextUrl.toString());
    response.headers.set('x-from-edit', fromEdit ? 'true' : 'false');
    return response;
  }

  // Also handle onboarding/business requests to pass edit mode
  if (request.nextUrl.pathname.startsWith('/onboarding/business')) {
    const isEdit = request.nextUrl.searchParams.get('edit') === '1';
    console.log('[MIDDLEWARE] Onboarding business request:', {
      pathname: request.nextUrl.pathname,
      search: request.nextUrl.search,
      isEdit,
      url: request.nextUrl.toString()
    });
    
    const response = NextResponse.next();
    response.headers.set('x-url', request.nextUrl.toString());
    response.headers.set('x-is-edit', isEdit ? 'true' : 'false');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

