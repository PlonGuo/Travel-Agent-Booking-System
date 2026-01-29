import { getPrismaClient } from '../database'
import { transactionService } from './transactionService'

export const orderItemService = {
  // Create order item and recalculate parent transaction profit
  async create(data: {
    transactionId: string
    type: string
    route: string
    ticketNumber?: string
    amount: number
    invoiceCompany?: string
    date?: string
    comment?: string
    isPaid?: boolean
  }) {
    const prisma = getPrismaClient()
    const orderItem = await prisma.orderItem.create({
      data: {
        ...data,
        isPaid: data.isPaid ?? false
      }
    })

    // Recalculate transaction profit
    await transactionService.recalculateProfit(data.transactionId)

    return orderItem
  },

  // Update order item and recalculate transaction profit
  async update(
    id: string,
    data: {
      type?: string
      route?: string
      ticketNumber?: string
      amount?: number
      invoiceCompany?: string
      date?: string
      comment?: string
      isPaid?: boolean
    }
  ) {
    const prisma = getPrismaClient()
    const orderItem = await prisma.orderItem.update({
      where: { id },
      data
    })

    // Recalculate transaction profit
    await transactionService.recalculateProfit(orderItem.transactionId)

    return orderItem
  },

  // Delete order item and recalculate transaction profit
  async delete(id: string) {
    const prisma = getPrismaClient()
    const orderItem = await prisma.orderItem.findUnique({
      where: { id }
    })

    if (!orderItem) {
      throw new Error('Order item not found')
    }

    const deleted = await prisma.orderItem.delete({
      where: { id }
    })

    // Recalculate transaction profit
    await transactionService.recalculateProfit(orderItem.transactionId)

    return deleted
  },

  // Toggle payment status for an order item
  async togglePaymentStatus(id: string) {
    const prisma = getPrismaClient()
    const orderItem = await prisma.orderItem.findUnique({
      where: { id }
    })

    if (!orderItem) {
      throw new Error('Order item not found')
    }

    return await prisma.orderItem.update({
      where: { id },
      data: { isPaid: !orderItem.isPaid }
    })
  }
}
