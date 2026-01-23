import React, { useState } from 'react'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomerCard } from './CustomerCard'
import { CustomerForm } from './CustomerForm'
import type { Customer, CustomerFormData } from '@/types'

interface CustomerListProps {
  customers: Customer[]
  loading: boolean
  categoryId: string | null
  onCreateCustomer: (categoryId: string, data: CustomerFormData) => Promise<void>
  onUpdateCustomer: (id: string, data: Partial<CustomerFormData>) => Promise<void>
  onDeleteCustomer: (id: string) => Promise<void>
  onRefreshCustomers: () => void
}

export function CustomerList({
  customers,
  loading,
  categoryId,
  onCreateCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onRefreshCustomers,
}: CustomerListProps) {
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null)
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)

  const handleToggleExpand = (customerId: string) => {
    setExpandedCustomerId((prev) => (prev === customerId ? null : customerId))
  }

  const handleCreateCustomer = async (data: CustomerFormData) => {
    if (!categoryId) return
    await onCreateCustomer(categoryId, data)
  }

  if (!categoryId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Users className="h-16 w-16 mb-4 opacity-50" />
        <p className="text-lg">请选择一个分类查看客户</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          客户列表 ({customers.length})
        </h3>
        <Button onClick={() => setIsAddFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          添加客户
        </Button>
      </div>

      {/* Customer Cards */}
      {customers.length > 0 ? (
        <div className="space-y-4">
          {customers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              isExpanded={expandedCustomerId === customer.id}
              onToggleExpand={() => handleToggleExpand(customer.id)}
              onUpdateCustomer={onUpdateCustomer}
              onDeleteCustomer={onDeleteCustomer}
              onRefreshCustomers={onRefreshCustomers}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-4">该分类下暂无客户</p>
          <Button onClick={() => setIsAddFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            添加第一个客户
          </Button>
        </div>
      )}

      {/* Add Customer Form */}
      <CustomerForm
        isOpen={isAddFormOpen}
        onClose={() => setIsAddFormOpen(false)}
        onSubmit={handleCreateCustomer}
      />
    </div>
  )
}
