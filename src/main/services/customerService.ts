import { getPrismaClient } from '../database'

export const customerService = {
  // Get customers by category with aggregated stats
  async getByCategory(categoryId: string) {
    const prisma = getPrismaClient()
    const customers = await prisma.customer.findMany({
      where: { categoryId },
      include: {
        transactions: {
          include: {
            orderItems: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate stats for each customer
    return customers.map((customer) => {
      const totalAmount = customer.transactions.reduce((sum, t) => sum + t.totalAmount, 0)
      const profit = customer.transactions.reduce((sum, t) => sum + t.profit, 0)
      // Calculate pending from unpaid order items, not transactions
      const pending = customer.transactions.reduce(
        (sum, t) =>
          sum +
          (t.orderItems
            .filter((item) => !item.isPaid)
            .reduce((itemSum, item) => itemSum + item.amount, 0)),
        0
      )

      return {
        ...customer,
        stats: {
          totalAmount,
          profit,
          pending
        }
      }
    })
  },

  // Create customer
  async create(data: {
    categoryId: string
    name: string
    source?: string
    invoiceCompany?: string
    comment?: string
  }) {
    const prisma = getPrismaClient()
    return await prisma.customer.create({
      data
    })
  },

  // Update customer
  async update(
    id: string,
    data: {
      name?: string
      source?: string
      invoiceCompany?: string
      comment?: string
    }
  ) {
    const prisma = getPrismaClient()
    return await prisma.customer.update({
      where: { id },
      data
    })
  },

  // Delete customer (cascade deletes transactions)
  async delete(id: string) {
    const prisma = getPrismaClient()
    return await prisma.customer.delete({
      where: { id }
    })
  }
}
