import { NextResponse } from 'next/server'

const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map((origin) => origin.trim())

function resolveOrigin(requestOrigin: string | null): string {
  if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) return requestOrigin
  return ALLOWED_ORIGINS[0]
}

export function withCors(response: NextResponse, requestOrigin: string | null): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', resolveOrigin(requestOrigin))
  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Vary', 'Origin')
  return response
}

export function corsPreflight(requestOrigin: string | null): NextResponse {
  return withCors(new NextResponse(null, { status: 204 }), requestOrigin)
}
