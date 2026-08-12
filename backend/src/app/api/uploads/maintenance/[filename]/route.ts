import { readFile } from 'node:fs/promises'
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import { MaintenanceRequest } from '@/models/MaintenanceRequest'
import { ApiError } from '@/lib/api-error'
import { maintenanceImagePath } from '@/lib/uploads'
import { withErrorHandling, requireAuth, OPTIONS as corsOptions } from '@/lib/route-handler'

export { corsOptions as OPTIONS }

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

// Never served from a static/public path (see BACKEND_BUILD_PLAN.md §6) — a
// tenant may only fetch images attached to their own maintenance requests;
// an admin may fetch any.
export const GET = withErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ filename: string }> }) => {
  const auth = requireAuth(request)
  const { filename } = await params

  await dbConnect()
  const owningRequest = await MaintenanceRequest.findOne({ images: filename })
  if (!owningRequest) throw new ApiError('Not found', 404)
  if (auth.role !== 'admin' && owningRequest.tenantId.toString() !== auth.sub) throw new ApiError('Not found', 404)

  const ext = filename.split('.').pop() ?? ''
  const contentType = CONTENT_TYPES[ext]
  if (!contentType) throw new ApiError('Not found', 404)

  const buffer = await readFile(maintenanceImagePath(filename)).catch(() => null)
  if (!buffer) throw new ApiError('Not found', 404)

  return new NextResponse(new Uint8Array(buffer), { status: 200, headers: { 'Content-Type': contentType } })
})
