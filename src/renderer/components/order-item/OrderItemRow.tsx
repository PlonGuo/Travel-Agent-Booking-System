import React, { useState } from 'react'
import { Pencil, Trash2, MessageSquare, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CommentPopover } from '@/components/comment/CommentPopover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { OrderItem, OrderItemFormData } from '@/types'

const ORDER_TYPES = [
  { value: 'flight', label: '机票' },
  { value: 'hotel', label: '酒店' },
  { value: 'insurance', label: '保险' },
  { value: 'other', label: '其他' },
]

interface OrderItemRowProps {
  orderItem: OrderItem
  onUpdate: (id: string, data: Partial<OrderItemFormData>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function OrderItemRow({ orderItem, onUpdate, onDelete }: OrderItemRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editData, setEditData] = useState({
    type: orderItem.type,
    route: orderItem.route,
    ticketNumber: orderItem.ticketNumber || '',
    amount: orderItem.amount,
  })

  const handleSave = async () => {
    await onUpdate(orderItem.id, editData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditData({
      type: orderItem.type,
      route: orderItem.route,
      ticketNumber: orderItem.ticketNumber || '',
      amount: orderItem.amount,
    })
    setIsEditing(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(orderItem.id)
      setIsDeleteDialogOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCommentSave = async (comment: string) => {
    await onUpdate(orderItem.id, { comment })
  }

  const getTypeLabel = (type: string) => {
    return ORDER_TYPES.find(t => t.value === type)?.label || type
  }

  if (isEditing) {
    return (
      <tr className="border-b">
        <td className="py-2 px-2">
          <Select
            value={editData.type}
            onValueChange={(value) => setEditData({ ...editData, type: value })}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>
        <td className="py-2 px-2">
          <Input
            value={editData.route}
            onChange={(e) => setEditData({ ...editData, route: e.target.value })}
            className="h-8"
            placeholder="行程"
          />
        </td>
        <td className="py-2 px-2">
          <Input
            value={editData.ticketNumber}
            onChange={(e) => setEditData({ ...editData, ticketNumber: e.target.value })}
            className="h-8"
            placeholder="票号"
          />
        </td>
        <td className="py-2 px-2">
          <Input
            type="number"
            value={editData.amount}
            onChange={(e) => setEditData({ ...editData, amount: parseFloat(e.target.value) || 0 })}
            className="h-8 text-right"
          />
        </td>
        <td className="py-2 px-2"></td>
        <td className="py-2 px-2">
          <div className="flex items-center justify-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSave}>
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancel}>
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <>
      <tr className="border-b hover:bg-muted/30 transition-colors">
        <td className="py-2 px-2">
          <span className={`text-xs px-2 py-1 rounded ${
            orderItem.type === 'flight' ? 'bg-blue-100 text-blue-700' :
            orderItem.type === 'hotel' ? 'bg-green-100 text-green-700' :
            orderItem.type === 'insurance' ? 'bg-purple-100 text-purple-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {getTypeLabel(orderItem.type)}
          </span>
        </td>
        <td className="py-2 px-2 font-medium">{orderItem.route}</td>
        <td className="py-2 px-2 text-muted-foreground">{orderItem.ticketNumber || '-'}</td>
        <td className="py-2 px-2 text-right font-medium">¥{orderItem.amount.toLocaleString()}</td>
        <td className="py-2 px-2 text-center">
          <CommentPopover
            comment={orderItem.comment}
            onSave={handleCommentSave}
          />
        </td>
        <td className="py-2 px-2">
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </td>
      </tr>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除项目</DialogTitle>
            <DialogDescription>
              确定要删除 "{orderItem.route}" 吗？此操作无法恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
