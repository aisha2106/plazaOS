/**
 * Backend contract for available/vacant units:
 *
 * The existing admin data layer exposes getUnits() which filters units by
 * status. For the real backend, this hook should call:
 *
 *   GET /admin/units?status=vacant&pageSize=1000
 *
 * or the dedicated endpoint if the backend provides one:
 *
 *   GET /admin/units/available
 *
 * Response shape expected by UnitSelector:
 * {
 *   "data": [
 *     { "id": "unit-1", "unitNumber": "A-101", "floor": "1", "monthlyRent": 1200, ... }
 *   ],
 *   "total": 10
 * }
 */

import { useQuery } from '@tanstack/react-query'
import { getUnits } from '../routes/admin/units/data'
import type { Unit } from '../routes/admin/data/types'

interface AvailableUnitsResponse {
  data: Unit[]
  total: number
}

export function useAvailableUnits() {
  return useQuery<AvailableUnitsResponse>({
    queryKey: ['available-units'],
    queryFn: () => Promise.resolve(getUnits({ status: 'vacant', pageSize: 1000 })),
    staleTime: 1000 * 60 * 5,
  })
}
