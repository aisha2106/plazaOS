import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import { User } from '@/models/User'
import { ApiError } from '@/lib/api-error'
import { generateTempPassword, hashPassword } from '@/lib/password'
import { withErrorHandling, requireRole, OPTIONS as corsOptions } from '@/lib/route-handler'

export { corsOptions as OPTIONS }

// Mirrors the temp-password handling in `POST /tenants`: generated
// server-side, hashed before storing, and returned in plaintext exactly once
// in this response — never logged or stored. See BACKEND_BUILD_PLAN.md §2/§13.
export const POST = withErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  requireRole(request, 'admin')
  const { id } = await params

  await dbConnect()
  const user = await User.findOne({ _id: id, role: 'tenant' }).catch(() => null)
  if (!user) throw new ApiError('Tenant not found', 404)

  const tempPassword = generateTempPassword()
  user.passwordHash = await hashPassword(tempPassword)
  user.accountStatus = 'temporary'
  user.mustChangePassword = true
  await user.save()

  return NextResponse.json({ success: true, email: user.email, tempPassword })
})
