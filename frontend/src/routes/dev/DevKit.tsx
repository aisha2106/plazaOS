import { useState } from 'react'
import { Button, Card, Input, Modal, StatusBadge, Table, Text } from '../../components'
import type { TableColumn } from '../../components'

// Dev-only page to visually check shared components against the design
// tokens. Only reachable when import.meta.env.DEV is true (see App.tsx),
// so it's excluded from production builds automatically.

interface SampleRow {
  id: string
  unit: string
  tenant: string
  status: 'success' | 'warning' | 'danger' | 'info'
}

const SAMPLE_ROWS: SampleRow[] = [
  { id: '1', unit: 'A-101', tenant: 'Jane Cooper', status: 'success' },
  { id: '2', unit: 'B-204', tenant: 'Devon Lane', status: 'warning' },
  { id: '3', unit: 'C-310', tenant: 'Wade Warren', status: 'danger' },
]

const STATUS_LABEL: Record<SampleRow['status'], string> = {
  success: 'Paid',
  warning: 'Due soon',
  danger: 'Overdue',
  info: 'Pending',
}

const columns: TableColumn<SampleRow>[] = [
  { key: 'unit', header: 'Unit', sortable: true },
  { key: 'tenant', header: 'Tenant', sortable: true },
  {
    key: 'status',
    header: 'Rent status',
    render: (row) => <StatusBadge variant={row.status} label={STATUS_LABEL[row.status]} />,
  },
]

export function DevKit() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 p-8">
      <div>
        <Text variant="display">UI Kit Verification</Text>
        <Text variant="body" className="mt-1 text-slate-500">
          Dev-only page to visually check shared components against the design tokens.
        </Text>
      </div>

      <section className="flex flex-col gap-3">
        <Text variant="h2">Typography</Text>
        <Card className="flex flex-col gap-2">
          <Text variant="display">Display 28/700</Text>
          <Text variant="h1">H1 24/700</Text>
          <Text variant="h2">H2 20/600</Text>
          <Text variant="h3">H3 16/600</Text>
          <Text variant="body">Body 15/400</Text>
          <Text variant="bodySmall">Body Small 13/400</Text>
          <Text variant="caption">Caption 12/500</Text>
          <Text variant="button">Button 15/600</Text>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <Text variant="h2">Buttons</Text>
        <Card className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <Text variant="h2">Status badges</Text>
        <Card className="flex flex-wrap gap-3">
          <StatusBadge variant="success" label="Paid" />
          <StatusBadge variant="warning" label="Due soon" />
          <StatusBadge variant="danger" label="Overdue" />
          <StatusBadge variant="info" label="Pending" />
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <Text variant="h2">Inputs</Text>
        <Card className="flex flex-col gap-4">
          <Input label="Email" placeholder="jane@example.com" />
          <Input label="Password" type="password" helperText="Minimum 8 characters" />
          <Input label="Amount" error="This field is required" />
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <Text variant="h2">Card</Text>
        <Card>
          <Text variant="h3">Unit A-101</Text>
          <Text variant="body" className="mt-1 text-slate-500">
            12px radius, 16px padding, white surface, slate-200 border.
          </Text>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <Text variant="h2">Table</Text>
        <Table columns={columns} data={SAMPLE_ROWS} getRowKey={(row) => row.id} />
        <Table columns={columns} data={[]} getRowKey={(row) => row.id} emptyMessage="No units yet" />
      </section>

      <section className="flex flex-col gap-3">
        <Text variant="h2">Modal</Text>
        <Card>
          <Button onClick={() => setIsModalOpen(true)}>Open modal</Button>
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Sample modal">
            <Text variant="body" className="text-slate-500">
              Focus is trapped inside this dialog. Press Escape or click the overlay to close it.
            </Text>
          </Modal>
        </Card>
      </section>
    </div>
  )
}
