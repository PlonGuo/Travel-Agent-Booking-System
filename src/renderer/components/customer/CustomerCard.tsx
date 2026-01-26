import React, { useState, useEffect } from 'react'
import { ChevronDown, Pencil, Trash2, Plus, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TransactionCard } from '@/components/transaction/TransactionCard'
import { TransactionForm } from '@/components/transaction/TransactionForm'
import { CustomerForm } from './CustomerForm'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTransactions } from '@/hooks/useTransactions'
import type { Customer, CustomerFormData, TransactionFormData, OrderItemFormData } from '@/types'

// Avatar colors for customers
const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-cyan-100 text-cyan-700',
]

function getAvatarColor(name: string) {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

interface CustomerCardProps {
  customer: Customer
  isExpanded: boolean
  onToggleExpand: () => void
  onUpdateCustomer: (id: string, data: Partial<CustomerFormData>) => Promise<void>
  onDeleteCustomer: (id: string) => Promise<void>
  onRefreshCustomers: () => void
}

export function CustomerCard({
  customer,
  isExpanded,
  onToggleExpand,
  onUpdateCustomer,
  onDeleteCustomer,
  onRefreshCustomers,
}: CustomerCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    transactions,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createOrderItem,
    updateOrderItem,
    deleteOrderItem,
  } = useTransactions()

  useEffect(() => {
    if (isExpanded) {
      fetchTransactions(customer.id)
    }
  }, [isExpanded, customer.id, fetchTransactions])

  const handleUpdateCustomer = async (data: CustomerFormData) => {
    await onUpdateCustomer(customer.id, data)
  }

  const handleDeleteCustomer = async () => {
    setIsDeleting(true)
    try {
      await onDeleteCustomer(customer.id)
      setIsDeleteDialogOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCreateTransaction = async (data: TransactionFormData) => {
    await createTransaction(customer.id, data)
    onRefreshCustomers()
  }

  const handleUpdateTransaction = async (id: string, data: Partial<TransactionFormData>) => {
    await updateTransaction(id, data)
    onRefreshCustomers()
  }

  const handleDeleteTransaction = async (id: string) => {
    await deleteTransaction(id)
    onRefreshCustomers()
  }

  const handleCreateOrderItem = async (transactionId: string, data: OrderItemFormData) => {
    await createOrderItem(transactionId, data)
    onRefreshCustomers()
  }

  const handleUpdateOrderItem = async (id: string, data: Partial<OrderItemFormData>) => {
    await updateOrderItem(id, data, customer.id)
    onRefreshCustomers()
  }

  const handleDeleteOrderItem = async (id: string) => {
    await deleteOrderItem(id, customer.id)
    onRefreshCustomers()
  }

  // Calculate stats: use local transactions data if expanded, otherwise use customer.stats
  const stats = isExpanded && transactions.length > 0 ? {
    totalAmount: transactions.reduce((sum, t) => sum + t.totalAmount, 0),
    profit: transactions.reduce((sum, t) => sum + t.profit, 0),
    pending: transactions.filter(t => !t.isPaid).reduce((sum, t) => sum + t.totalAmount, 0),
  } : (customer.stats || {
    totalAmount: 0,
    profit: 0,
    pending: 0,
  })

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
        {/* Main Customer Row */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-6 flex-1">
            {/* Avatar */}
            <div className={`size-14 rounded-full ${getAvatarColor(customer.name)} flex items-center justify-center text-xl font-bold shadow-sm shrink-0`}>
              {customer.name.charAt(0)}
            </div>

            {/* Customer Info */}
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h4 className="text-xl font-bold text-gray-900">{customer.name}</h4>
                {customer.source && (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded border bg-gray-50 text-gray-500 border-gray-100">
                    {customer.source}
                  </span>
                )}
              </div>
              {customer.invoiceCompany && (
                <p className="text-sm text-gray-500 mt-1 font-medium">
                  开票公司: {customer.invoiceCompany}
                </p>
              )}
            </div>

            {/* Stats - More compact and subtle */}
            <div className="flex items-center gap-8 ml-auto mr-6">
              <div className="text-right">
                <p className="text-xs text-gray-400 font-medium mb-1">合计金额</p>
                <p className="text-lg font-bold text-gray-900">
                  ¥{stats.totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 font-medium mb-1">利润</p>
                <p className="text-lg font-bold text-green-500">
                  ¥{stats.profit.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 font-medium mb-1">待收</p>
                <p className={`text-lg font-bold ${stats.pending > 0 ? 'text-red-500' : 'text-gray-300'}`}>
                  ¥{stats.pending.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsEditDialogOpen(true)
              }}
              className="px-4 py-2 bg-gray-50 text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-white hover:border-primary hover:text-primary transition-all text-sm"
            >
              编辑
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsDeleteDialogOpen(true)
              }}
              className="px-4 py-2 bg-gray-50 text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all text-sm"
            >
              删除
            </button>
            <button
              onClick={onToggleExpand}
              className={`p-2 rounded-full transition-all hover:bg-primary/5 ${isExpanded ? 'text-primary bg-primary/5 rotate-180' : 'text-gray-400'}`}
            >
              <ChevronDown className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-6 pb-6 pt-2 bg-slate-50/50 border-t border-gray-100">
            {/* Add Transaction Button */}
            <div className="flex justify-between items-center py-4">
              <h5 className="font-bold text-gray-700">交易记录</h5>
              <button
                onClick={() => setIsTransactionFormOpen(true)}
                className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-primary/20 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                添加月份
              </button>
            </div>

            {/* Transactions */}
            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    customerId={customer.id}
                    onUpdateTransaction={handleUpdateTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    onCreateOrderItem={handleCreateOrderItem}
                    onUpdateOrderItem={handleUpdateOrderItem}
                    onDeleteOrderItem={handleDeleteOrderItem}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
                暂无交易记录，点击上方按钮添加
              </div>
            )}

            {/* Customer Comment */}
            {customer.comment && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                <div className="flex items-center gap-2 text-yellow-700 text-sm mb-1">
                  <MessageSquare className="h-4 w-4" />
                  <span className="font-bold">备注</span>
                </div>
                <p className="text-sm text-yellow-800">{customer.comment}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Customer Dialog */}
      <CustomerForm
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSubmit={handleUpdateCustomer}
        customer={customer}
      />

      {/* Delete Customer Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除客户</DialogTitle>
            <DialogDescription>
              确定要删除客户 "{customer.name}" 吗？该操作将同时删除所有交易记录，且无法恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteCustomer} disabled={isDeleting}>
              {isDeleting ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Transaction Dialog */}
      <TransactionForm
        isOpen={isTransactionFormOpen}
        onClose={() => setIsTransactionFormOpen(false)}
        onSubmit={handleCreateTransaction}
      />
    </>
  )
}
