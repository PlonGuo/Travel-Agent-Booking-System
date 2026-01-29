import { useState, useCallback } from 'react'
import type { ReconciliationOrderItem } from '@/types'

export function useReconciliation() {
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [companies, setCompanies] = useState<string[]>([])
  const [orderItems, setOrderItems] = useState<ReconciliationOrderItem[]>([])
  const [loadingMonths, setLoadingMonths] = useState(false)
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [loadingItems, setLoadingItems] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAvailableMonths = useCallback(async () => {
    try {
      setLoadingMonths(true)
      setError(null)
      const data = await window.api.reconciliation.getAvailableMonths()
      setAvailableMonths(data)
    } catch (err) {
      console.error('Error fetching available months:', err)
      setError(err instanceof Error ? err.message : '加载可用月份失败')
      setAvailableMonths([])
    } finally {
      setLoadingMonths(false)
    }
  }, [])

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
      setOrderItems(data as ReconciliationOrderItem[])
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
    availableMonths,
    companies,
    orderItems,
    loadingMonths,
    loadingCompanies,
    loadingItems,
    error,
    fetchAvailableMonths,
    fetchCompanies,
    fetchOrderItems,
    exportToExcel,
    clearOrderItems
  }
}
