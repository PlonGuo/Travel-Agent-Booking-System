import { getPrismaClient } from '../database'

interface SearchFilters {
  categoryId?: string
  month?: string
  isPaid?: boolean
  startDate?: string
  endDate?: string
}

export const searchService = {
  // Global search across customers, routes, ticket numbers
  async globalSearch(query: string, filters?: SearchFilters) {
    const prisma = getPrismaClient()
    const results: any[] = []

    // Build date filter for transactions
    const dateFilter: any = {}
    if (filters?.startDate || filters?.endDate) {
      if (filters.startDate) {
        dateFilter.gte = filters.startDate
      }
      if (filters.endDate) {
        dateFilter.lte = filters.endDate
      }
    }

    // Search customers by name
    const customers = await prisma.customer.findMany({
      where: {
        AND: [
          filters?.categoryId ? { categoryId: filters.categoryId } : {},
          {
            name: {
              contains: query
            }
          }
        ]
      },
      include: {
        category: true,
        transactions: {
          where: {
            AND: [
              filters?.month ? { month: filters.month } : {},
              filters?.isPaid !== undefined ? { isPaid: filters.isPaid } : {},
              (filters?.startDate || filters?.endDate) ? { month: dateFilter } : {}
            ]
          },
          include: {
            orderItems: true
          }
        }
      }
    })

    // Add customer results
    customers.forEach((customer) => {
      // Calculate pending balance
      const balance = customer.transactions
        .filter(t => !t.isPaid)
        .reduce((sum, t) => sum + t.totalAmount, 0)

      results.push({
        type: 'customer',
        id: customer.id,
        text: customer.name,
        highlight: customer.name,
        category: customer.category.name,
        categoryId: customer.categoryId,
        customerId: customer.id,
        customer: customer.name,
        customerSource: customer.source || '',
        balance: balance
      })
    })

    // Search order items by route
    const routeItems = await prisma.orderItem.findMany({
      where: {
        route: {
          contains: query
        }
      },
      include: {
        transaction: {
          include: {
            customer: {
              include: {
                category: true
              }
            }
          }
        }
      }
    })

    // Add route results
    routeItems.forEach((item) => {
      if (filters?.categoryId && item.transaction.customer.categoryId !== filters.categoryId) {
        return
      }
      if (filters?.month && item.transaction.month !== filters.month) {
        return
      }
      if (filters?.isPaid !== undefined && item.transaction.isPaid !== filters.isPaid) {
        return
      }
      if (filters?.startDate && item.transaction.month < filters.startDate) {
        return
      }
      if (filters?.endDate && item.transaction.month > filters.endDate) {
        return
      }

      results.push({
        type: 'route',
        id: item.id,
        text: item.route,
        highlight: item.route,
        category: item.transaction.customer.category.name,
        categoryId: item.transaction.customer.categoryId,
        customerId: item.transaction.customer.id,
        customer: item.transaction.customer.name,
        customerSource: item.transaction.customer.source || '',
        transactionMonth: item.transaction.month,
        orderItem: item
      })
    })

    // Search order items by ticket number
    if (query) {
      const ticketItems = await prisma.orderItem.findMany({
        where: {
          ticketNumber: {
            contains: query
          }
        },
        include: {
          transaction: {
            include: {
              customer: {
                include: {
                  category: true
                }
              }
            }
          }
        }
      })

      // Add ticket number results
      ticketItems.forEach((item) => {
        if (filters?.categoryId && item.transaction.customer.categoryId !== filters.categoryId) {
          return
        }
        if (filters?.month && item.transaction.month !== filters.month) {
          return
        }
        if (filters?.isPaid !== undefined && item.transaction.isPaid !== filters.isPaid) {
          return
        }
        if (filters?.startDate && item.transaction.month < filters.startDate) {
          return
        }
        if (filters?.endDate && item.transaction.month > filters.endDate) {
          return
        }

        results.push({
          type: 'ticket',
          id: item.id,
          text: item.ticketNumber || '',
          highlight: item.ticketNumber || '',
          category: item.transaction.customer.category.name,
          categoryId: item.transaction.customer.categoryId,
          customerId: item.transaction.customer.id,
          customer: item.transaction.customer.name,
          customerSource: item.transaction.customer.source || '',
          transactionMonth: item.transaction.month,
          orderItem: item
        })
      })
    }

    return results
  }
}
