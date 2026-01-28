import { useState, useEffect, useCallback } from 'react'
import { Calculator } from 'lucide-react'
import { useReconciliation } from '@/hooks'
import { MonthSelector } from './MonthSelector'
import { CompanyButtons } from './CompanyButtons'
import { ReconciliationTable } from './ReconciliationTable'
import { ReconciliationSummary } from './ReconciliationSummary'

export function ReconciliationPage() {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const {
    companies,
    orderItems,
    loadingCompanies,
    loadingItems,
    fetchCompanies,
    fetchOrderItems,
    exportToExcel,
    clearOrderItems
  } = useReconciliation()

  // Format month string as YYYY-MM
  const monthString = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`

  // Fetch companies when month changes
  useEffect(() => {
    fetchCompanies(monthString)
    setSelectedCompany(null)
    clearOrderItems()
  }, [monthString, fetchCompanies, clearOrderItems])

  // Fetch order items when company is selected
  useEffect(() => {
    if (selectedCompany) {
      fetchOrderItems(monthString, selectedCompany)
    }
  }, [selectedCompany, monthString, fetchOrderItems])

  const handleExport = useCallback(async () => {
    if (!selectedCompany) return

    setExporting(true)
    try {
      await exportToExcel(monthString, selectedCompany)
    } finally {
      setExporting(false)
    }
  }, [monthString, selectedCompany, exportToExcel])

  const totalAmount = orderItems.reduce((sum, item) => sum + item.amount, 0)

  return (
    <main className="w-full max-w-6xl mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Calculator className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">对账管理</h1>
          <p className="text-sm text-gray-500">按开票公司查看和导出订单明细</p>
        </div>
      </div>

      {/* Month Selector */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <MonthSelector
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onYearChange={setSelectedYear}
          onMonthChange={setSelectedMonth}
        />
      </div>

      {/* Company Buttons */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <CompanyButtons
          companies={companies}
          selectedCompany={selectedCompany}
          onSelect={setSelectedCompany}
          loading={loadingCompanies}
        />
      </div>

      {/* Order Items Table */}
      {selectedCompany && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedCompany} - 订单明细
            </h3>
          </div>
          <ReconciliationTable orderItems={orderItems} loading={loadingItems} />
        </div>
      )}

      {/* Summary and Export */}
      {selectedCompany && orderItems.length > 0 && (
        <ReconciliationSummary
          totalAmount={totalAmount}
          itemCount={orderItems.length}
          companyName={selectedCompany}
          month={monthString}
          onExport={handleExport}
          exporting={exporting}
        />
      )}
    </main>
  )
}
