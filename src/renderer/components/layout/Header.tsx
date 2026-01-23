import React, { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useSearch } from '@/hooks/useSearch'
import type { SearchResult, Category } from '@/types'

interface HeaderProps {
  categories: Category[]
  onResultClick?: (result: SearchResult) => void
}

export function Header({ categories, onResultClick }: HeaderProps) {
  const { query, results, loading, debouncedSearch, clearSearch, filters, updateFilters } = useSearch()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value)
    setIsDropdownOpen(true)
  }

  const handleResultClick = (result: SearchResult) => {
    setIsDropdownOpen(false)
    clearSearch()
    onResultClick?.(result)
  }

  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery) return text
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <span key={i} className="bg-yellow-200 font-semibold">{part}</span>
      ) : part
    )
  }

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b bg-white/95 backdrop-blur px-6 py-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-primary">
          <svg className="size-8" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor"></path>
          </svg>
          <h1 className="text-xl font-bold tracking-tight">旅游财务核算系统</h1>
        </div>
      </div>

      <div className="relative flex-1 max-w-xl mx-8" ref={containerRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={handleSearchChange}
            onFocus={() => query && setIsDropdownOpen(true)}
            placeholder="搜索客户、行程或票号..."
            className="pl-9 pr-9"
          />
          {query && (
            <button
              onClick={() => {
                clearSearch()
                setIsDropdownOpen(false)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {isDropdownOpen && query && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl border shadow-lg max-h-96 overflow-hidden z-50">
            {/* Filter chips */}
            <div className="p-3 border-b bg-muted/30">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateFilters({ categoryId: undefined })}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    !filters.categoryId
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white border hover:border-primary hover:text-primary'
                  }`}
                >
                  全部
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => updateFilters({ categoryId: cat.id })}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      filters.categoryId === cat.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-white border hover:border-primary hover:text-primary'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            <div className="overflow-y-auto max-h-72">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">搜索中...</div>
              ) : results.length > 0 ? (
                <div className="p-2">
                  {results.map((result, index) => (
                    <button
                      key={`${result.type}-${result.id}-${index}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full text-left p-3 hover:bg-muted rounded-lg transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              result.type === 'customer' ? 'bg-blue-100 text-blue-700' :
                              result.type === 'route' ? 'bg-green-100 text-green-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {result.type === 'customer' ? '客户' : result.type === 'route' ? '行程' : '票号'}
                            </span>
                            <span className="font-medium">
                              {highlightText(result.text, query)}
                            </span>
                          </div>
                          {result.customer && (
                            <p className="text-xs text-muted-foreground mt-1">
                              客户: {result.customer}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{result.category}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">未找到结果</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <span className="text-sm font-medium">旅游代理</span>
          <p className="text-xs text-muted-foreground">管理员</p>
        </div>
        <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
          管
        </div>
      </div>
    </header>
  )
}
