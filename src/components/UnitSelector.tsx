import { useState, useMemo } from 'react'
import { useAvailableUnits } from '../hooks/useAvailableUnits'
import { Text, Button } from './index'
import type { Unit } from '../routes/admin/data/types'

interface UnitSelectorProps {
  label?: string
  value: string | undefined
  onChange: (unitId: string, unitName: string) => void
  error?: string
  disabled?: boolean
  units?: Unit[]
}

/**
 * UnitSelector Component
 * 
 * Displays available units in a searchable dropdown.
 * Requires backend to provide units with status=vacant via the
 * admin units data layer (getUnits).
 * 
 * Expected Backend Response (via getUnits):
 * {
 *   "data": [
 *     { "id": "unit-1", "unitNumber": "A101", "floor": "1", "monthlyRent": 1200, ... }
 *   ],
 *   "total": 10
 * }
 */
export function UnitSelector({ value, onChange, error, disabled, units: unitsProp }: UnitSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { data, isLoading, isError, refetch } = useAvailableUnits()
  const units = unitsProp ?? data?.data ?? []

  const filteredUnits = useMemo(() => {
    if (!units.length) return []
    if (!searchQuery) return units
    const query = searchQuery.toLowerCase()
    return units.filter(
      (unit) =>
        unit.unitNumber.toLowerCase().includes(query) ||
        (unit.floor && unit.floor.toString().includes(query))
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units, searchQuery])

  const selectedUnit = units.find((u) => u.id === value)

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-900">Unit</label>
      <div className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || isLoading}
          className={`w-full min-h-[44px] rounded-button border px-4 py-2 text-left text-[15px] text-slate-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-1 ${
            error ? 'border-danger focus:ring-danger/30' : 'border-slate-300 hover:border-slate-400'
          } ${isOpen ? 'border-primary' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span>{selectedUnit ? selectedUnit.unitNumber : 'Select a unit…'}</span>
            <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-card border border-slate-200 bg-white shadow-lg">
            {isLoading ? (
              <div className="p-4 text-center">
                <Text variant="bodySmall" className="text-slate-500">Loading units…</Text>
              </div>
            ) : isError ? (
              <div className="p-4 space-y-3">
                <Text variant="bodySmall" className="text-danger font-medium">Failed to load units.</Text>
                <Button size="sm" variant="secondary" onClick={() => refetch()}>Retry</Button>
              </div>
            ) : filteredUnits.length === 0 ? (
              <div className="p-4 text-center">
                <Text variant="bodySmall" className="text-slate-500">
                  {units.length === 0 ? 'No available units' : 'No results'}
                </Text>
              </div>
            ) : (
              <>
                {/* Search Box */}
                <div className="border-b border-slate-200 p-2">
                  <input
                    type="text"
                    placeholder="Search units…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full min-h-[36px] rounded-button border border-slate-200 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light"
                  />
                </div>

                {/* Unit List */}
                <ul className="max-h-64 overflow-y-auto">
                  {filteredUnits.map((unit) => (
                    <li key={unit.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(unit.id, unit.unitNumber)
                          setIsOpen(false)
                          setSearchQuery('')
                        }}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50 ${
                          value === unit.id ? 'bg-indigo-50 font-semibold text-primary' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{unit.unitNumber}</span>
                          {unit.floor && <span className="text-xs text-slate-500">Floor {unit.floor}</span>}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      {error ? (
        <span className="text-xs font-semibold text-danger">{error}</span>
      ) : null}
    </div>
  )
}
