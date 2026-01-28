import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Plus, HelpCircle, ChevronDown, Pencil, Trash2, X, Upload, Download, Home, Calculator } from 'lucide-react'
import { useCategories, useCustomers, useSearch } from '@/hooks'
import { CustomerForm } from '@/components/customer/CustomerForm'
import { CustomerCard } from '@/components/customer/CustomerCard'
import { ImportDialog } from '@/components/excel/ImportDialog'
import { ReconciliationPage } from '@/components/reconciliation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Category, CustomerFormData, SearchResult } from '@/types'

// Avatar colors for customers
const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-cyan-100 text-cyan-700',
]

function getAvatarColor(name: string) {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'reconciliation'>('home')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null)
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false)
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false)
  const [searchFilterType, setSearchFilterType] = useState<'all' | 'pending'>('all')
  const [selectedSearchCategoryId, setSelectedSearchCategoryId] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const {
    categories,
    loading: categoriesLoading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories()

  const {
    customers,
    loading: customersLoading,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    clearCustomers,
  } = useCustomers()

  const {
    query,
    results,
    loading: searchLoading,
    debouncedSearch,
    clearSearch,
  } = useSearch()

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-select first category when categories load
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id)
    }
  }, [categories, selectedCategoryId])

  // Fetch customers when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      fetchCustomers(selectedCategoryId)
      // Reset expanded customer when switching categories
      setExpandedCustomerId(null)
    } else {
      clearCustomers()
    }
  }, [selectedCategoryId, fetchCustomers, clearCustomers])

  const handleRefreshCustomers = useCallback(() => {
    if (selectedCategoryId) {
      fetchCustomers(selectedCategoryId)
    }
  }, [selectedCategoryId, fetchCustomers])

  const handleCreateCustomer = async (data: CustomerFormData) => {
    if (!selectedCategoryId) return
    await createCustomer(selectedCategoryId, data)
    setIsCustomerFormOpen(false)
  }

  const handleCategorySubmit = async () => {
    if (!categoryName.trim()) return
    if (editingCategory) {
      await updateCategory(editingCategory.id, categoryName)
    } else {
      const newCategory = await createCategory(categoryName)
      setSelectedCategoryId(newCategory.id)
    }
    setCategoryName('')
    setEditingCategory(null)
    setIsCategoryFormOpen(false)
  }

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id)
    if (selectedCategoryId === id) {
      const remaining = categories.filter(c => c.id !== id)
      setSelectedCategoryId(remaining.length > 0 ? remaining[0].id : null)
    }
  }

  const handleExport = async () => {
    try {
      const filePath = await window.api.excel.export()
      if (filePath) {
        alert(`导出成功!\n文件保存至: ${filePath}`)
      }
    } catch (error) {
      alert(`导出失败: ${error}`)
    }
  }

  const handleImportComplete = useCallback(async () => {
    // Refresh categories and customers after import
    await fetchCategories()
    if (selectedCategoryId) {
      await fetchCustomers(selectedCategoryId)
    }
  }, [fetchCategories, selectedCategoryId, fetchCustomers])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value)
    setIsSearchDropdownOpen(true)
  }

  const handleSearchResultClick = useCallback((result: SearchResult) => {
    // 切换到对应的分类
    if (result.categoryId) {
      setSelectedCategoryId(result.categoryId)
    }
    // 展开对应的客户
    if (result.customerId) {
      setExpandedCustomerId(result.customerId)
    }
    // 关闭搜索下拉菜单
    setIsSearchDropdownOpen(false)
    // 清空搜索
    clearSearch()
  }, [clearSearch])

  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery) return text
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <span key={i} className="bg-yellow-200 font-semibold">{part}</span>
      ) : part
    )
  }

  // Calculate stats
  const totalPending = customers.reduce((sum, c) => {
    const customerPending = c.transactions?.filter(t => !t.isPaid).reduce((s, t) => s + t.totalAmount, 0) || 0
    return sum + customerPending
  }, 0)

  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-[100] flex items-center justify-between border-b border-gray-200 bg-white/90 backdrop-blur-md px-8 py-3">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 text-primary">
            <div className="size-8">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor"></path>
              </svg>
            </div>
            <h1 className="text-[#111318] text-xl font-bold leading-tight tracking-tight">旅游财务核算系统</h1>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'home'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Home className="h-4 w-4" />
              首页
            </button>
            <button
              onClick={() => setActiveTab('reconciliation')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'reconciliation'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calculator className="h-4 w-4" />
              对账
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            导入
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            导出
          </Button>
        </div>
      </header>

      {/* Main Content - Conditional Rendering */}
      {activeTab === 'reconciliation' ? (
        <ReconciliationPage />
      ) : (
      <main className="w-full max-w-6xl mx-auto px-6 py-12 relative">
        {/* Search Section */}
        <div className="mb-16 relative">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">欢迎回来，今天想查找什么？</h2>
              <p className="text-gray-500 text-lg">快速检索客户名称、行程或票号</p>
            </div>
            <div className="relative" ref={searchContainerRef}>
              <div className="relative flex w-full items-stretch rounded-2xl h-16 bg-white shadow-xl shadow-primary/5 border-2 border-primary ring-8 ring-primary/5 z-[70]">
                <div className="text-primary flex items-center justify-center pl-6">
                  <Search className="h-6 w-6" />
                </div>
                <input
                  className="flex w-full flex-1 border-none bg-transparent focus:ring-0 focus:outline-none text-lg font-medium text-[#111318] placeholder:text-gray-400 px-4"
                  placeholder="输入客户姓名、行程或票号..."
                  value={query}
                  onChange={handleSearchChange}
                  onFocus={() => query && setIsSearchDropdownOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      // 搜索已经通过 onChange 的 debouncedSearch 自动触发
                      // Enter 键只需要确保下拉菜单显示
                      if (query) setIsSearchDropdownOpen(true)
                    }
                  }}
                />
                {query && (
                  <button
                    onClick={() => {
                      clearSearch()
                      setIsSearchDropdownOpen(false)
                      setSearchFilterType('all')
                      setSelectedSearchCategoryId(null)
                      setDateRange({ start: '', end: '' })
                    }}
                    className="flex items-center justify-center px-3 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
                <div className="flex items-center justify-center pr-4">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      // 搜索已经通过 onChange 的 debouncedSearch 自动触发
                      // 点击按钮只需要确保下拉菜单显示
                      if (query) setIsSearchDropdownOpen(true)
                    }}
                    className="bg-primary text-white px-8 py-2.5 rounded-xl text-base font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-primary/30"
                  >
                    搜索
                  </button>
                </div>
              </div>

              {/* Search Dropdown */}
              {isSearchDropdownOpen && query && (
                <div className="absolute top-[calc(100%+0.75rem)] left-0 right-0 bg-white rounded-3xl border border-gray-200 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] z-[80] overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-top-4 duration-300">
                  {/* Filters Section */}
                  <div className="p-6 border-b border-gray-100 space-y-6">
                    {/* Category Filters */}
                    <div className="space-y-3">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Search className="h-3.5 w-3.5" /> 分类筛选
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setSearchFilterType('all')
                            setSelectedSearchCategoryId(null)
                            debouncedSearch(query, {})
                          }}
                          className={`px-4 py-1.5 text-sm font-bold rounded-full border transition-all cursor-pointer ${
                            searchFilterType === 'all' && !selectedSearchCategoryId
                              ? 'bg-primary/10 text-primary border-primary/20'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                          }`}
                        >
                          全部结果
                        </button>
                        {categories.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => {
                              setSearchFilterType('all')
                              setSelectedSearchCategoryId(cat.id)
                              debouncedSearch(query, { categoryId: cat.id })
                            }}
                            className={`px-4 py-1.5 text-sm font-medium rounded-full border transition-all cursor-pointer ${
                              selectedSearchCategoryId === cat.id
                                ? 'bg-primary/10 text-primary border-primary/20 font-bold'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                            }`}
                          >
                            {cat.name}
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            setSearchFilterType('pending')
                            setSelectedSearchCategoryId(null)
                            debouncedSearch(query, { isPaid: false })
                          }}
                          className={`px-4 py-1.5 text-sm font-medium rounded-full border transition-all cursor-pointer ${
                            searchFilterType === 'pending'
                              ? 'bg-red-50 text-red-600 border-red-200 font-bold'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600'
                          }`}
                        >
                          有欠款客户
                        </button>
                      </div>
                    </div>

                    {/* Time Range Filter */}
                    <div className="space-y-3">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <ChevronDown className="h-3.5 w-3.5" /> 时间范围
                      </p>
                      <div className="flex items-center gap-3 bg-slate-50 border border-gray-200 px-4 py-2 rounded-xl hover:border-primary transition-colors">
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 leading-none">起始日期</span>
                          <input
                            type="month"
                            value={dateRange.start}
                            onChange={(e) => {
                              const newStart = e.target.value
                              setDateRange(prev => ({ ...prev, start: newStart }))
                              debouncedSearch(query, { startDate: newStart, endDate: dateRange.end })
                            }}
                            className="text-sm font-medium text-gray-700 bg-transparent border-none p-0 focus:outline-none focus:ring-0"
                          />
                        </div>
                        <span className="mx-2 text-gray-300">—</span>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 leading-none">结束日期</span>
                          <input
                            type="month"
                            value={dateRange.end}
                            onChange={(e) => {
                              const newEnd = e.target.value
                              setDateRange(prev => ({ ...prev, end: newEnd }))
                              debouncedSearch(query, { startDate: dateRange.start, endDate: newEnd })
                            }}
                            className="text-sm font-medium text-gray-700 bg-transparent border-none p-0 focus:outline-none focus:ring-0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Results Section */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {searchLoading ? (
                      <div className="p-8 text-center text-gray-500">搜索中...</div>
                    ) : results.length > 0 ? (
                      <>
                        <div className="px-4 py-3 text-xs font-bold text-gray-400 flex items-center justify-between">
                          <span>搜索结果 ({results.length})</span>
                          <span className="text-[10px] font-normal cursor-pointer hover:text-primary transition-colors">
                            输入关键词检索更多
                          </span>
                        </div>
                        {results.map((result, index) => (
                          <div
                            key={`${result.type}-${result.id}-${index}`}
                            onClick={() => handleSearchResultClick(result)}
                            className="flex items-center justify-between p-4 hover:bg-blue-50/80 cursor-pointer rounded-2xl transition-all group border border-transparent hover:border-blue-100"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`size-12 rounded-full flex items-center justify-center font-bold text-lg ${
                                result.type === 'customer' ? getAvatarColor(result.text) :
                                result.type === 'route' ? 'bg-green-100 text-green-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {result.text.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-900 text-base">
                                    {highlightText(result.text, query)}
                                  </span>
                                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                                    result.type === 'customer' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                    result.type === 'route' ? 'bg-green-50 text-green-600 border-green-100' :
                                    'bg-purple-50 text-purple-600 border-purple-100'
                                  }`}>
                                    {result.type === 'customer' ? '客户' : result.type === 'route' ? '行程' : '票号'}
                                  </span>
                                </div>
                                {result.type === 'customer' && result.customerSource && (
                                  <p className="text-xs text-gray-500 mt-0.5">{result.customerSource}</p>
                                )}
                                {result.customer && result.type !== 'customer' && (
                                  <p className="text-xs text-gray-500 mt-0.5">客户: {result.customer}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              {result.type === 'customer' && result.balance !== undefined && (
                                <>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase">当前待结算</p>
                                  <p className={`text-lg font-bold ${result.balance > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                    ¥ {result.balance.toLocaleString()}
                                  </p>
                                </>
                              )}
                              {result.type !== 'customer' && (
                                <p className="text-xs text-gray-400">{result.category}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="p-8 text-center text-gray-500">未找到相关结果</div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                    <button className="text-sm font-bold text-primary hover:underline flex items-center justify-center gap-1 mx-auto py-1 group">
                      查看全部相关搜索结果
                      <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-x-1 rotate-[-90deg]" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-10 overflow-x-auto">
          <div className="flex items-center gap-3 pb-4">
            {categories.map(cat => (
              <div key={cat.id} className="relative group">
                <button
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-6 py-2.5 rounded-full text-base font-bold whitespace-nowrap transition-all ${
                    selectedCategoryId === cat.id
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary"
                  }`}
                >
                  {cat.name}
                </button>
                {/* Category actions on hover */}
                <div className="absolute -right-1 -top-1 hidden group-hover:flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingCategory(cat)
                      setCategoryName(cat.name)
                      setIsCategoryFormOpen(true)
                    }}
                    className="size-5 rounded-full bg-white shadow border flex items-center justify-center hover:bg-gray-50"
                  >
                    <Pencil className="h-3 w-3 text-gray-500" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`确定要删除分类 "${cat.name}" 吗？`)) {
                        handleDeleteCategory(cat.id)
                      }
                    }}
                    className="size-5 rounded-full bg-white shadow border flex items-center justify-center hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => {
                setEditingCategory(null)
                setCategoryName('')
                setIsCategoryFormOpen(true)
              }}
              className="px-6 py-2.5 rounded-full text-base font-medium whitespace-nowrap bg-white text-gray-600 border border-dashed border-gray-300 hover:border-primary hover:text-primary transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              添加分类
            </button>
          </div>
        </div>

        {/* Customer List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
              <Search className="h-6 w-6 text-primary" />
              当前客户 ({customers.length})
            </h3>
          </div>

          {customersLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : customers.length > 0 ? (
            customers.map(customer => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                isExpanded={expandedCustomerId === customer.id}
                onToggleExpand={() => setExpandedCustomerId(prev => prev === customer.id ? null : customer.id)}
                onUpdateCustomer={updateCustomer}
                onDeleteCustomer={deleteCustomer}
                onRefreshCustomers={handleRefreshCustomers}
              />
            ))
          ) : selectedCategoryId ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="size-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">该分类下暂无客户</p>
              <button
                onClick={() => setIsCustomerFormOpen(true)}
                className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
              >
                添加第一个客户
              </button>
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-500">请先选择或创建一个分类</p>
            </div>
          )}
        </div>
      </main>
      )}

      {/* FABs - Only show on home tab */}
      {activeTab === 'home' && (
      <div className="fixed bottom-10 right-10 flex flex-col gap-4 z-[90]">
        <button className="size-14 rounded-full bg-white shadow-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary transition-all group relative">
          <HelpCircle className="h-6 w-6" />
          <span className="absolute right-full mr-4 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            使用帮助
          </span>
        </button>
        <button
          onClick={() => setIsCustomerFormOpen(true)}
          disabled={!selectedCategoryId}
          className="size-16 rounded-full bg-primary shadow-2xl shadow-primary/40 flex items-center justify-center text-white hover:scale-105 hover:bg-blue-700 active:scale-95 transition-all group relative disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-8 w-8" />
          <span className="absolute right-full mr-4 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            新增客户
          </span>
        </button>
      </div>
      )}

      {/* Add/Edit Customer Modal */}
      <CustomerForm
        isOpen={isCustomerFormOpen}
        onClose={() => setIsCustomerFormOpen(false)}
        onSubmit={handleCreateCustomer}
      />

      {/* Category Form Dialog */}
      <Dialog open={isCategoryFormOpen} onOpenChange={setIsCategoryFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? '编辑分类' : '添加分类'}</DialogTitle>
            <DialogDescription>
              {editingCategory ? '修改分类名称' : '创建一个新的客户分类'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="categoryName">分类名称</Label>
            <Input
              id="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="请输入分类名称"
              className="mt-2"
              onKeyDown={(e) => e.key === 'Enter' && handleCategorySubmit()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryFormOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCategorySubmit} disabled={!categoryName.trim()}>
              {editingCategory ? '保存' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <ImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImportComplete={handleImportComplete}
      />
    </div>
  )
}

export default App
