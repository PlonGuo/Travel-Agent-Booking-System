import React, { useState } from 'react'
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Category } from '@/types'

interface CategoryTabsProps {
  categories: Category[]
  activeCategory: string | null
  onCategorySelect: (categoryId: string) => void
  onCreateCategory: (name: string) => Promise<void>
  onUpdateCategory: (id: string, name: string) => Promise<void>
  onDeleteCategory: (id: string) => Promise<void>
}

export function CategoryTabs({
  categories,
  activeCategory,
  onCategorySelect,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}: CategoryTabsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleAddCategory = async () => {
    if (!categoryName.trim()) return
    setIsLoading(true)
    try {
      await onCreateCategory(categoryName.trim())
      setCategoryName('')
      setIsAddDialogOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditCategory = async () => {
    if (!selectedCategory || !categoryName.trim()) return
    setIsLoading(true)
    try {
      await onUpdateCategory(selectedCategory.id, categoryName.trim())
      setCategoryName('')
      setSelectedCategory(null)
      setIsEditDialogOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return
    setIsLoading(true)
    try {
      await onDeleteCategory(selectedCategory.id)
      setSelectedCategory(null)
      setIsDeleteDialogOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category)
    setCategoryName(category.name)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category)
    setIsDeleteDialogOpen(true)
  }

  return (
    <>
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center">
            <button
              onClick={() => onCategorySelect(category.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === category.id
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-white text-muted-foreground border hover:border-primary hover:text-primary'
              }`}
            >
              {category.name}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 -ml-2 text-muted-foreground hover:text-foreground opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => openEditDialog(category)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  重命名
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => openDeleteDialog(category)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setCategoryName('')
            setIsAddDialogOpen(true)
          }}
          className="rounded-full whitespace-nowrap"
        >
          <Plus className="h-4 w-4 mr-1" />
          添加分类
        </Button>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加分类</DialogTitle>
            <DialogDescription>创建一个新的客户分类</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="categoryName">分类名称</Label>
            <Input
              id="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="请输入分类名称"
              className="mt-2"
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddCategory} disabled={isLoading || !categoryName.trim()}>
              {isLoading ? '添加中...' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名分类</DialogTitle>
            <DialogDescription>修改分类名称</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="editCategoryName">分类名称</Label>
            <Input
              id="editCategoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="请输入新的分类名称"
              className="mt-2"
              onKeyDown={(e) => e.key === 'Enter' && handleEditCategory()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditCategory} disabled={isLoading || !categoryName.trim()}>
              {isLoading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除分类</DialogTitle>
            <DialogDescription>
              确定要删除分类 "{selectedCategory?.name}" 吗？该操作将同时删除分类下的所有客户数据，且无法恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory} disabled={isLoading}>
              {isLoading ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
