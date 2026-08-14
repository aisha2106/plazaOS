import { useMutation } from '@tanstack/react-query'
import { passwordService, type ChangePasswordPayload } from '../lib/services/passwordService'

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => passwordService.changePassword(payload),
  })
}
