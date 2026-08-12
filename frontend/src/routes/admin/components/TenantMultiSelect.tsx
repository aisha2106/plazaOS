import { Text } from '../../../components'
import type { Tenant } from '../data/types'

interface TenantMultiSelectProps {
  tenants: Tenant[]
  selectedTenantIds: string[]
  onChange: (tenantIds: string[]) => void
}

// Used by both Announcements and the manual reminder form to target a
// specific group of tenants.
export function TenantMultiSelect({ tenants, selectedTenantIds, onChange }: TenantMultiSelectProps) {
  function toggle(tenantId: string) {
    if (selectedTenantIds.includes(tenantId)) {
      onChange(selectedTenantIds.filter((id) => id !== tenantId))
    } else {
      onChange([...selectedTenantIds, tenantId])
    }
  }

  return (
    <div className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-button border border-slate-200 p-2">
      {tenants.map((tenant) => (
        <label
          key={tenant.id}
          className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-button px-2 hover:bg-slate-200/40"
        >
          <input
            type="checkbox"
            checked={selectedTenantIds.includes(tenant.id)}
            onChange={() => toggle(tenant.id)}
            className="h-4 w-4 rounded border-slate-200 text-primary focus:ring-primary-light"
          />
          <Text variant="body" className="text-slate-900">
            {tenant.name}
          </Text>
          <Text variant="caption" className="text-slate-500">
            {tenant.unitNumber}
          </Text>
        </label>
      ))}
    </div>
  )
}
