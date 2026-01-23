import { getPrismaClient } from '../database'

export const categoryService = {
  // Get all categories ordered by order field
  async getAll() {
    const prisma = getPrismaClient()
    return await prisma.category.findMany({
      orderBy: {
        order: 'asc'
      }
    })
  },

  // Create new category
  async create(data: { name: string; order?: number }) {
    const prisma = getPrismaClient()
    const maxOrder = await prisma.category.aggregate({
      _max: {
        order: true
      }
    })

    return await prisma.category.create({
      data: {
        name: data.name,
        order: data.order ?? (maxOrder._max.order ?? 0) + 1
      }
    })
  },

  // Update category
  async update(id: string, data: { name?: string; order?: number }) {
    const prisma = getPrismaClient()
    return await prisma.category.update({
      where: { id },
      data
    })
  },

  // Delete category (cascade deletes customers)
  async delete(id: string) {
    const prisma = getPrismaClient()
    return await prisma.category.delete({
      where: { id }
    })
  },

  // Reorder categories
  async reorder(ids: string[]) {
    const prisma = getPrismaClient()
    // Use transaction to update all orders atomically
    const updates = ids.map((id, index) =>
      prisma.category.update({
        where: { id },
        data: { order: index }
      })
    )

    return await prisma.$transaction(updates)
  }
}
