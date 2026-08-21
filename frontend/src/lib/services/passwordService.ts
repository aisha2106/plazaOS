import { api } from '../api'
import type { AuthUser } from '../../context/AuthContext'

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface ChangePasswordResponse {
  user?: AuthUser
}

export const passwordService = {
  async changePassword(payload: ChangePasswordPayload): Promise<ChangePasswordResponse | undefined> {
    return await api.post<ChangePasswordResponse | undefined>('/auth/change-password', payload)
  },
}
