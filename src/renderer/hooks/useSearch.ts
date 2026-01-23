import { useState, useCallback, useRef, useEffect } from 'react'
import type { SearchResult, SearchFilters } from '@/types'

export function useSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<SearchFilters>({})
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const search = useCallback(async (searchQuery: string, searchFilters?: SearchFilters) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await window.api.search.global(searchQuery, searchFilters || filters)
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败')
    } finally {
      setLoading(false)
    }
  }, [filters])

  const debouncedSearch = useCallback((searchQuery: string, searchFilters?: SearchFilters) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    setQuery(searchQuery)

    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    debounceRef.current = setTimeout(() => {
      search(searchQuery, searchFilters)
    }, 300)
  }, [search])

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return {
    query,
    results,
    loading,
    error,
    filters,
    search,
    debouncedSearch,
    updateFilters,
    clearFilters,
    clearSearch
  }
}
