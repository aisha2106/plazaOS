import { api } from '../api'
import type { Profile } from '../types'

export const profileService = {
  async getProfile(): Promise<Profile> {
    return await api.get('/tenant/profile')
  },

  async updateProfile(payload: Partial<Profile>): Promise<Profile> {
    return await api.put('/tenant/profile', payload)
  },
}
