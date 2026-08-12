import { NextRequest, NextResponse } from 'next/server'
import { ApiError } from './api-error'
import { corsPreflight, withCors } from './cors'
import { verifyToken, type TokenPayload } from './jwt'

// `routeCtx` is loosely typed (`any`) because its exact shape (presence/type of
// dynamic `params`) varies per route — each route file narrows it as needed.
type RouteHandler = (request: NextRequest, routeCtx: any) => Promise<NextResponse>

/**
 * Wraps every route handler: turns thrown ApiErrors into the right status +
 * plain-text body, logs unexpected errors without leaking them to the
 * client, and attaches CORS headers to every response (success or error).
 */
export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (request, routeCtx) => {
    const origin = request.headers.get('origin')
    const start = Date.now()
    try {
      const response = await handler(request, routeCtx)
      console.log(`${request.method} ${request.nextUrl.pathname} ${response.status} ${Date.now() - start}ms`)
      return withCors(response, origin)
    } catch (err) {
      if (err instanceof ApiError) {
        console.log(`${request.method} ${request.nextUrl.pathname} ${err.status} ${Date.now() - start}ms`)
        return withCors(new NextResponse(err.message, { status: err.status }), origin)
      }
      console.error(`${request.method} ${request.nextUrl.pathname} 500 ${Date.now() - start}ms`, err)
      return withCors(new NextResponse('Internal server error', { status: 500 }), origin)
    }
  }
}

/** Shared OPTIONS handler for CORS preflight — export `{ OPTIONS }` from any route file that needs it. */
export function OPTIONS(request: NextRequest): NextResponse {
  return corsPreflight(request.headers.get('origin'))
}

export function requireAuth(request: NextRequest): TokenPayload {
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) throw new ApiError('Unauthorized', 401)
  return verifyToken(header.slice('Bearer '.length))
}

export function requireRole(request: NextRequest, role: TokenPayload['role']): TokenPayload {
  const user = requireAuth(request)
  if (user.role !== role) throw new ApiError('Forbidden', 403)
  return user
}
