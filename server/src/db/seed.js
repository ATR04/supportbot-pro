/**
 * db/seed.js
 * Seeds the database with sample support tickets + their embeddings.
 * Run with:  npm run db:seed
 */

require('dotenv').config()
const pool = require('./client')
const { generateEmbedding } = require('../services/embeddings')

// ─────────────────────────────────────────────────────────────────────────────
//  Sample support tickets — your knowledge base
//  (Boilerplate — no need to change these)
// ─────────────────────────────────────────────────────────────────────────────
const SAMPLE_TICKETS = [
  {
    title: 'Cannot log in after password reset',
    description: 'User reset their password but still cannot log in. Getting "invalid credentials" error on every attempt.',
    resolution: 'Cleared the browser cache and cookies. The old session token was cached. After clearing, login worked immediately with the new password.',
    category: 'account',
    priority: 'high',
  },
  {
    title: 'Application crashes on startup',
    description: 'The desktop app crashes immediately after the splash screen on Windows 11. Error log shows a missing DLL: vcruntime140.dll not found.',
    resolution: 'Installed the latest Microsoft Visual C++ Redistributable package from the official Microsoft website. Application launched successfully after reinstall.',
    category: 'technical',
    priority: 'critical',
  },
  {
    title: 'Invoice shows wrong billing amount',
    description: 'Monthly invoice is $299 but customer is on the $99/month plan. Overcharged for 3 consecutive months.',
    resolution: 'Found that the account was accidentally upgraded during a bulk migration script. Downgraded to correct plan, issued refund of $600, and sent confirmation email.',
    category: 'billing',
    priority: 'high',
  },
  {
    title: 'Cannot access admin dashboard',
    description: 'User gets "403 Forbidden" when accessing /admin. Was working fine yesterday. No recent changes made by user.',
    resolution: 'Admin role was accidentally removed during a permissions audit script. Re-assigned the admin role via the internal user management tool and verified access.',
    category: 'access',
    priority: 'high',
  },
  {
    title: 'Emails not being received',
    description: 'Customer reports that they are not receiving any email notifications including password reset emails and invoice receipts.',
    resolution: 'Email address had a typo (gnail.com instead of gmail.com). Updated email in account settings and re-sent the pending notifications. All emails delivered.',
    category: 'account',
    priority: 'medium',
  },
  {
    title: 'API rate limit exceeded unexpectedly',
    description: 'Developer hitting 429 errors despite being on the Pro plan which allows 10,000 requests/hour. Only making ~2,000 requests.',
    resolution: 'Identified a bug in the rate limiter that was counting retried requests multiple times. Deployed a hotfix and reset the customer rate limit counter. Offered 1-month credit.',
    category: 'technical',
    priority: 'critical',
  },
  {
    title: 'Data export is missing rows',
    description: 'CSV export of user data contains only 8,000 rows but the dashboard shows 12,500 total records.',
    resolution: 'Export function had a hardcoded LIMIT of 8000 rows from a legacy constraint. Removed the limit, re-ran the export, and delivered the complete file with 12,500 rows.',
    category: 'technical',
    priority: 'medium',
  },
  {
    title: 'Two-factor authentication codes not working',
    description: 'User enabled 2FA but authentication codes from Google Authenticator are always rejected as invalid.',
    resolution: 'Device clock was out of sync by 3 minutes. TOTP codes are time-sensitive. Guided user to enable automatic time sync on their phone. 2FA worked immediately after.',
    category: 'account',
    priority: 'high',
  },
  {
    title: 'Dashboard loading very slowly',
    description: 'Main dashboard takes 25-30 seconds to load. Was loading in under 2 seconds last week. Affects all users on the account.',
    resolution: 'Identified a missing database index on the reports table after a recent migration. Added the index and ran ANALYZE. Dashboard load time dropped back to 1.8 seconds.',
    category: 'performance',
    priority: 'high',
  },
  {
    title: 'Team member cannot be invited',
    description: 'Admin tries to invite a new team member but gets "invitation failed" error. Tried multiple email addresses with same result.',
    resolution: 'Account had reached the 10-seat limit on the Starter plan. Explained the limit, offered upgrade options, and the customer upgraded to the Pro plan. Invitation sent successfully.',
    category: 'billing',
    priority: 'medium',
  },
  {
    title: 'Webhook not firing on new events',
    description: 'Webhook endpoint configured correctly but not receiving any POST requests when new orders are created. Tested with webhook.site — no requests received.',
    resolution: 'Webhook had been automatically disabled after 50 consecutive failures the previous week. Re-enabled the webhook, fixed the SSL certificate on the customer endpoint, and verified delivery.',
    category: 'technical',
    priority: 'high',
  },
  {
    title: 'Forgot username and cannot recover account',
    description: 'User does not remember their username or the email address used during signup. Cannot use standard password reset flow.',
    resolution: 'Verified identity using billing information (last 4 card digits + billing address). Located account by payment record. Sent account recovery link to backup email on file.',
    category: 'account',
    priority: 'low',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
//  YOUR TASK: Loop through tickets, embed each one, and insert into the DB
// ─────────────────────────────────────────────────────────────────────────────
//
//  What you're building:
//  For each ticket, you combine its title + description into one string,
//  send it to Voyage AI to get a vector, then insert the ticket + vector
//  into the `tickets` table.
//
//  Step-by-step:
//
//  1. Loop through SAMPLE_TICKETS with a for...of loop
//     (use for...of not forEach — await doesn't work inside forEach)
//
//  2. For each ticket, build the text to embed:
//
//       const textToEmbed = `${ticket.title}\n${ticket.description}`
//
//  3. Generate the embedding:
//
//       const embedding = await generateEmbedding(textToEmbed)
//
//  4. Convert the embedding array to a string pgvector understands:
//
//       const embeddingStr = '[' + embedding.join(',') + ']'
//
//  5. Insert into the database:
//
//       await pool.query(
//         `INSERT INTO tickets (title, description, resolution, category, priority, embedding)
//          VALUES ($1, $2, $3, $4, $5, $6::vector)
//          ON CONFLICT DO NOTHING`,
//         [ticket.title, ticket.description, ticket.resolution,
//          ticket.category, ticket.priority, embeddingStr]
//       )
//
//  6. Log progress after each insert:
//       console.log(`  ✅ [${i+1}/${SAMPLE_TICKETS.length}] ${ticket.title}`)
//
//  7. After the loop, call pool.end() to close the DB connection.
//
//  Note: We hit the embedding API once per ticket, so add a small delay
//  between calls to avoid rate limiting:
//       await new Promise(r => setTimeout(r, 200))
//
// ─────────────────────────────────────────────────────────────────────────────

async function seedTickets() {
  console.log(`\n🌱 Seeding ${SAMPLE_TICKETS.length} tickets...\n`)

  // Clear existing tickets to avoid duplicates on re-run
  await pool.query('TRUNCATE TABLE tickets RESTART IDENTITY CASCADE')
  console.log('🗑️  Cleared existing tickets\n')

  try {
    for(let i = 0; i < SAMPLE_TICKETS.length; i++) {
      const ticket = SAMPLE_TICKETS[i];
      const textToEmbed = `${ticket.title}\n${ticket.description}`
      const embedding = await generateEmbedding(textToEmbed);
      const embeddingStr = '[' + embedding.join(',') + ']'
      await pool.query(
        `INSERT INTO tickets (title, description, resolution, category, priority, embedding)
          VALUES ($1, $2, $3, $4, $5, $6::vector)`,
        [ticket.title, ticket.description, ticket.resolution,
          ticket.category, ticket.priority, embeddingStr]
      );
      console.log(`  ✅ [${i+1}/${SAMPLE_TICKETS.length}] ${ticket.title}`);

      // Voyage AI free tier = 3 requests/min → wait 21s between calls
      if (i < SAMPLE_TICKETS.length - 1) {
        console.log(`  ⏳ Waiting 21s (free tier rate limit)...`)
        await new Promise(r => setTimeout(r, 21000));
      }
    }
  } catch(err) {
    throw err;
  }

  await pool.end()
  console.log('\n✅ Seeding complete!')
}

seedTickets().catch(err => {
  console.error('❌ Seed failed:', err.message)
  process.exit(1)
})
