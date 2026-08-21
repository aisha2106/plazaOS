// Creates or updates the single real admin account from env vars — kept
// deliberately separate from scripts/seed.ts's fake development data (see
// BACKEND_BUILD_PLAN.md §8/§9). Safe to run repeatedly (idempotent upsert) in
// any environment, including production, since it never deletes data.
// Run with: npm run bootstrap:admin
import 'dotenv/config'
import mongoose from 'mongoose'
import { dbConnect } from '../src/lib/db'
import { hashPassword } from '../src/lib/password'
import { User } from '../src/models/User'

async function bootstrapAdmin() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set — the real admin password is never hardcoded in source.')
    process.exit(1)
  }
  if (password.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters.')
    process.exit(1)
  }

  await dbConnect()

  const passwordHash = await hashPassword(password)
  const normalizedEmail = email.toLowerCase()
  await User.findOneAndUpdate(
    { email: normalizedEmail },
    {
      $set: {
        name: process.env.ADMIN_NAME || 'Admin',
        email: normalizedEmail,
        passwordHash,
        role: 'admin',
        accountStatus: 'active',
        mustChangePassword: false,
      },
    },
    { upsert: true, new: true },
  )

  console.log(`Admin account ready: ${normalizedEmail} (password not logged)`)
  await mongoose.disconnect()
}

bootstrapAdmin().catch((err) => {
  console.error(err)
  process.exit(1)
})
