import { NextRequest, NextResponse } from 'next/server'
import { ApiError } from './api-error'
import { corsPreflight, withCors } from './cors'
import { verifyToken, type TokenPayload } from './jwt'

// `routeCtx` is loosely typed (`any`) because its exact shape (presence/type of
// dynamic `params`) varies per route — each route file narrows it as needed.
type RouteHandler = (request: NextRequest, routeCtx: any) => Promise<NextResponse>

/**
 * Wraps every route handler: turns thrown ApiErrors into the right status +
 * a consistent `{ message }` JSON body, logs unexpected errors without
 * leaking them to the client, and attaches CORS headers to every response
 * (success or error).
 */
// Structured (JSON-line) request log so a hosting platform's log viewer (e.g.
// Railway) can filter/search by field instead of parsing free text; a unique
// `requestId` ties a request's success/error log line together across retries.
function logRequest(fields: { requestId: string; method: string; path: string; status: number; durationMs: number; error?: unknown }) {
  const { error, ...rest } = fields
  const line = JSON.stringify(rest)
  // 5xx (and unexpected errors) go to stderr — a separate stream from normal
  // request logs — so error-rate alerting can tail stderr only.
  if (fields.status >= 500) console.error(line, error ?? '')
  else console.log(line)
}

// Guards against DoS via oversized request bodies. JSON payloads here are
// small (form fields, not files); multipart requests need more headroom
// since maintenance uploads allow up to 5 images at 5MB each (see uploads.ts).
const JSON_BODY_LIMIT_BYTES = 100 * 1024
const MULTIPART_BODY_LIMIT_BYTES = 30 * 1024 * 1024

export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (request, routeCtx) => {
    const origin = request.headers.get('origin')
    const requestId = crypto.randomUUID()
    const start = Date.now()
    const method = request.method
    const path = request.nextUrl.pathname
    try {
      const contentLength = Number(request.headers.get('content-length') ?? '0')
      const isMultipart = (request.headers.get('content-type') ?? '').includes('multipart/form-data')
      const limit = isMultipart ? MULTIPART_BODY_LIMIT_BYTES : JSON_BODY_LIMIT_BYTES
      if (contentLength > limit) throw new ApiError('Request body too large', 413)

      const response = await handler(request, routeCtx)
      logRequest({ requestId, method, path, status: response.status, durationMs: Date.now() - start })
      response.headers.set('X-Request-Id', requestId)
      return withCors(response, origin)
    } catch (err) {
      if (err instanceof ApiError) {
        logRequest({ requestId, method, path, status: err.status, durationMs: Date.now() - start })
        const response = NextResponse.json({ message: err.message }, { status: err.status })
        response.headers.set('X-Request-Id', requestId)
        return withCors(response, origin)
      }
      logRequest({ requestId, method, path, status: 500, durationMs: Date.now() - start, error: err })
      const response = NextResponse.json({ message: 'Internal server error' }, { status: 500 })
      response.headers.set('X-Request-Id', requestId)
      return withCors(response, origin)
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
