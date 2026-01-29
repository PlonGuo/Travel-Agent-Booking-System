import { useState } from 'react'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TransactionForm } from './TransactionForm'
import { OrderItemRow } from '@/components/order-item/OrderItemRow'
import { OrderItemForm } from '@/components/order-item/OrderItemForm'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Transaction, TransactionFormData, OrderItemFormData } from '@/types'

interface TransactionCardProps {
  transaction: Transaction
  customerId: string
  onUpdateTransaction: (id: string, data: Partial<TransactionFormData>) => Promise<void>
  onDeleteTransaction: (id: string) => Promise<void>
  onCreateOrderItem: (transactionId: string, data: OrderItemFormData) => Promise<void>
  onUpdateOrderItem: (id: string, data: Partial<OrderItemFormData>) => Promise<void>
  onDeleteOrderItem: (id: string) => Promise<void>
}

export function TransactionCard({
  transaction,
  customerId: _customerId,
  onUpdateTransaction,
  onDeleteTransaction,
  onCreateOrderItem,
  onUpdateOrderItem,
  onDeleteOrderItem,
}: TransactionCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isAddingOrderItem, setIsAddingOrderItem] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleUpdateTransaction = async (data: TransactionFormData) => {
    await onUpdateTransaction(transaction.id, data)
  }

  const handleDeleteTransaction = async () => {
    setIsDeleting(true)
    try {
      await onDeleteTransaction(transaction.id)
      setIsDeleteDialogOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCreateOrderItem = async (data: OrderItemFormData) => {
    await onCreateOrderItem(transaction.id, data)
    setIsAddingOrderItem(false)
  }

  // Calculate total payable amount from all order items
  const totalPayable = transaction.orderItems?.reduce((sum, item) => sum + item.amount, 0) || 0

  return (
    <>
      <div className="bg-white rounded-xl border overflow-hidden">
        {/* Transaction Header */}
        <div className="bg-blue-50 px-4 py-3 flex items-center justify-between border-b border-blue-100">
          <div className="flex items-center gap-4 ml-auto">
            <div className="text-right">
              <span className="text-sm text-muted-foreground mr-2">总应付:</span>
              <span className="font-bold text-lg text-orange-600">¥{totalPayable.toLocaleString()}</span>
            </div>
            <div className="text-right">
              <span className="text-sm text-muted-foreground mr-2">合计:</span>
              <span className="font-bold text-lg">¥{transaction.totalAmount.toLocaleString()}</span>
            </div>
            <div className="text-right">
              <span className="text-sm text-muted-foreground mr-2">利润:</span>
              <span className="font-bold text-lg text-green-600">¥{transaction.profit.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Order Items Table */}
        <div className="p-4">
          {(transaction.orderItems && transaction.orderItems.length > 0) || isAddingOrderItem ? (
            <table className="w-full">
              <thead>
                <tr className="text-xs text-muted-foreground border-b">
                  <th className="text-left py-2 px-2 w-20">类型</th>
                  <th className="text-left py-2 px-2">行程</th>
                  <th className="text-left py-2 px-2 w-32">票号</th>
                  <th className="text-right py-2 px-2 w-24">应付</th>
                  <th className="text-left py-2 px-2 w-24">开票公司</th>
                  <th className="text-center py-2 px-2 w-16">付款</th>
                  <th className="text-center py-2 px-2 w-20">备注</th>
                  <th className="text-center py-2 px-2 w-20">操作</th>
                </tr>
              </thead>
              <tbody>
                {transaction.orderItems?.map((item) => (
                  <OrderItemRow
                    key={item.id}
                    orderItem={item}
                    onUpdate={onUpdateOrderItem}
                    onDelete={onDeleteOrderItem}
                  />
                ))}
                {isAddingOrderItem && (
                  <OrderItemForm
                    onSubmit={handleCreateOrderItem}
                    onCancel={() => setIsAddingOrderItem(false)}
                  />
                )}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              暂无订单项目
            </div>
          )}

          {/* Add Order Item Button */}
          {!isAddingOrderItem && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => setIsAddingOrderItem(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              添加项目
            </Button>
          )}
        </div>

        {/* Comment */}
        {transaction.comment && (
          <div className="px-4 pb-4">
            <div className="p-2 bg-muted/50 rounded text-sm text-muted-foreground">
              备注: {transaction.comment}
            </div>
          </div>
        )}
      </div>

      {/* Edit Transaction Dialog */}
      <TransactionForm
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSubmit={handleUpdateTransaction}
        transaction={transaction}
      />

      {/* Delete Transaction Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除交易</DialogTitle>
            <DialogDescription>
              确定要删除此交易记录吗？该操作将同时删除所有订单项目，且无法恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteTransaction} disabled={isDeleting}>
              {isDeleting ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
