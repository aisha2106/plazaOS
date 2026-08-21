import { api } from '../api'

export interface Profile {
  id: string
  name: string
  email: string
  phone?: string
  unit?: string
  leaseStart?: string
  leaseEnd?: string
  monthlyRent?: number
}

export interface UpdateProfileInput {
  name?: string
  phone?: string
}

export const profileService = {
  async getProfile(): Promise<Profile> {
    try {
      return await api.get<Profile>('/tenant/profile')
    } catch (err) {
      if (!import.meta.env.DEV) throw err
      // DEV-only fallback
      return {
        id: 't-1',
        name: 'Jane Cooper',
        email: 'jane@example.com',
        phone: '555-1234',
        unit: 'A-101',
        leaseStart: '2024-01-01',
        leaseEnd: '2025-01-01',
        monthlyRent: 1200,
      }
    }
  },

  async updateProfile(input: UpdateProfileInput): Promise<Profile> {
    try {
      return await api.patch<Profile>('/tenant/profile', input)
    } catch (err) {
      if (!import.meta.env.DEV) throw err
      const current = await profileService.getProfile()
      return { ...current, ...input }
    }
  },
}
