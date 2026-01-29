import { app, dialog } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { getPrismaClient } from '../database'
import { migrations as registeredMigrations, Migration, ProgressCallback } from '../migrations'

// Current schema version - increment this when making schema changes
export const CURRENT_SCHEMA_VERSION = 2

// Re-export Migration type for compatibility
export type { Migration, ProgressCallback }

// Get migrations from the registry
const migrations = registeredMigrations

/**
 * Execute SQL from a migration file
 */
async function executeSqlMigration(sqlFile: string, prisma: any): Promise<void> {
  // Resolve path relative to project root
  let sqlPath: string

  if (app.isPackaged) {
    // In production, resolve from app resources
    sqlPath = path.join(process.resourcesPath, sqlFile)
  } else {
    // In development, resolve from project root
    sqlPath = path.join(__dirname, '../../..', sqlFile)
  }

  if (!fs.existsSync(sqlPath)) {
    throw new Error(`Migration SQL file not found: ${sqlPath}`)
  }

  console.log(`Executing SQL migration: ${sqlPath}`)

  const sql = fs.readFileSync(sqlPath, 'utf8')

  // Split SQL into individual statements (separated by semicolon)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--')) // Remove empty and comment-only statements

  // Execute each statement
  for (const statement of statements) {
    if (statement) {
      try {
        await prisma.$executeRawUnsafe(statement)
      } catch (error) {
        console.error(`Error executing SQL statement: ${statement.substring(0, 100)}...`)
        throw error
      }
    }
  }

  console.log(`SQL migration completed: ${path.basename(sqlPath)}`)
}

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
export async function runMigrations(
  progress?: ProgressCallback
): Promise<{ success: boolean; error?: string }> {
  const prisma = getPrismaClient()
  let backupPath: string | null = null

  try {
    progress?.('正在备份数据库...', 5)

    // Backup database before migration
    backupPath = await backupDatabase()

    // Get current version
    const currentVersion = await getCurrentVersion()
    console.log(`Current schema version: ${currentVersion}`)
    console.log(`Target schema version: ${CURRENT_SCHEMA_VERSION}`)

    progress?.('正在检查待执行的迁移...', 10)

    // Run all pending migrations
    const pendingMigrations = migrations.filter((m) => m.version > currentVersion)

    if (pendingMigrations.length === 0) {
      console.log('No pending migrations')
      if (backupPath) {
        deleteBackup(backupPath)
      }
      return { success: true }
    }

    console.log(`Found ${pendingMigrations.length} pending migrations`)

    for (let i = 0; i < pendingMigrations.length; i++) {
      const migration = pendingMigrations[i]
      const progressPercent = 10 + ((i / pendingMigrations.length) * 80)

      progress?.(`正在执行迁移 ${migration.version}: ${migration.name}...`, progressPercent)
      console.log(`Running migration ${migration.version}: ${migration.name}`)

      try {
        // Execute SQL file if specified
        if (migration.sqlFile) {
          await executeSqlMigration(migration.sqlFile, prisma)
        }

        // Run migration up function (for data transformations)
        await migration.up(prisma, progress)

        // Record the migration (if not already recorded by SQL)
        // Check if version already recorded to avoid duplicate entry
        const existingVersion = await prisma.schemaVersion.findUnique({
          where: { version: migration.version }
        })

        if (!existingVersion) {
          await prisma.schemaVersion.create({
            data: {
              version: migration.version,
              name: migration.name,
              appliedAt: new Date()
            }
          })
        }

        console.log(`Migration ${migration.version} completed successfully`)
      } catch (error) {
        console.error(`Migration ${migration.version} failed:`, error)
        throw error
      }
    }

    progress?.('正在清理备份文件...', 95)

    // Clean up backup after successful migration
    if (backupPath) {
      deleteBackup(backupPath)
    }

    progress?.('迁移完成', 100)

    return { success: true }
  } catch (error) {
    console.error('Migration failed:', error)

    progress?.('迁移失败，正在恢复备份...', 0)

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
 * Run all migrations from scratch (for fresh database initialization)
 */
export async function runAllMigrations(
  prisma: any,
  options?: { fromVersion?: number; progress?: boolean }
): Promise<void> {
  const fromVersion = options?.fromVersion ?? 0
  const migrationsToRun = migrations.filter((m) => m.version > fromVersion)

  console.log(`Running ${migrationsToRun.length} migrations from version ${fromVersion}`)

  for (const migration of migrationsToRun) {
    console.log(`Running migration ${migration.version}: ${migration.name}`)

    try {
      // Execute SQL file if specified
      if (migration.sqlFile) {
        await executeSqlMigration(migration.sqlFile, prisma)
      }

      // Run migration up function
      await migration.up(prisma)

      console.log(`Migration ${migration.version} completed`)
    } catch (error) {
      console.error(`Migration ${migration.version} failed:`, error)
      throw error
    }
  }

  console.log('All migrations completed successfully')
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
 * Check if pending migrations are all automatic (additive) or include manual changes
 */
export async function hasManualMigrations(): Promise<boolean> {
  const currentVersion = await getCurrentVersion()
  const pendingMigrations = migrations.filter((m) => m.version > currentVersion)

  return pendingMigrations.some((m) => m.type === 'manual')
}

/**
 * Show migration dialog to user and handle their choice
 */
export async function showMigrationDialog(): Promise<'migrate' | 'reset' | 'cancel'> {
  const currentVersion = await getCurrentVersion()
  const isManual = await hasManualMigrations()

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

  // For automatic migrations, show simpler confirmation
  if (!isManual) {
    const result = await dialog.showMessageBox({
      type: 'info',
      title: '数据库升级',
      message: '检测到数据库需要升级',
      detail:
        '当前应用版本包含数据库结构更新。\n\n' +
        '此次升级会自动保留您的所有数据。\n' +
        '升级过程将在几秒钟内完成。\n\n' +
        '点击"开始升级"继续。',
      buttons: ['开始升级', '取消'],
      defaultId: 0,
      cancelId: 1
    })

    switch (result.response) {
      case 0:
        return 'migrate'
      default:
        return 'cancel'
    }
  }

  // For manual migrations, show detailed dialog with all options
  const result = await dialog.showMessageBox({
    type: 'warning',
    title: '数据库升级',
    message: '检测到数据库需要升级',
    detail:
      '当前应用版本包含数据库结构更新。\n\n' +
      '• 升级：保留现有数据并更新数据库结构（推荐）\n' +
      '  系统会自动创建备份，确保数据安全\n\n' +
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
        // Create a simple progress callback that logs to console
        // In the future, this could show a progress window
        const progress: ProgressCallback = (message: string, percent: number) => {
          console.log(`Migration progress (${percent}%): ${message}`)
        }

        // Run migrations with progress tracking
        const result = await runMigrations(progress)

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
