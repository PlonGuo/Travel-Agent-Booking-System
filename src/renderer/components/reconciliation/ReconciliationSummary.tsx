import { Button } from '@/components/ui/button'
import { FileSpreadsheet, Loader2 } from 'lucide-react'

interface ReconciliationSummaryProps {
  totalAmount: number
  itemCount: number
  totalItems: number
  companyName: string
  month: string
  onExport: () => void
  exporting?: boolean
}

export function ReconciliationSummary({
  totalAmount,
  itemCount,
  totalItems,
  companyName,
  month,
  onExport,
  exporting
}: ReconciliationSummaryProps) {
  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-xl px-6 py-4 border border-gray-200">
      <div className="flex items-center gap-8">
        <div>
          <p className="text-sm text-gray-500">开票公司</p>
          <p className="text-lg font-semibold text-gray-900">{companyName}</p>
        </div>
        <div className="h-10 w-px bg-gray-200" />
        <div>
          <p className="text-sm text-gray-500">月份</p>
          <p className="text-lg font-medium text-gray-700">{month}</p>
        </div>
        <div className="h-10 w-px bg-gray-200" />
        <div>
          <p className="text-sm text-gray-500">订单数量</p>
          <p className="text-lg font-medium text-gray-700">{itemCount} / {totalItems} 笔</p>
        </div>
        <div className="h-10 w-px bg-gray-200" />
        <div>
          <p className="text-sm text-gray-500">未付合计</p>
          <p className="text-2xl font-bold text-red-600">
            ¥{totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <Button
        onClick={onExport}
        disabled={exporting}
        className="px-6 py-3 text-base shadow-md"
      >
        {exporting ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            导出中...
          </>
        ) : (
          <>
            <FileSpreadsheet className="h-5 w-5 mr-2" />
            导出Excel
          </>
        )}
      </Button>
    </div>
  )
}
