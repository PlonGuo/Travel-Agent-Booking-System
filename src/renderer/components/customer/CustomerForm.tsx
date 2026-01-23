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
import type { Customer, CustomerFormData } from '@/types'

interface CustomerFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CustomerFormData) => Promise<void>
  customer?: Customer
}

export function CustomerForm({ isOpen, onClose, onSubmit, customer }: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    source: '',
    invoiceCompany: '',
    comment: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        source: customer.source || '',
        invoiceCompany: customer.invoiceCompany || '',
        comment: customer.comment || '',
      })
    } else {
      setFormData({
        name: '',
        source: '',
        invoiceCompany: '',
        comment: '',
      })
    }
  }, [customer, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsLoading(true)
    try {
      await onSubmit(formData)
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{customer ? '编辑客户' : '添加客户'}</DialogTitle>
          <DialogDescription>
            {customer ? '修改客户信息' : '创建一个新的客户记录'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                客户名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入客户名称"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">客户来源</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="例如：军分区"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceCompany">开票公司</Label>
              <Input
                id="invoiceCompany"
                value={formData.invoiceCompany}
                onChange={(e) => setFormData({ ...formData, invoiceCompany: e.target.value })}
                placeholder="请输入开票公司名称"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">备注</Label>
              <Textarea
                id="comment"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="请输入备注信息..."
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name.trim()}>
              {isLoading ? '保存中...' : customer ? '保存' : '添加客户'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
