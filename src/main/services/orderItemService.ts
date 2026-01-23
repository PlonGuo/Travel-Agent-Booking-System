import { getPrismaClient } from '../database'
import { transactionService } from './transactionService'

export const orderItemService = {
  // Create order item and update parent transaction totalAmount
  async create(data: {
    transactionId: string
    type: string
    route: string
    ticketNumber?: string
    amount: number
    date?: string
    comment?: string
  }) {
    const prisma = getPrismaClient()
    const orderItem = await prisma.orderItem.create({
      data
    })

    // Recalculate transaction total
    await transactionService.recalculateTotal(data.transactionId)

    return orderItem
  },

  // Update order item and recalculate transaction total
  async update(
    id: string,
    data: {
      type?: string
      route?: string
      ticketNumber?: string
      amount?: number
      date?: string
      comment?: string
    }
  ) {
    const prisma = getPrismaClient()
    const orderItem = await prisma.orderItem.update({
      where: { id },
      data
    })

    // Recalculate transaction total
    await transactionService.recalculateTotal(orderItem.transactionId)

    return orderItem
  },

  // Delete order item and recalculate transaction total
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

    // Recalculate transaction total
    await transactionService.recalculateTotal(orderItem.transactionId)

    return deleted
  }
}
