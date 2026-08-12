import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { ApiError } from './api-error'

// Non-web-root local disk storage — acceptable MVP alternative to object
// storage per BACKEND_BUILD_PLAN.md §6; served only through an authenticated
// route, never a static/public path.
const UPLOAD_ROOT = path.join(process.cwd(), 'uploads')
const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_FILES = 5

/** Sniffs the actual file content (not the client-supplied MIME type) for jpeg/png/webp magic bytes. */
function sniffImageExtension(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg'
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'png'
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  return null
}

export async function saveMaintenanceImages(files: File[]): Promise<string[]> {
  if (files.length > MAX_FILES) throw new ApiError(`You can attach up to ${MAX_FILES} images`, 400)

  const dir = path.join(UPLOAD_ROOT, 'maintenance')
  await mkdir(dir, { recursive: true })

  const filenames: string[] = []
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) throw new ApiError(`"${file.name}" is larger than 5MB`, 400)

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = sniffImageExtension(buffer)
    if (!ext) throw new ApiError(`"${file.name}" isn't a supported image type (jpeg, png, webp)`, 400)

    const filename = `${randomUUID()}.${ext}`
    await writeFile(path.join(dir, filename), buffer)
    filenames.push(filename)
  }
  return filenames
}

export function maintenanceImagePath(filename: string): string {
  return path.join(UPLOAD_ROOT, 'maintenance', filename)
}
