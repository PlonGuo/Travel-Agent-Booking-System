export interface ElectronAPI {
  categories: {
    getAll: () => Promise<any[]>
    create: (data: { name: string; order?: number }) => Promise<any>
    update: (id: string, data: { name?: string; order?: number }) => Promise<any>
    delete: (id: string) => Promise<any>
    reorder: (ids: string[]) => Promise<any[]>
  }
  customers: {
    getByCategory: (categoryId: string) => Promise<any[]>
    create: (data: {
      categoryId: string
      name: string
      source?: string
      invoiceCompany?: string
      comment?: string
    }) => Promise<any>
    update: (
      id: string,
      data: {
        name?: string
        source?: string
        invoiceCompany?: string
        comment?: string
      }
    ) => Promise<any>
    delete: (id: string) => Promise<any>
  }
  transactions: {
    getByCustomer: (customerId: string) => Promise<any[]>
    create: (data: {
      customerId: string
      totalAmount?: number
      profit?: number
      comment?: string
    }) => Promise<any>
    update: (
      id: string,
      data: {
        totalAmount?: number
        comment?: string
      }
    ) => Promise<any>
    delete: (id: string) => Promise<any>
  }
  orderItems: {
    create: (data: {
      transactionId: string
      type: string
      route: string
      ticketNumber?: string
      amount: number
      invoiceCompany?: string
      date?: string
      comment?: string
      isPaid?: boolean
    }) => Promise<any>
    update: (
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
    ) => Promise<any>
    delete: (id: string) => Promise<any>
    togglePayment: (id: string) => Promise<any>
  }
  search: {
    global: (
      query: string,
      filters?: {
        categoryId?: string
        month?: string
      }
    ) => Promise<any[]>
  }
  excel: {
    selectFile: () => Promise<string | null>
    detectMonth: (filePath: string) => Promise<string | null>
    import: (filePath: string, year: string, month: string) => Promise<{
      success: boolean
      categoriesCreated: number
      customersCreated: number
      transactionsCreated: number
      orderItemsCreated: number
      errors: string[]
    }>
    export: () => Promise<string | null>
  }
  reconciliation: {
    getAvailableMonths: () => Promise<string[]>
    getCompanies: (month: string) => Promise<string[]>
    getOrderItems: (month: string, invoiceCompany: string) => Promise<{
      id: string
      type: string
      route: string
      ticketNumber: string | null
      amount: number
      date: string | null
      comment: string | null
      customerName: string
      isPaid: boolean
    }[]>
    export: (month: string, invoiceCompany: string) => Promise<string | null>
  }
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
