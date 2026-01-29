/**
 * Migration type definitions
 */

export interface Migration {
  version: number
  name: string
  type: 'automatic' | 'manual' // automatic = additive changes, manual = breaking changes
  sqlFile?: string // Path to SQL file in prisma/migrations/
  requiresBackup: boolean // Force backup for risky migrations
  up: (prisma: any, progress?: ProgressCallback) => Promise<void>
  down?: (prisma: any) => Promise<void> // Optional rollback function
}

export type ProgressCallback = (message: string, percent: number) => void

export interface MigrationResult {
  success: boolean
  version: number
  error?: string
  backupPath?: string
}

export interface SchemaValidationResult {
  valid: boolean
  missingTables: string[]
  missingColumns: { table: string; column: string }[]
  extraColumns: { table: string; column: string }[]
}
