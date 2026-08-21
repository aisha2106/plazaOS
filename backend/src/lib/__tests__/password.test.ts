import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword, generateTempPassword } from '@/lib/password'

describe('password', () => {
  it('hashes a password and verifies the same plaintext against it', async () => {
    const hash = await hashPassword('correct horse battery staple')
    expect(hash).not.toBe('correct horse battery staple')
    await expect(verifyPassword('correct horse battery staple', hash)).resolves.toBe(true)
  })

  it('rejects an incorrect password against a hash', async () => {
    const hash = await hashPassword('correct horse battery staple')
    await expect(verifyPassword('wrong password', hash)).resolves.toBe(false)
  })

  it('generates a temp password of the requested length', () => {
    expect(generateTempPassword(16)).toHaveLength(16)
  })

  it('defaults to a 10-character temp password', () => {
    expect(generateTempPassword()).toHaveLength(10)
  })

  it('never includes visually ambiguous characters (0/O/1/l/I)', () => {
    const password = generateTempPassword(200)
    expect(password).not.toMatch(/[0O1lI]/)
  })

  it('is not deterministic across calls', () => {
    const passwords = new Set(Array.from({ length: 20 }, () => generateTempPassword()))
    expect(passwords.size).toBeGreaterThan(1)
  })
})
