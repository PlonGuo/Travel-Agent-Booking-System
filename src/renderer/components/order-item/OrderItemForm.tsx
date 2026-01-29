import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { OrderItemFormData } from '@/types'

const ORDER_TYPES = [
  { value: 'flight', label: '机票' },
  { value: 'hotel', label: '酒店' },
  { value: 'insurance', label: '保险' },
  { value: 'other', label: '其他' },
]

interface OrderItemFormProps {
  onSubmit: (data: OrderItemFormData) => Promise<void>
  onCancel: () => void
}

export function OrderItemForm({ onSubmit, onCancel }: OrderItemFormProps) {
  const [formData, setFormData] = useState<OrderItemFormData>({
    type: 'flight',
    route: '',
    ticketNumber: '',
    amount: 0,
    invoiceCompany: '',
    comment: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!formData.route.trim()) return

    setIsLoading(true)
    try {
      await onSubmit(formData)
      setFormData({
        type: 'flight',
        route: '',
        ticketNumber: '',
        amount: 0,
        invoiceCompany: '',
        comment: '',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <tr className="border-b bg-muted/30">
      <td className="py-2 px-2">
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value })}
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
          value={formData.route}
          onChange={(e) => setFormData({ ...formData, route: e.target.value })}
          className="h-8"
          placeholder="请输入行程"
          autoFocus
        />
      </td>
      <td className="py-2 px-2">
        <Input
          value={formData.ticketNumber}
          onChange={(e) => setFormData({ ...formData, ticketNumber: e.target.value })}
          className="h-8"
          placeholder="票号"
        />
      </td>
      <td className="py-2 px-2">
        <Input
          type="number"
          value={formData.amount || ''}
          onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
          className="h-8 text-right"
          placeholder="0"
        />
      </td>
      <td className="py-2 px-2">
        <Input
          value={formData.invoiceCompany || ''}
          onChange={(e) => setFormData({ ...formData, invoiceCompany: e.target.value })}
          className="h-8"
          placeholder="开票公司"
        />
      </td>
      <td className="py-2 px-2"></td>
      <td className="py-2 px-2">
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleSubmit}
            disabled={isLoading || !formData.route.trim()}
          >
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel}>
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </td>
    </tr>
  )
}
