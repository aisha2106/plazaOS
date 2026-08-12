import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { profileService, type UpdateProfileInput } from '../lib/services/profileService'

export function useProfile() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.getProfile(),
  })
  const update = useMutation({
    mutationFn: (input: UpdateProfileInput) => profileService.updateProfile(input),
    onSuccess: (profile) => {
      queryClient.setQueryData(['profile'], profile)
    },
  })
  return { ...query, update }
}
