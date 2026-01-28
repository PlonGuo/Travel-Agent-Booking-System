import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // Categories
  categories: {
    getAll: () => ipcRenderer.invoke('categories:getAll'),
    create: (data: { name: string; order?: number }) =>
      ipcRenderer.invoke('categories:create', data),
    update: (id: string, data: { name?: string; order?: number }) =>
      ipcRenderer.invoke('categories:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('categories:delete', id),
    reorder: (ids: string[]) => ipcRenderer.invoke('categories:reorder', ids)
  },

  // Customers
  customers: {
    getByCategory: (categoryId: string) =>
      ipcRenderer.invoke('customers:getByCategory', categoryId),
    create: (data: {
      categoryId: string
      name: string
      source?: string
      invoiceCompany?: string
      comment?: string
    }) => ipcRenderer.invoke('customers:create', data),
    update: (
      id: string,
      data: {
        name?: string
        source?: string
        invoiceCompany?: string
        comment?: string
      }
    ) => ipcRenderer.invoke('customers:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('customers:delete', id)
  },

  // Transactions
  transactions: {
    getByCustomer: (customerId: string) =>
      ipcRenderer.invoke('transactions:getByCustomer', customerId),
    create: (data: {
      customerId: string
      month: string
      profit?: number
      isPaid?: boolean
      comment?: string
    }) => ipcRenderer.invoke('transactions:create', data),
    update: (
      id: string,
      data: {
        month?: string
        profit?: number
        isPaid?: boolean
        comment?: string
      }
    ) => ipcRenderer.invoke('transactions:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('transactions:delete', id)
  },

  // Order Items
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
    }) => ipcRenderer.invoke('orderItems:create', data),
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
      }
    ) => ipcRenderer.invoke('orderItems:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('orderItems:delete', id)
  },

  // Search
  search: {
    global: (
      query: string,
      filters?: {
        categoryId?: string
        month?: string
        isPaid?: boolean
      }
    ) => ipcRenderer.invoke('search:global', query, filters)
  },

  // Excel Import/Export
  excel: {
    selectFile: () => ipcRenderer.invoke('excel:selectFile'),
    detectMonth: (filePath: string) => ipcRenderer.invoke('excel:detectMonth', filePath),
    import: (filePath: string, year: string, month: string) =>
      ipcRenderer.invoke('excel:import', filePath, year, month),
    export: () => ipcRenderer.invoke('excel:export')
  },

  // Reconciliation
  reconciliation: {
    getCompanies: (month: string) => ipcRenderer.invoke('reconciliation:getCompanies', month),
    getOrderItems: (month: string, invoiceCompany: string) =>
      ipcRenderer.invoke('reconciliation:getOrderItems', month, invoiceCompany),
    export: (month: string, invoiceCompany: string) =>
      ipcRenderer.invoke('reconciliation:export', month, invoiceCompany)
  }
})
