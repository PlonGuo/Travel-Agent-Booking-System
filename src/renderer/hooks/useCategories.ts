import { useState, useCallback, useEffect } from 'react'
import type { Category } from '@/types'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    try {
      console.log('Frontend: Fetching categories...')
      setLoading(true)
      setError(null)
      const data = await window.api.categories.getAll()
      console.log('Frontend: Received categories:', data)
      console.log('Frontend: Categories count:', data.length)
      setCategories(data)
    } catch (err) {
      console.error('Frontend: Error fetching categories:', err)
      setError(err instanceof Error ? err.message : '加载分类失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const createCategory = useCallback(async (name: string) => {
    try {
      setError(null)
      const maxOrder = categories.length > 0
        ? Math.max(...categories.map(c => c.order)) + 1
        : 0
      const newCategory = await window.api.categories.create({ name, order: maxOrder })
      setCategories(prev => [...prev, newCategory])
      return newCategory
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建分类失败')
      throw err
    }
  }, [categories])

  const updateCategory = useCallback(async (id: string, name: string) => {
    try {
      setError(null)
      const updated = await window.api.categories.update(id, { name })
      setCategories(prev => prev.map(c => c.id === id ? updated : c))
      return updated
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新分类失败')
      throw err
    }
  }, [])

  const deleteCategory = useCallback(async (id: string) => {
    try {
      setError(null)
      await window.api.categories.delete(id)
      setCategories(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除分类失败')
      throw err
    }
  }, [])

  const reorderCategories = useCallback(async (ids: string[]) => {
    try {
      setError(null)
      const reordered = await window.api.categories.reorder(ids)
      setCategories(reordered)
    } catch (err) {
      setError(err instanceof Error ? err.message : '重新排序失败')
      throw err
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories
  }
}
