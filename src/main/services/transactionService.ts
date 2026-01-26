import { getPrismaClient } from '../database'

export const transactionService = {
  // Get transactions by customer grouped by month with order items
  async getByCustomer(customerId: string) {
    const prisma = getPrismaClient()
    return await prisma.transaction.findMany({
      where: { customerId },
      include: {
        orderItems: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: [
        { month: 'desc' },
        { createdAt: 'desc' }
      ]
    })
  },

  // Create transaction
  async create(data: {
    customerId: string
    month: string
    profit?: number
    isPaid?: boolean
    comment?: string
  }) {
    const prisma = getPrismaClient()
    return await prisma.transaction.create({
      data: {
        customerId: data.customerId,
        month: data.month,
        profit: data.profit ?? 0,
        isPaid: data.isPaid ?? false,
        comment: data.comment,
        totalAmount: 0
      },
      include: {
        orderItems: true
      }
    })
  },

  // Update transaction (profit, paid status)
  async update(
    id: string,
    data: {
      month?: string
      profit?: number
      isPaid?: boolean
      comment?: string
    }
  ) {
    const prisma = getPrismaClient()
    return await prisma.transaction.update({
      where: { id },
      data
    })
  },

  // Delete transaction (cascade deletes order items)
  async delete(id: string) {
    const prisma = getPrismaClient()
    return await prisma.transaction.delete({
      where: { id }
    })
  },

  // Recalculate total amount for a transaction
  async recalculateTotal(transactionId: string) {
    const prisma = getPrismaClient()
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        orderItems: true
      }
    })

    if (!transaction) {
      throw new Error('Transaction not found')
    }

    const totalAmount = transaction.orderItems.reduce((sum, item) => sum + item.amount, 0)

    return await prisma.transaction.update({
      where: { id: transactionId },
      data: { totalAmount }
    })
  }
}
