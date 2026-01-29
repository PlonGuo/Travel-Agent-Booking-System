// Data types matching Prisma schema

export interface Category {
  id: string
  name: string
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface Customer {
  id: string
  categoryId: string
  name: string
  source?: string
  invoiceCompany?: string
  comment?: string
  createdAt: Date
  updatedAt: Date
  stats?: {
    totalAmount: number
    profit: number
    pending: number
  }
  transactions?: Transaction[]
}

export interface Transaction {
  id: string
  customerId: string
  totalAmount: number
  profit: number
  comment?: string
  createdAt: Date
  updatedAt: Date
  orderItems?: OrderItem[]
}

export interface OrderItem {
  id: string
  transactionId: string
  type: string // flight/hotel/insurance/other
  route: string
  ticketNumber?: string
  amount: number
  invoiceCompany?: string // 开票公司
  date?: string
  comment?: string
  isPaid: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SearchResult {
  type: 'customer' | 'route' | 'ticket'
  id: string
  text: string
  highlight: string
  category: string
  categoryId: string
  customerId: string
  customer?: string
  customerSource?: string
  customerPhone?: string
  balance?: number
  orderItem?: OrderItem
}

export interface SearchFilters {
  categoryId?: string
  month?: string
  startDate?: string
  endDate?: string
}

// Form types
export interface CategoryFormData {
  name: string
}

export interface CustomerFormData {
  name: string
  comment?: string
}

export interface TransactionFormData {
  totalAmount: number
  comment?: string
}

export interface OrderItemFormData {
  type: string
  route: string
  ticketNumber?: string
  amount: number
  invoiceCompany?: string // 开票公司
  date?: string
  comment?: string
  isPaid?: boolean
}

// Reconciliation types
export interface ReconciliationOrderItem {
  id: string
  type: string
  route: string
  ticketNumber?: string
  amount: number
  date?: string
  comment?: string
  customerName: string
  isPaid: boolean
}
