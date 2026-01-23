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
      month: string
      profit?: number
      isPaid?: boolean
      comment?: string
    }) => Promise<any>
    update: (
      id: string,
      data: {
        month?: string
        profit?: number
        isPaid?: boolean
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
      date?: string
      comment?: string
    }) => Promise<any>
    update: (
      id: string,
      data: {
        type?: string
        route?: string
        ticketNumber?: string
        amount?: number
        date?: string
        comment?: string
      }
    ) => Promise<any>
    delete: (id: string) => Promise<any>
  }
  search: {
    global: (
      query: string,
      filters?: {
        categoryId?: string
        month?: string
        isPaid?: boolean
      }
    ) => Promise<any[]>
  }
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
