import { Migration } from '../types'

export const migration: Migration = {
  version: 1,
  name: 'Initial schema',
  type: 'automatic',
  sqlFile: 'prisma/migrations/001_initial.sql',
  requiresBackup: false,
  up: async (_prisma, progress) => {
    progress?.('创建初始数据库结构...', 10)

    // SQL file creates all tables, indexes, and records schema version
    // No additional data transformation needed
    console.log('Schema version 1: Initial schema created')

    progress?.('初始化完成', 100)
  }
}
