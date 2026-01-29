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
    availableMonths,
    companies,
    orderItems,
    loadingMonths,
    loadingCompanies,
    loadingItems,
    fetchAvailableMonths,
    fetchCompanies,
    fetchOrderItems,
    exportToExcel,
    clearOrderItems
  } = useReconciliation()

  // Format month string as YYYY-MM
  const monthString = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`

  // Fetch available months on mount
  useEffect(() => {
    fetchAvailableMonths()
  }, [fetchAvailableMonths])

  // Auto-select first available month if current selection doesn't exist
  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(monthString)) {
      const firstMonth = availableMonths[0]
      const [year, month] = firstMonth.split('-')
      setSelectedYear(parseInt(year))
      setSelectedMonth(parseInt(month))
    }
  }, [availableMonths, monthString])

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

  // Calculate total amount from unpaid items only
  const unpaidItems = orderItems.filter(item => !item.isPaid)
  const totalAmount = unpaidItems.reduce((sum, item) => sum + item.amount, 0)

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
          availableMonths={availableMonths}
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
          itemCount={unpaidItems.length}
          totalItems={orderItems.length}
          companyName={selectedCompany}
          month={monthString}
          onExport={handleExport}
          exporting={exporting}
        />
      )}
    </main>
  )
}
