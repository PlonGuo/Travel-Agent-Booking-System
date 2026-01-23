import { useState, useCallback } from 'react'
import type { Transaction, TransactionFormData, OrderItemFormData } from '@/types'

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async (customerId: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await window.api.transactions.getByCustomer(customerId)
      setTransactions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载交易记录失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const createTransaction = useCallback(async (customerId: string, data: TransactionFormData) => {
    try {
      setError(null)
      const newTransaction = await window.api.transactions.create({
        customerId,
        ...data
      })
      setTransactions(prev => [...prev, newTransaction])
      return newTransaction
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建交易记录失败')
      throw err
    }
  }, [])

  const updateTransaction = useCallback(async (id: string, data: Partial<TransactionFormData>) => {
    try {
      setError(null)
      const updated = await window.api.transactions.update(id, data)
      setTransactions(prev => prev.map(t => t.id === id ? updated : t))
      return updated
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新交易记录失败')
      throw err
    }
  }, [])

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      setError(null)
      await window.api.transactions.delete(id)
      setTransactions(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除交易记录失败')
      throw err
    }
  }, [])

  const clearTransactions = useCallback(() => {
    setTransactions([])
  }, [])

  // Order Item operations
  const createOrderItem = useCallback(async (transactionId: string, data: OrderItemFormData) => {
    try {
      setError(null)
      await window.api.orderItems.create({
        transactionId,
        ...data
      })
      // Refetch the transaction to get updated totals
      const txIndex = transactions.findIndex(t => t.id === transactionId)
      if (txIndex !== -1 && transactions[txIndex].customerId) {
        const customerId = transactions[txIndex].customerId
        const updatedTransactions = await window.api.transactions.getByCustomer(customerId)
        setTransactions(updatedTransactions)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建订单项目失败')
      throw err
    }
  }, [transactions])

  const updateOrderItem = useCallback(async (id: string, data: Partial<OrderItemFormData>, customerId: string) => {
    try {
      setError(null)
      await window.api.orderItems.update(id, data)
      // Refetch transactions to get updated totals
      const updatedTransactions = await window.api.transactions.getByCustomer(customerId)
      setTransactions(updatedTransactions)
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新订单项目失败')
      throw err
    }
  }, [])

  const deleteOrderItem = useCallback(async (id: string, customerId: string) => {
    try {
      setError(null)
      await window.api.orderItems.delete(id)
      // Refetch transactions to get updated totals
      const updatedTransactions = await window.api.transactions.getByCustomer(customerId)
      setTransactions(updatedTransactions)
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除订单项目失败')
      throw err
    }
  }, [])

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    clearTransactions,
    createOrderItem,
    updateOrderItem,
    deleteOrderItem
  }
}
