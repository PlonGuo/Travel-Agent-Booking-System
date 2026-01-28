import { Button } from '@/components/ui/button'
import { Building2, Loader2 } from 'lucide-react'

interface CompanyButtonsProps {
  companies: string[]
  selectedCompany: string | null
  onSelect: (company: string) => void
  loading?: boolean
}

export function CompanyButtons({
  companies,
  selectedCompany,
  onSelect,
  loading
}: CompanyButtonsProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">加载开票公司...</span>
      </div>
    )
  }

  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <Building2 className="h-12 w-12 text-gray-300 mb-2" />
        <p className="text-base">该月份没有开票公司记录</p>
        <p className="text-sm text-gray-400">请选择其他月份或先添加订单</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-base font-medium text-gray-700">选择开票公司:</h3>
      <div className="flex flex-wrap gap-3">
        {companies.map((company) => (
          <Button
            key={company}
            variant={selectedCompany === company ? 'default' : 'outline'}
            onClick={() => onSelect(company)}
            className={`px-6 py-3 text-base transition-all ${
              selectedCompany === company
                ? 'bg-primary text-white shadow-md'
                : 'bg-white hover:bg-gray-50 border-gray-200'
            }`}
          >
            <Building2 className="h-4 w-4 mr-2" />
            {company}
          </Button>
        ))}
      </div>
    </div>
  )
}
