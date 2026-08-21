import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { dbConnect } from '@/lib/db'
import { User } from '@/models/User'
import { Lease } from '@/models/Lease'
import { ApiError } from '@/lib/api-error'
import { withErrorHandling, requireRole, OPTIONS as corsOptions } from '@/lib/route-handler'

export { corsOptions as OPTIONS }

function toProfile(user: any, lease: any) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    unit: user.unitNumber,
    leaseStart: lease?.startDate,
    leaseEnd: lease?.endDate,
    monthlyRent: lease?.rentAmount,
  }
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  const auth = requireRole(request, 'tenant')
  await dbConnect()
  const user = await User.findById(auth.sub)
  if (!user) throw new ApiError('Not found', 404)
  // Most recent active lease for this tenant, falling back to the latest ended one.
  const lease = await Lease.findOne({ tenantId: user._id }).sort({ status: 1, startDate: -1 })
  return NextResponse.json(toProfile(user, lease))
})

const updateProfileSchema = z
  .object({
    name: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
  })
  .strict()

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const auth = requireRole(request, 'tenant')
  const body = await request.json().catch(() => null)
  const parsed = updateProfileSchema.safeParse(body)
  if (!parsed.success) throw new ApiError('Invalid profile update', 400)

  await dbConnect()
  const user = await User.findById(auth.sub)
  if (!user) throw new ApiError('Not found', 404)

  if (parsed.data.name !== undefined) user.name = parsed.data.name
  if (parsed.data.phone !== undefined) user.phone = parsed.data.phone
  await user.save()

  const lease = await Lease.findOne({ tenantId: user._id }).sort({ status: 1, startDate: -1 })
  return NextResponse.json(toProfile(user, lease))
})
