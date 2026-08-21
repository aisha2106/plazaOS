import { describe, it, expect } from 'vitest'
import { NextResponse } from 'next/server'
import { withCors, corsPreflight } from '@/lib/cors'

// vitest.setup.ts sets CORS_ORIGIN=http://localhost:5173 (a single allow-listed origin).
describe('cors', () => {
  it('echoes back an allow-listed request origin', () => {
    const response = withCors(NextResponse.json({ ok: true }), 'http://localhost:5173')
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173')
  })

  it('falls back to the first allow-listed origin for an unrecognized origin', () => {
    const response = withCors(NextResponse.json({ ok: true }), 'http://evil.example.com')
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173')
  })

  it('falls back to the first allow-listed origin when no origin header is present', () => {
    const response = withCors(NextResponse.json({ ok: true }), null)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173')
  })

  it('sets Vary: Origin on every response', () => {
    const response = withCors(NextResponse.json({ ok: true }), null)
    expect(response.headers.get('Vary')).toBe('Origin')
  })

  it('returns a 204 preflight response with CORS headers set', () => {
    const response = corsPreflight('http://localhost:5173')
    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173')
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET')
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Authorization')
  })
})
