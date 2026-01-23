import React, { useState, useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Transaction, TransactionFormData } from '@/types'

interface TransactionFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: TransactionFormData) => Promise<void>
  transaction?: Transaction
}

const MONTHS = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
]

export function TransactionForm({ isOpen, onClose, onSubmit, transaction }: TransactionFormProps) {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const [formData, setFormData] = useState<TransactionFormData>({
    month: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
    profit: 0,
    isPaid: false,
    comment: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (transaction) {
      setFormData({
        month: transaction.month,
        profit: transaction.profit,
        isPaid: transaction.isPaid,
        comment: transaction.comment || '',
      })
    } else {
      setFormData({
        month: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
        profit: 0,
        isPaid: false,
        comment: '',
      })
    }
  }, [transaction, isOpen, currentMonth, currentYear])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.month) return

    setIsLoading(true)
    try {
      await onSubmit(formData)
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  // Generate year options (current year - 2 to current year + 1)
  const years = Array.from({ length: 4 }, (_, i) => currentYear - 2 + i)

  const selectedYear = formData.month ? parseInt(formData.month.split('-')[0]) : currentYear
  const selectedMonth = formData.month ? parseInt(formData.month.split('-')[1]) : currentMonth + 1

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{transaction ? '编辑月份' : '添加月份'}</DialogTitle>
          <DialogDescription>
            {transaction ? '修改交易信息' : '创建一个新的月份记录'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Month Selector */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>年份</Label>
                <Select
                  value={String(selectedYear)}
                  onValueChange={(value) => {
                    setFormData({
                      ...formData,
                      month: `${value}-${String(selectedMonth).padStart(2, '0')}`,
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择年份" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}年
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>月份</Label>
                <Select
                  value={String(selectedMonth)}
                  onValueChange={(value) => {
                    setFormData({
                      ...formData,
                      month: `${selectedYear}-${value.padStart(2, '0')}`,
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择月份" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month, index) => (
                      <SelectItem key={index} value={String(index + 1)}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Profit */}
            <div className="space-y-2">
              <Label htmlFor="profit">利润</Label>
              <Input
                id="profit"
                type="number"
                value={formData.profit}
                onChange={(e) => setFormData({ ...formData, profit: parseFloat(e.target.value) || 0 })}
                placeholder="请输入利润"
              />
            </div>

            {/* Payment Status */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPaid"
                checked={formData.isPaid}
                onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="isPaid" className="cursor-pointer">
                已付款
              </Label>
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
            <Button type="submit" disabled={isLoading || !formData.month}>
              {isLoading ? '保存中...' : transaction ? '保存' : '添加'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
