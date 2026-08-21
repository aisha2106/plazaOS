import { api } from '../api'

export const authService = {
  async setPassword(newPassword: string): Promise<{ success: boolean }> {
    try {
      return await api.post('/auth/set-password', { newPassword })
    } catch (err) {
      if (!import.meta.env.DEV) throw err
      // DEV-only: no real backend to persist this against yet.
      return { success: true }
    }
  },
}
