import { PrismaClient } from '@prisma/client'

async function migratePaymentStatus() {
  const prisma = new PrismaClient()

  console.log('Starting payment status migration...')

  const transactions = await prisma.transaction.findMany({
    include: { orderItems: true }
  })

  let updatedCount = 0

  // For each paid transaction, mark all its order items as paid
  for (const transaction of transactions) {
    if (transaction.isPaid && transaction.orderItems.length > 0) {
      await prisma.orderItem.updateMany({
        where: { transactionId: transaction.id },
        data: { isPaid: true }
      })
      updatedCount += transaction.orderItems.length
    }
  }

  console.log(`Migration complete. Updated ${updatedCount} order items.`)
  console.log(`Total transactions: ${transactions.length}`)
}

migratePaymentStatus()
  .catch(console.error)
  .finally(() => process.exit())
