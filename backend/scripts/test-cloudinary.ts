// Ad-hoc Cloudinary smoke test — pings the API to confirm credentials work,
// then uploads and immediately destroys a tiny test image end-to-end.
// Run with: npm run test:cloudinary
import 'dotenv/config'
import { v2 as cloudinary } from 'cloudinary'
import { uploadMaintenanceImage } from '../src/lib/cloudinary'

// 1x1 transparent PNG.
const TEST_IMAGE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)

async function main() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })

  const ping = await cloudinary.api.ping()
  console.log('Ping OK:', ping)

  const uploaded = await uploadMaintenanceImage(TEST_IMAGE)
  console.log('Upload OK:', uploaded)

  await cloudinary.uploader.destroy(uploaded.publicId)
  console.log('Cleanup OK — test image deleted.')
}

main().catch((err) => {
  console.error('Cloudinary test failed:', err)
  process.exit(1)
})
