import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrderItemRow } from './OrderItemRow'
import type { OrderItem } from '@/types'

// Mock the window.api
global.window.api = {
  orderItems: {
    togglePayment: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    create: vi.fn()
  }
} as any

describe('OrderItemRow - Payment Status Feature', () => {
  const mockOrderItem: OrderItem = {
    id: '1',
    transactionId: 'trans-1',
    type: 'flight',
    route: 'NYC-LAX',
    ticketNumber: '123456',
    amount: 500,
    invoiceCompany: 'Test Company',
    date: '2024-01-15',
    comment: 'Test comment',
    isPaid: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockOnUpdate = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper to render OrderItemRow with proper table structure
  const renderOrderItemRow = (orderItem: OrderItem) => {
    return render(
      <table>
        <tbody>
          <OrderItemRow
            orderItem={orderItem}
            onUpdate={mockOnUpdate}
            onDelete={mockOnDelete}
          />
        </tbody>
      </table>
    )
  }

  describe('Payment Badge Display', () => {
    it('should display "未付" badge when order is unpaid', () => {
      renderOrderItemRow(mockOrderItem)

      const badge = screen.getByText('未付')
      expect(badge).toBeInTheDocument()
    })

    it('should display "已付" badge when order is paid', () => {
      const paidOrderItem = { ...mockOrderItem, isPaid: true }
      renderOrderItemRow(paidOrderItem)

      const badge = screen.getByText('已付')
      expect(badge).toBeInTheDocument()
    })

    it('should have cursor-pointer class on payment badge', () => {
      renderOrderItemRow(mockOrderItem)

      const badge = screen.getByText('未付')
      expect(badge).toHaveClass('cursor-pointer')
    })
  })

  describe('Payment Toggle Functionality', () => {
    it('should call togglePayment API when badge is clicked', async () => {
      const user = userEvent.setup()
      renderOrderItemRow(mockOrderItem)

      const badge = screen.getByText('未付')
      await user.click(badge)

      expect(window.api.orderItems.togglePayment).toHaveBeenCalledWith('1')
    })

    it('should call onUpdate with toggled isPaid value', async () => {
      const user = userEvent.setup()
      renderOrderItemRow(mockOrderItem)

      const badge = screen.getByText('未付')
      await user.click(badge)

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith('1', { isPaid: true })
      })
    })

    it('should toggle from paid to unpaid when clicked', async () => {
      const user = userEvent.setup()
      const paidOrderItem = { ...mockOrderItem, isPaid: true }
      renderOrderItemRow(paidOrderItem)

      const badge = screen.getByText('已付')
      await user.click(badge)

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith('1', { isPaid: false })
      })
    })
  })

  describe('Edit Mode - Payment Checkbox', () => {
    it('should show checkbox in edit mode', async () => {
      const user = userEvent.setup()
      renderOrderItemRow(mockOrderItem)

      // Find and click edit button by svg icon
      const buttons = screen.getAllByRole('button')
      const editButton = buttons.find(btn => btn.querySelector('svg.lucide-pencil'))
      expect(editButton).toBeDefined()
      await user.click(editButton!)

      // Should have a checkbox for payment status
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeInTheDocument()
    })

    it('should have checkbox unchecked for unpaid items in edit mode', async () => {
      const user = userEvent.setup()
      renderOrderItemRow(mockOrderItem)

      const buttons = screen.getAllByRole('button')
      const editButton = buttons.find(btn => btn.querySelector('svg.lucide-pencil'))
      await user.click(editButton!)

      const checkbox = screen.getByRole('checkbox') as HTMLInputElement
      expect(checkbox.checked).toBe(false)
    })

    it('should have checkbox checked for paid items in edit mode', async () => {
      const user = userEvent.setup()
      const paidOrderItem = { ...mockOrderItem, isPaid: true }
      renderOrderItemRow(paidOrderItem)

      const buttons = screen.getAllByRole('button')
      const editButton = buttons.find(btn => btn.querySelector('svg.lucide-pencil'))
      await user.click(editButton!)

      const checkbox = screen.getByRole('checkbox') as HTMLInputElement
      expect(checkbox.checked).toBe(true)
    })

    it('should toggle checkbox when clicked in edit mode', async () => {
      const user = userEvent.setup()
      renderOrderItemRow(mockOrderItem)

      const buttons = screen.getAllByRole('button')
      const editButton = buttons.find(btn => btn.querySelector('svg.lucide-pencil'))
      await user.click(editButton!)

      const checkbox = screen.getByRole('checkbox') as HTMLInputElement
      expect(checkbox.checked).toBe(false)

      await user.click(checkbox)
      expect(checkbox.checked).toBe(true)
    })

    it('should save isPaid value when save button is clicked', async () => {
      const user = userEvent.setup()
      renderOrderItemRow(mockOrderItem)

      // Enter edit mode
      const buttons = screen.getAllByRole('button')
      const editButton = buttons.find(btn => btn.querySelector('svg.lucide-pencil'))
      await user.click(editButton!)

      // Toggle checkbox
      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      // Click save button (with check icon)
      const saveButton = buttons.find(btn => btn.querySelector('svg.lucide-check'))
      await user.click(saveButton!)

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          '1',
          expect.objectContaining({ isPaid: true })
        )
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid toggle clicks', async () => {
      const user = userEvent.setup()
      renderOrderItemRow(mockOrderItem)

      const badge = screen.getByText('未付')

      // Click multiple times rapidly
      await user.click(badge)
      await user.click(badge)
      await user.click(badge)

      // All calls should be made
      expect(window.api.orderItems.togglePayment).toHaveBeenCalledTimes(3)
    })
  })
})
