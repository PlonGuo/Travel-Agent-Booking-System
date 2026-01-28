import { useState, useCallback } from 'react'
import type { ReconciliationOrderItem } from '@/types'

export function useReconciliation() {
  const [companies, setCompanies] = useState<string[]>([])
  const [orderItems, setOrderItems] = useState<ReconciliationOrderItem[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [loadingItems, setLoadingItems] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCompanies = useCallback(async (month: string) => {
    try {
      setLoadingCompanies(true)
      setError(null)
      const data = await window.api.reconciliation.getCompanies(month)
      setCompanies(data)
    } catch (err) {
      console.error('Error fetching companies:', err)
      setError(err instanceof Error ? err.message : '加载开票公司失败')
      setCompanies([])
    } finally {
      setLoadingCompanies(false)
    }
  }, [])

  const fetchOrderItems = useCallback(async (month: string, invoiceCompany: string) => {
    try {
      setLoadingItems(true)
      setError(null)
      const data = await window.api.reconciliation.getOrderItems(month, invoiceCompany)
      setOrderItems(data)
    } catch (err) {
      console.error('Error fetching order items:', err)
      setError(err instanceof Error ? err.message : '加载订单明细失败')
      setOrderItems([])
    } finally {
      setLoadingItems(false)
    }
  }, [])

  const exportToExcel = useCallback(async (month: string, invoiceCompany: string) => {
    try {
      setError(null)
      const filePath = await window.api.reconciliation.export(month, invoiceCompany)
      return filePath
    } catch (err) {
      console.error('Error exporting reconciliation:', err)
      setError(err instanceof Error ? err.message : '导出失败')
      throw err
    }
  }, [])

  const clearOrderItems = useCallback(() => {
    setOrderItems([])
  }, [])

  return {
    companies,
    orderItems,
    loadingCompanies,
    loadingItems,
    error,
    fetchCompanies,
    fetchOrderItems,
    exportToExcel,
    clearOrderItems
  }
}
