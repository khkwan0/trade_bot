import createMiddleware from 'next-intl/middleware'
import {NextRequest, NextResponse} from 'next/server'
import {logger, nextRequestId} from './lib/logger'

export {auth as proxy} from '@/auth'

const i18nMiddleware = createMiddleware({
  locales: [
    'en',
  ],
  defaultLocale: 'en',
})

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Handle API routes - authenticate user (matching Fastify's preHandler hook)
  if (pathname.startsWith('/api/')) {
    // Skip NextAuth routes - they need to handle cookies directly
    if (pathname.startsWith('/api/auth/')) {
      return NextResponse.next()
    }

    const startTime = process.hrtime.bigint()
    const requestId = nextRequestId()
    logger.info(
      {
        reqId: requestId,
        req: {
          method: request.method,
          url: pathname,
          hostname: request.headers.get('host'),
          remoteAddress:
            request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
            request.headers.get('x-real-ip') ??
            'unknown IP',
          remotePort: request.headers.get('x-forwarded-port'),
        },
      },
      'incoming request',
    )

    const response = NextResponse.next()
    logger.info(
      {
        reqId: requestId,
        res: {statusCode: response.status},
        responseTime: Number(process.hrtime.bigint() - startTime) / 1000000,
      },
      'request completed',
    )
    response.headers.set('x-request-id', requestId)
    return response
  }

  // Check if this is a static file request
  const isStaticFile =
    /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|eot|webp|yaml)$/.test(
      pathname,
    )

  // If it's a static file, skip i18n processing
  if (isStaticFile) {
    return NextResponse.next()
  }

  // Skip i18n middleware for socket.io paths
  if (pathname.startsWith('/socket.io')) {
    return NextResponse.next()
  }

  // Skip i18n middleware for SEO routes (sitemap, robots.txt)
  if (
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    pathname.startsWith('/sitemap')
  ) {
    return NextResponse.next()
  }

  // Step 1: run next-intl middleware first
  const response = i18nMiddleware(request)

  // Step 2: if next-intl response is a redirect or error, return it immediately
  if (response && !response.ok) {
    return response
  }

  // Step 3: your custom middleware logic here (e.g., authentication)
  // For example, check session and redirect if not authenticated:

  /*
  const isLoggedIn = false; // your logic here
  if (!isLoggedIn && request.nextUrl.pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  */

  // Step 4: if no early return, proceed with next response
  const startTime = process.hrtime.bigint()
  const requestId = nextRequestId()
  logger.info(
    {
      reqId: requestId,
      req: {
        method: request.method,
        url: pathname,
        hostname: request.headers.get('host'),
        remoteAddress:
          request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
          request.headers.get('x-real-ip') ??
          'unknown IP',
        remotePort: request.headers.get('x-forwarded-port'),
      },
    },
    'incoming request',
  )
  const _response = response || NextResponse.next()
  logger.info(
    {
      reqId: requestId,
      res: {statusCode: response.status},
      responseTime: Number(process.hrtime.bigint() - startTime) / 1000000,
    },
    'request completed',
  )
  _response.headers.set('x-request-id', requestId)
  return _response
}

// Matcher to apply middleware to appropriate paths
// Now includes API routes for authentication
export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
}