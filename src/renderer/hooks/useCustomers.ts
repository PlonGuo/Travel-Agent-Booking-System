import { useState, useCallback } from 'react'
import type { Customer, CustomerFormData } from '@/types'

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomers = useCallback(async (categoryId: string) => {
    try {
      console.log('Frontend: Fetching customers for category:', categoryId)
      setLoading(true)
      setError(null)
      const data = await window.api.customers.getByCategory(categoryId)
      console.log('Frontend: Received customers:', data)
      console.log('Frontend: Customers count:', data.length)
      setCustomers(data)
    } catch (err) {
      console.error('Frontend: Error fetching customers:', err)
      setError(err instanceof Error ? err.message : '加载客户失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const createCustomer = useCallback(async (categoryId: string, data: CustomerFormData) => {
    try {
      setError(null)
      const newCustomer = await window.api.customers.create({
        categoryId,
        ...data
      })
      setCustomers(prev => [...prev, newCustomer])
      return newCustomer
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建客户失败')
      throw err
    }
  }, [])

  const updateCustomer = useCallback(async (id: string, data: Partial<CustomerFormData>) => {
    try {
      setError(null)
      const updated = await window.api.customers.update(id, data)
      setCustomers(prev => prev.map(c => c.id === id ? updated : c))
      return updated
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新客户失败')
      throw err
    }
  }, [])

  const deleteCustomer = useCallback(async (id: string) => {
    try {
      setError(null)
      await window.api.customers.delete(id)
      setCustomers(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除客户失败')
      throw err
    }
  }, [])

  const clearCustomers = useCallback(() => {
    setCustomers([])
  }, [])

  return {
    customers,
    loading,
    error,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    clearCustomers
  }
}
