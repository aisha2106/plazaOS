import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { profileService } from '../lib/services/profileService'
import type { Profile } from '../lib/types'

export function useProfile() {
  const queryClient = useQueryClient()

  const query = useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: () => profileService.getProfile(),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<Profile>) => profileService.updateProfile(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data)
    },
  })

  return { ...query, updateMutation }
}
