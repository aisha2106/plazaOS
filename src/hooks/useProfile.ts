import { useQuery } from '@tanstack/react-query'
import { profileService } from '../lib/services/profileService'

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.getProfile(),
  })
}
