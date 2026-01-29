import { Plane, Hotel, Shield, Train, FileCheck, Package, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ReconciliationOrderItem } from '@/types'

interface ReconciliationTableProps {
  orderItems: ReconciliationOrderItem[]
  loading?: boolean
}

const ORDER_TYPE_ICONS: Record<string, React.ReactNode> = {
  flight: <Plane className="h-4 w-4 text-blue-500" />,
  hotel: <Hotel className="h-4 w-4 text-purple-500" />,
  insurance: <Shield className="h-4 w-4 text-green-500" />,
  train: <Train className="h-4 w-4 text-orange-500" />,
  visa: <FileCheck className="h-4 w-4 text-pink-500" />,
  other: <Package className="h-4 w-4 text-gray-500" />
}

const ORDER_TYPE_LABELS: Record<string, string> = {
  flight: '机票',
  hotel: '酒店',
  insurance: '保险',
  train: '火车',
  visa: '签证',
  other: '其他'
}

export function ReconciliationTable({ orderItems, loading }: ReconciliationTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">加载订单明细...</span>
      </div>
    )
  }

  if (orderItems.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-base">暂无订单数据</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">客户</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">类型</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">行程</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">票号</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">金额</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">日期</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">付款状态</th>
          </tr>
        </thead>
        <tbody>
          {orderItems.map((item) => (
            <tr
              key={item.id}
              className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                item.isPaid ? 'bg-gray-200' : ''
              }`}
            >
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.customerName}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {ORDER_TYPE_ICONS[item.type] || ORDER_TYPE_ICONS.other}
                  <span className="text-sm text-gray-600">
                    {ORDER_TYPE_LABELS[item.type] || '其他'}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">{item.route || '-'}</td>
              <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                {item.ticketNumber || '-'}
              </td>
              <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                ¥{item.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{item.date || '-'}</td>
              <td className="px-4 py-3 text-center">
                <Badge variant={item.isPaid ? 'success' : 'warning'} className="text-xs">
                  {item.isPaid ? '已付' : '未付'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
