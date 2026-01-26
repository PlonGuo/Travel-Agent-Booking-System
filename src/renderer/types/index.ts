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
  month: string
  totalAmount: number
  profit: number
  isPaid: boolean
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
  date?: string
  comment?: string
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
  transactionMonth?: string
}

export interface SearchFilters {
  categoryId?: string
  month?: string
  isPaid?: boolean
  startDate?: string
  endDate?: string
}

// Form types
export interface CategoryFormData {
  name: string
}

export interface CustomerFormData {
  name: string
  source?: string
  invoiceCompany?: string
  comment?: string
}

export interface TransactionFormData {
  month: string
  profit: number
  isPaid: boolean
  comment?: string
}

export interface OrderItemFormData {
  type: string
  route: string
  ticketNumber?: string
  amount: number
  date?: string
  comment?: string
}
