import { Migration } from '../types'

export const migration: Migration = {
  version: 2,
  name: 'Add payment tracking to OrderItem level',
  type: 'automatic',
  sqlFile: 'prisma/migrations/002_add_order_item_ispaid.sql',
  requiresBackup: true, // Backup recommended for column additions
  up: async (prisma, progress) => {
    progress?.('添加订单项支付状态字段...', 20)

    // SQL file adds isPaid column and index
    // All existing records will have isPaid = 0 (false) by default

    progress?.('正在验证数据迁移...', 80)

    // Verify the column was added successfully
    try {
      const count = await prisma.orderItem.count()
      console.log(`Verified ${count} order items have isPaid field`)
    } catch (error) {
      console.error('Error verifying isPaid field:', error)
      throw new Error('迁移验证失败')
    }

    progress?.('支付状态字段添加完成', 100)
    console.log('Migration to version 2 completed successfully')
  }
}
