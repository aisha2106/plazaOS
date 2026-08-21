import { Card, Text } from '../../../components'
import { DetailField } from '../components/DetailField'

interface TempPasswordRevealProps {
  email: string
  tempPassword: string
}

// Used by both the create-tenant confirmation screen and the reset-password
// action on the tenant detail page.
export function TempPasswordReveal({ email, tempPassword }: TempPasswordRevealProps) {
  return (
    <Card className="max-w-md">
      <Text variant="caption" className="mb-3 text-warning">
        Shown once — copy it now. It cannot be retrieved after you leave this page.
      </Text>
      <div className="flex flex-col gap-4">
        <DetailField label="Email">{email}</DetailField>
        <DetailField label="Temporary password">
          <span className="font-mono text-lg tracking-wide">{tempPassword}</span>
        </DetailField>
      </div>
    </Card>
  )
}
