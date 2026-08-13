import { ApiError } from './api-error'
import { uploadMaintenanceImage, type UploadedImage } from './cloudinary'

// Images are stored in Cloudinary, not on local disk/S3 — only the resulting
// URL/public id is persisted in MongoDB (see BACKEND_BUILD_PLAN.md §6).
const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_FILES = 5

/** Sniffs the actual file content (not the client-supplied MIME type) for jpeg/png/webp magic bytes. */
function isSupportedImage(buffer: Buffer): boolean {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return true
  return false
}

export async function saveMaintenanceImages(files: File[]): Promise<UploadedImage[]> {
  if (files.length > MAX_FILES) throw new ApiError(`You can attach up to ${MAX_FILES} images`, 400)

  const uploads: UploadedImage[] = []
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) throw new ApiError(`"${file.name}" is larger than 5MB`, 400)

    const buffer = Buffer.from(await file.arrayBuffer())
    if (!isSupportedImage(buffer)) throw new ApiError(`"${file.name}" isn't a supported image type (jpeg, png, webp)`, 400)

    uploads.push(await uploadMaintenanceImage(buffer))
  }
  return uploads
}

