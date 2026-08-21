import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError, getToken, setToken } from './api'

describe('api 401 handling', () => {
  const originalLocation = window.location

  beforeEach(() => {
    localStorage.clear()
    setToken('some-token')
    // jsdom's window.location doesn't support real navigation assignment;
    // stub it so the redirect-on-401 branch can be asserted on.
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, pathname: '/tenant/profile', href: '' },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation })
    vi.unstubAllGlobals()
  })

  it('clears the stored token, throws an ApiError, and redirects to /login', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })))

    await expect(api.get('/tenant/profile')).rejects.toThrow(ApiError)

    expect(getToken()).toBeNull()
    expect(window.location.href).toBe('/login')
  })

  it('does not redirect again if already on /login', async () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, pathname: '/login', href: '' },
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })))

    await expect(api.get('/tenant/profile')).rejects.toThrow(ApiError)

    expect(window.location.href).toBe('')
  })

  it('does not clear the token or redirect on a successful response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })))

    await expect(api.get('/tenant/profile')).resolves.toEqual({ ok: true })

    expect(getToken()).toBe('some-token')
    expect(window.location.href).toBe('')
  })
})
