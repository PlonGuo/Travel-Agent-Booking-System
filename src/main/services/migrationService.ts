import { app, dialog } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { getPrismaClient } from '../database'

// Current schema version - increment this when making schema changes
export const CURRENT_SCHEMA_VERSION = 2

// Migration definitions
export interface Migration {
  version: number
  name: string
  up: (prisma: any) => Promise<void>
}

// Define all migrations here
export const migrations: Migration[] = [
  {
    version: 1,
    name: 'Initial schema',
    up: async (prisma) => {
      // Initial schema - no migration needed
      console.log('Schema version 1: Initial schema')
    }
  },
  {
    version: 2,
    name: 'Move payment tracking to OrderItem level',
    up: async (prisma) => {
      console.log('Migrating to version 2: Moving isPaid from Transaction to OrderItem')

      // Check if OrderItem table has isPaid column
      try {
        // Try to query with isPaid - if it exists, no migration needed
        await prisma.orderItem.findFirst({ where: { isPaid: true } })
        console.log('OrderItem.isPaid already exists, skipping data migration')
      } catch (error) {
        // Column doesn't exist yet - this shouldn't happen if schema is pushed
        console.log('OrderItem.isPaid does not exist - schema needs to be pushed first')
        throw new Error('Schema not synchronized. Please run prisma db push first.')
      }

      // Note: The actual schema change (adding isPaid to OrderItem) is handled by prisma db push
      // This migration just ensures data consistency
      console.log('Migration to version 2 completed')
    }
  }
]

/**
 * Get the database file path
 */
export function getDatabasePath(): string {
  if (process.env.NODE_ENV === 'development') {
    return path.join(process.cwd(), 'prisma', 'data.db')
  }
  return path.join(app.getPath('userData'), 'data.db')
}

/**
 * Get current schema version from database
 */
export async function getCurrentVersion(): Promise<number> {
  const prisma = getPrismaClient()

  try {
    // Check if SchemaVersion table exists
    const version = await prisma.schemaVersion.findFirst({
      orderBy: { version: 'desc' }
    })

    return version?.version ?? 0
  } catch (error) {
    // Table doesn't exist yet - this is version 0 (needs initialization)
    console.log('SchemaVersion table does not exist, treating as version 0')
    return 0
  }
}

/**
 * Check if database needs migration
 */
export async function needsMigration(): Promise<boolean> {
  const currentVersion = await getCurrentVersion()
  return currentVersion < CURRENT_SCHEMA_VERSION
}

/**
 * Backup database file
 */
export async function backupDatabase(): Promise<string> {
  const dbPath = getDatabasePath()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = `${dbPath}.backup-${timestamp}`

  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, backupPath)
    console.log(`Database backed up to: ${backupPath}`)
  } else {
    console.log('No database file found, skipping backup')
  }

  return backupPath
}

/**
 * Restore database from backup
 */
export async function restoreDatabase(backupPath: string): Promise<void> {
  const dbPath = getDatabasePath()

  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, dbPath)
    console.log(`Database restored from: ${backupPath}`)
  } else {
    throw new Error(`Backup file not found: ${backupPath}`)
  }
}

/**
 * Delete backup file
 */
export function deleteBackup(backupPath: string): void {
  if (fs.existsSync(backupPath)) {
    fs.unlinkSync(backupPath)
    console.log(`Backup deleted: ${backupPath}`)
  }
}

/**
 * Run migrations to bring database to current version
 */
export async function runMigrations(): Promise<{ success: boolean; error?: string }> {
  const prisma = getPrismaClient()
  let backupPath: string | null = null

  try {
    // Backup database before migration
    backupPath = await backupDatabase()

    // Get current version
    const currentVersion = await getCurrentVersion()
    console.log(`Current schema version: ${currentVersion}`)
    console.log(`Target schema version: ${CURRENT_SCHEMA_VERSION}`)

    // If version 0, we need to initialize the schema first
    if (currentVersion === 0) {
      console.log('Initializing schema version tracking...')

      // Create SchemaVersion record for version 1 (initial schema)
      try {
        await prisma.schemaVersion.create({
          data: {
            version: 1,
            name: 'Initial schema',
            appliedAt: new Date()
          }
        })
        console.log('Schema version 1 recorded')
      } catch (error) {
        console.log('Could not create SchemaVersion record - table may not exist yet')
      }
    }

    // Run all pending migrations
    const pendingMigrations = migrations.filter((m) => m.version > currentVersion)

    for (const migration of pendingMigrations) {
      console.log(`Running migration ${migration.version}: ${migration.name}`)

      try {
        // Run the migration
        await migration.up(prisma)

        // Record the migration
        await prisma.schemaVersion.create({
          data: {
            version: migration.version,
            name: migration.name,
            appliedAt: new Date()
          }
        })

        console.log(`Migration ${migration.version} completed successfully`)
      } catch (error) {
        console.error(`Migration ${migration.version} failed:`, error)
        throw error
      }
    }

    // Clean up backup after successful migration
    if (backupPath) {
      deleteBackup(backupPath)
    }

    return { success: true }
  } catch (error) {
    console.error('Migration failed:', error)

    // Restore from backup
    if (backupPath && fs.existsSync(backupPath)) {
      try {
        await restoreDatabase(backupPath)
        console.log('Database restored from backup after migration failure')
      } catch (restoreError) {
        console.error('Failed to restore backup:', restoreError)
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

/**
 * Delete database and start fresh
 */
export async function resetDatabase(): Promise<void> {
  const dbPath = getDatabasePath()

  if (fs.existsSync(dbPath)) {
    try {
      // Close Prisma connection before deleting database
      const { closePrismaClient } = await import('../database')
      await closePrismaClient()
      console.log('Prisma connection closed')

      // Wait a bit for file handles to be released (especially important on Windows)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Delete database file
      fs.unlinkSync(dbPath)
      console.log('Database deleted')

      // Delete journal file if exists
      const journalPath = `${dbPath}-journal`
      if (fs.existsSync(journalPath)) {
        fs.unlinkSync(journalPath)
        console.log('Database journal deleted')
      }

      // Delete WAL file if exists (Write-Ahead Logging)
      const walPath = `${dbPath}-wal`
      if (fs.existsSync(walPath)) {
        fs.unlinkSync(walPath)
        console.log('Database WAL deleted')
      }

      // Delete SHM file if exists (Shared Memory)
      const shmPath = `${dbPath}-shm`
      if (fs.existsSync(shmPath)) {
        fs.unlinkSync(shmPath)
        console.log('Database SHM deleted')
      }
    } catch (error) {
      console.error('Error deleting database:', error)
      throw new Error(`无法删除数据库文件：${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

/**
 * Show migration dialog to user and handle their choice
 */
export async function showMigrationDialog(): Promise<'migrate' | 'reset' | 'cancel'> {
  const currentVersion = await getCurrentVersion()

  // For first-time migration (version 0 or 1 to 2), show special warning
  if (currentVersion < 2) {
    const result = await dialog.showMessageBox({
      type: 'warning',
      title: '重要：数据库升级',
      message: '检测到数据库需要升级',
      detail:
        '⚠️ 重要提示：此次升级需要重置数据库\n\n' +
        '建议操作步骤：\n' +
        '1. 点击"取消"退出应用\n' +
        '2. 启动旧版本应用\n' +
        '3. 使用"导出"功能保存所有数据\n' +
        '4. 重新启动新版本应用\n' +
        '5. 选择"重置数据库"（推荐）\n' +
        '6. 使用"导入"功能恢复数据\n\n' +
        '如果您已经导出数据，可以选择"重置数据库"继续。\n' +
        '如果您的数据不重要，也可以直接重置。',
      buttons: ['重置数据库', '取消（返回导出数据）'],
      defaultId: 1,
      cancelId: 1
    })

    switch (result.response) {
      case 0:
        return 'reset'
      default:
        return 'cancel'
    }
  }

  // For future migrations, show standard dialog with upgrade option
  const result = await dialog.showMessageBox({
    type: 'warning',
    title: '数据库升级',
    message: '检测到数据库需要升级',
    detail:
      '当前应用版本包含数据库结构更新。\n\n' +
      '• 升级：保留现有数据并更新数据库结构（推荐）\n' +
      '• 重置：删除所有数据并创建新数据库\n' +
      '• 取消：退出应用',
    buttons: ['升级（推荐）', '重置数据库', '取消'],
    defaultId: 0,
    cancelId: 2
  })

  switch (result.response) {
    case 0:
      return 'migrate'
    case 1:
      return 'reset'
    default:
      return 'cancel'
  }
}

/**
 * Handle migration on app startup
 */
export async function handleMigrationOnStartup(): Promise<boolean> {
  try {
    // Check if migration is needed
    const needsUpdate = await needsMigration()

    if (!needsUpdate) {
      console.log('Database is up to date, no migration needed')
      return true
    }

    console.log('Database migration required')

    // Show dialog to user
    const choice = await showMigrationDialog()

    switch (choice) {
      case 'migrate': {
        // Run migrations
        const result = await runMigrations()

        if (result.success) {
          await dialog.showMessageBox({
            type: 'info',
            title: '升级成功',
            message: '数据库升级完成',
            detail: '您的数据已成功升级到最新版本。',
            buttons: ['确定']
          })
          return true
        } else {
          await dialog.showMessageBox({
            type: 'error',
            title: '升级失败',
            message: '数据库升级失败',
            detail: `错误信息：${result.error}\n\n数据库已恢复到升级前的状态。`,
            buttons: ['确定']
          })
          return false
        }
      }

      case 'reset': {
        // Confirm reset
        const confirmResult = await dialog.showMessageBox({
          type: 'warning',
          title: '确认重置',
          message: '确定要删除所有数据吗？',
          detail: '此操作无法撤销，所有客户、订单数据将被永久删除。',
          buttons: ['确定删除', '取消'],
          defaultId: 1,
          cancelId: 1
        })

        if (confirmResult.response === 0) {
          try {
            await resetDatabase()

            // Reinitialize Prisma with new database
            const { getPrismaClient } = await import('../database')
            getPrismaClient()
            console.log('Prisma client reinitialized with new database')

            await dialog.showMessageBox({
              type: 'info',
              title: '重置完成',
              message: '数据库已重置',
              detail: '应用将使用全新的数据库启动。',
              buttons: ['确定']
            })
            return true
          } catch (error) {
            await dialog.showMessageBox({
              type: 'error',
              title: '重置失败',
              message: '数据库重置失败',
              detail: error instanceof Error ? error.message : String(error),
              buttons: ['确定']
            })
            return false
          }
        }
        return false
      }

      case 'cancel':
      default:
        return false
    }
  } catch (error) {
    console.error('Migration handling failed:', error)
    await dialog.showMessageBox({
      type: 'error',
      title: '错误',
      message: '数据库迁移检查失败',
      detail: error instanceof Error ? error.message : String(error),
      buttons: ['确定']
    })
    return false
  }
}
