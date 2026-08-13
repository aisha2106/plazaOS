// Ad-hoc Resend smoke test — sends one email via sendEmail() to confirm the
// configured RESEND_API_KEY/RESEND_FROM_EMAIL actually deliver.
// Run with: npm run test:email -- you@example.com
import 'dotenv/config'
import { sendEmail } from '../src/lib/email'

async function main() {
  const to = process.argv[2]
  if (!to) {
    console.error('Usage: npm run test:email -- you@example.com')
    process.exit(1)
  }

  await sendEmail({
    to,
    subject: 'plazaOS Resend test',
    html: '<p>This is a test email from plazaOS to confirm Resend is configured correctly.</p>',
  })
  console.log(`Done — check ${to}'s inbox (and spam folder).`)
}

main()
