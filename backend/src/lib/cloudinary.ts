import { v2 as cloudinary } from 'cloudinary'

let configured = false
function ensureConfigured() {
  if (configured) return
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary is not configured (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET)')
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret })
  configured = true
}

export interface UploadedImage {
  url: string
  publicId: string
}

export async function uploadMaintenanceImage(buffer: Buffer): Promise<UploadedImage> {
  ensureConfigured()
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: 'plaza-os/maintenance', resource_type: 'image' }, (err, result) => {
      if (err || !result) return reject(err ?? new Error('Cloudinary upload failed'))
      resolve({ url: result.secure_url, publicId: result.public_id })
    })
    stream.end(buffer)
  })
}
