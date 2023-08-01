import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const requestedPage = req.nextUrl.pathname;
  const validRoles = ['admin', 'super-user', 'SEO'];

  const session: any = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!session) {
    const requestedPage = req.nextUrl.pathname;
    const url = req.nextUrl.clone();
    url.pathname = `/auth/login`;
    url.search = `p=${requestedPage}`;
    return NextResponse.redirect(url);
  }

  if (
    requestedPage.startsWith('/admin') &&
    !validRoles.includes(session.user.role)
  )
    return NextResponse.redirect(new URL('/', req.url));

  if (
    requestedPage.startsWith('/api/admin') &&
    !validRoles.includes(session.user.role)
  )
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/checkout/:path*',
    '/orders/:path*',
    '/api/orders/:path*',
    '/api/admin/:path*',
    '/admin/:path*',
    '/((?!api/)/admin/:path.*)',
  ],
};
