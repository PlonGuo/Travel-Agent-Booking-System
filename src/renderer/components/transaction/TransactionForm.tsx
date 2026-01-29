import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Transaction, TransactionFormData } from '@/types'

interface TransactionFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: TransactionFormData) => Promise<void>
  transaction?: Transaction
}

export function TransactionForm({ isOpen, onClose, onSubmit, transaction }: TransactionFormProps) {
  const [formData, setFormData] = useState<TransactionFormData>({
    totalAmount: 0,
    comment: '',
  })
  const [totalAmountInput, setTotalAmountInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (transaction) {
      setFormData({
        totalAmount: transaction.totalAmount,
        comment: transaction.comment || '',
      })
      setTotalAmountInput(transaction.totalAmount.toString())
    } else {
      setFormData({
        totalAmount: 0,
        comment: '',
      })
      setTotalAmountInput('')
    }
  }, [transaction, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsLoading(true)
    try {
      await onSubmit(formData)
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate profit for display (totalAmount - sum of order items)
  // For new transactions, profit equals totalAmount (no order items yet)
  const calculateProfit = () => {
    if (!transaction) {
      return formData.totalAmount
    }
    const totalPayable = transaction.orderItems?.reduce((sum, item) => sum + item.amount, 0) || 0
    return formData.totalAmount - totalPayable
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{transaction ? '编辑交易' : '添加交易'}</DialogTitle>
          <DialogDescription>
            {transaction ? '修改交易信息' : '创建一个新的交易记录'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Total Receivable (合计应收) */}
            <div className="space-y-2">
              <Label htmlFor="totalAmount">合计(应收)</Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                value={totalAmountInput}
                onChange={(e) => {
                  setTotalAmountInput(e.target.value)
                  setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })
                }}
                placeholder="请输入应收总额"
              />
            </div>

            {/* Profit Display (Read-only, calculated) */}
            <div className="space-y-2">
              <Label>利润（自动计算）</Label>
              <div className="flex h-10 w-full rounded-md border border-input bg-gray-50 px-3 py-2 text-sm">
                <span className="text-green-600 font-medium">¥{calculateProfit().toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500">
                {transaction ? '利润 = 合计(应收) - 总应付' : '添加订单项后将自动计算'}
              </p>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="comment">备注</Label>
              <Textarea
                id="comment"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="请输入备注信息..."
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '保存中...' : transaction ? '保存' : '添加'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
