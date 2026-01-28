import { getPrismaClient } from '../database'

export const reconciliationService = {
  // Get unique invoice companies for a given month
  async getInvoiceCompanies(month: string): Promise<string[]> {
    const prisma = getPrismaClient()

    const items = await prisma.orderItem.findMany({
      where: {
        invoiceCompany: { not: null },
        transaction: { month }
      },
      select: { invoiceCompany: true },
      distinct: ['invoiceCompany']
    })

    return items
      .map((item) => item.invoiceCompany)
      .filter((company): company is string => company !== null)
      .sort()
  },

  // Get order items by company and month with customer info
  async getOrderItemsByCompany(month: string, invoiceCompany: string) {
    const prisma = getPrismaClient()

    const items = await prisma.orderItem.findMany({
      where: {
        invoiceCompany,
        transaction: { month }
      },
      include: {
        transaction: {
          include: {
            customer: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Transform to include customer name at top level
    return items.map((item) => ({
      id: item.id,
      type: item.type,
      route: item.route,
      ticketNumber: item.ticketNumber,
      amount: item.amount,
      date: item.date,
      comment: item.comment,
      customerName: item.transaction.customer.name
    }))
  }
}
