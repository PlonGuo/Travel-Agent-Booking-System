import { getPrismaClient } from '../database'

export const transactionService = {
  // Get transactions by customer with order items
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
      orderBy: {
        createdAt: 'desc'
      }
    })
  },

  // Create transaction
  async create(data: {
    customerId: string
    totalAmount?: number
    profit?: number
    comment?: string
  }) {
    const prisma = getPrismaClient()
    return await prisma.transaction.create({
      data: {
        customerId: data.customerId,
        totalAmount: data.totalAmount ?? 0,
        profit: data.profit ?? 0,
        comment: data.comment
      },
      include: {
        orderItems: true
      }
    })
  },

  // Update transaction (totalAmount, comment)
  async update(
    id: string,
    data: {
      totalAmount?: number
      comment?: string
    }
  ) {
    const prisma = getPrismaClient()
    const updated = await prisma.transaction.update({
      where: { id },
      data
    })

    // Recalculate profit if totalAmount changed
    if (data.totalAmount !== undefined) {
      await this.recalculateProfit(id)
    }

    return updated
  },

  // Delete transaction (cascade deletes order items)
  async delete(id: string) {
    const prisma = getPrismaClient()
    return await prisma.transaction.delete({
      where: { id }
    })
  },

  // Recalculate profit for a transaction (profit = totalAmount - sum of order items)
  async recalculateProfit(transactionId: string) {
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

    const totalPayable = transaction.orderItems.reduce((sum, item) => sum + item.amount, 0)
    const profit = transaction.totalAmount - totalPayable

    return await prisma.transaction.update({
      where: { id: transactionId },
      data: { profit }
    })
  }
}
