import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TransactionCard } from './TransactionCard'
import type { Transaction } from '@/types'

describe('TransactionCard - Total Payable Calculation', () => {
  const mockTransaction: Transaction = {
    id: 'trans-1',
    customerId: 'cust-1',
    totalAmount: 10000,
    profit: 2000,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    orderItems: [],
  }

  const mockHandlers = {
    onUpdateTransaction: vi.fn(),
    onDeleteTransaction: vi.fn(),
    onCreateOrderItem: vi.fn(),
    onUpdateOrderItem: vi.fn(),
    onDeleteOrderItem: vi.fn(),
  }

  it('should calculate totalPayable as 0 when there are no order items', () => {
    render(
      <TransactionCard
        transaction={mockTransaction}
        customerId="cust-1"
        {...mockHandlers}
      />
    )

    expect(screen.getByText('总应付:')).toBeInTheDocument()
    expect(screen.getByText('¥0')).toBeInTheDocument()
  })

  it('should calculate totalPayable correctly with one order item', () => {
    const transactionWithOneItem: Transaction = {
      ...mockTransaction,
      orderItems: [
        {
          id: 'item-1',
          transactionId: 'trans-1',
          type: 'flight',
          route: 'Beijing - Shanghai',
          ticketNumber: '12345',
          amount: 1500,
          isPaid: false,          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ],
    }

    const { container } = render(
      <TransactionCard
        transaction={transactionWithOneItem}
        customerId="cust-1"
        {...mockHandlers}
      />
    )

    expect(screen.getByText('总应付:')).toBeInTheDocument()
    // Find the totalPayable element specifically (has text-orange-600 class)
    const totalPayableElement = container.querySelector('.text-orange-600')
    expect(totalPayableElement?.textContent).toBe('¥1,500')
  })

  it('should calculate totalPayable correctly with multiple order items', () => {
    const transactionWithMultipleItems: Transaction = {
      ...mockTransaction,
      orderItems: [
        {
          id: 'item-1',
          transactionId: 'trans-1',
          type: 'flight',
          route: 'Beijing - Shanghai',
          ticketNumber: '12345',
          amount: 1500,
          isPaid: false,          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'item-2',
          transactionId: 'trans-1',
          type: 'hotel',
          route: 'Shanghai Hotel',
          amount: 800,
          isPaid: false,          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
        {
          id: 'item-3',
          transactionId: 'trans-1',
          type: 'insurance',
          route: 'Travel Insurance',
          amount: 200,
          isPaid: false,          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-03'),
        },
      ],
    }

    render(
      <TransactionCard
        transaction={transactionWithMultipleItems}
        customerId="cust-1"
        {...mockHandlers}
      />
    )

    expect(screen.getByText('总应付:')).toBeInTheDocument()
    // Total: 1500 + 800 + 200 = 2500
    expect(screen.getByText('¥2,500')).toBeInTheDocument()
  })

  it('should handle decimal amounts correctly', () => {
    const transactionWithDecimals: Transaction = {
      ...mockTransaction,
      orderItems: [
        {
          id: 'item-1',
          transactionId: 'trans-1',
          type: 'flight',
          route: 'Test Route',
          amount: 1500.50,
          isPaid: false,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'item-2',
          transactionId: 'trans-1',
          type: 'hotel',
          route: 'Test Hotel',
          amount: 999.99,
          isPaid: false,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ],
    }

    render(
      <TransactionCard
        transaction={transactionWithDecimals}
        customerId="cust-1"
        {...mockHandlers}
      />
    )

    expect(screen.getByText('总应付:')).toBeInTheDocument()
    // Total: 1500.50 + 999.99 = 2500.49
    expect(screen.getByText('¥2,500.49')).toBeInTheDocument()
  })

})
