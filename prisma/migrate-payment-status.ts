import { PrismaClient } from '@prisma/client'

async function migratePaymentStatus() {
  const prisma = new PrismaClient()

  console.log('Starting payment status migration...')
  console.log('NOTE: This script is deprecated. Payment tracking has been moved to OrderItem level.')
  console.log('Use the built-in auto-migration system instead.')

  // This script is kept for reference but is no longer functional
  // The isPaid field has been moved from Transaction to OrderItem
  // Auto-migration is now handled by src/main/services/migrationService.ts

  console.log('No migration performed. Please use the app\'s built-in migration system.')
}

migratePaymentStatus()
  .catch(console.error)
  .finally(() => process.exit())
