#!/usr/bin/env node

/**
 * Database Migration Generator
 *
 * Usage: node scripts/generate-migration.js "description_of_change"
 *
 * This script:
 * 1. Finds the latest schema snapshot
 * 2. Compares it with current prisma/schema.prisma
 * 3. Generates SQL migration file
 * 4. Creates TypeScript migration stub
 * 5. Saves new schema snapshot
 */

const fs = require('fs')
const path = require('path')

// Paths
const PROJECT_ROOT = path.join(__dirname, '..')
const SCHEMA_PATH = path.join(PROJECT_ROOT, 'prisma/schema.prisma')
const MIGRATIONS_DIR = path.join(PROJECT_ROOT, 'prisma/migrations')
const TS_MIGRATIONS_DIR = path.join(PROJECT_ROOT, 'src/main/migrations/versions')

function getNextVersion() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return 1
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
  const sqlFiles = files.filter(f => f.endsWith('.sql'))

  if (sqlFiles.length === 0) {
    return 1
  }

  // Extract version numbers from filenames (e.g., "001_initial.sql" -> 1)
  const versions = sqlFiles.map(f => parseInt(f.split('_')[0])).filter(n => !isNaN(n))
  return Math.max(...versions) + 1
}

function getLatestSnapshot() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return null
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
  const snapshotFiles = files.filter(f => f.endsWith('_schema_snapshot.prisma')).sort().reverse()

  if (snapshotFiles.length === 0) {
    return null
  }

  return path.join(MIGRATIONS_DIR, snapshotFiles[0])
}

function parseSchema(content) {
  const models = {}
  const modelRegex = /model\s+(\w+)\s*{([^}]+)}/gs

  let match
  while ((match = modelRegex.exec(content)) !== null) {
    const modelName = match[1]
    const modelBody = match[2]

    // Parse fields
    const fields = []
    const lines = modelBody.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'))

    for (const line of lines) {
      // Skip directives like @@index, @@unique
      if (line.startsWith('@@')) continue

      // Parse field definition: fieldName Type modifiers?
      const fieldMatch = line.match(/^(\w+)\s+([^\s@]+)/)
      if (fieldMatch) {
        const fieldName = fieldMatch[1]
        const fieldType = fieldMatch[2]
        const isOptional = line.includes('?')
        const hasDefault = line.includes('@default')
        const isId = line.includes('@id')
        const isUnique = line.includes('@unique')

        fields.push({
          name: fieldName,
          type: fieldType,
          optional: isOptional,
          hasDefault: hasDefault,
          isId: isId,
          isUnique: isUnique,
          raw: line
        })
      }
    }

    // Parse indexes
    const indexes = []
    const indexMatches = modelBody.matchAll(/@@index\(\[([^\]]+)\]\)/g)
    for (const indexMatch of indexMatches) {
      indexes.push(indexMatch[1].split(',').map(s => s.trim()))
    }

    models[modelName] = { fields, indexes }
  }

  return models
}

function generateSqlForNewTable(modelName, model) {
  const lines = [`-- Create ${modelName} table`, `CREATE TABLE IF NOT EXISTS "${modelName}" (`]

  const fieldLines = []
  for (const field of model.fields) {
    // Skip relations
    if (field.type[0] === field.type[0].toUpperCase() && !['String', 'Int', 'Float', 'Boolean', 'DateTime'].includes(field.type)) {
      continue
    }

    let sqlType = 'TEXT'
    if (field.type.includes('Int')) sqlType = 'INTEGER'
    else if (field.type.includes('Float')) sqlType = 'REAL'
    else if (field.type.includes('Boolean')) sqlType = 'INTEGER'
    else if (field.type.includes('DateTime')) sqlType = 'DATETIME'

    let nullable = field.optional && !field.hasDefault ? '' : ' NOT NULL'
    let defaultValue = ''

    if (field.hasDefault) {
      if (field.raw.includes('@default(now())')) {
        defaultValue = ' DEFAULT CURRENT_TIMESTAMP'
      } else if (field.raw.includes('@default(0)')) {
        defaultValue = ' DEFAULT 0'
      } else if (field.raw.includes('@default(false)')) {
        defaultValue = ' DEFAULT 0'
      } else if (field.raw.includes('@default(uuid())')) {
        // SQLite doesn't have UUID generation, handled by Prisma
        defaultValue = ''
      }
    }

    let primary = field.isId ? ' PRIMARY KEY' : ''
    let unique = field.isUnique && !field.isId ? ' UNIQUE' : ''

    fieldLines.push(`  "${field.name}" ${sqlType}${nullable}${primary}${unique}${defaultValue}`)
  }

  lines.push(fieldLines.join(',\n'))
  lines.push(');')

  // Add indexes
  const indexSql = []
  for (const indexFields of model.indexes) {
    const indexName = `${modelName}_${indexFields.join('_')}_idx`
    indexSql.push(`CREATE INDEX IF NOT EXISTS "${indexName}" ON "${modelName}"(${indexFields.map(f => `"${f}"`).join(', ')});`)
  }

  return [...lines, '', ...indexSql].join('\n')
}

function generateSqlForNewField(modelName, fieldName, field) {
  let sqlType = 'TEXT'
  if (field.type.includes('Int')) sqlType = 'INTEGER'
  else if (field.type.includes('Float')) sqlType = 'REAL'
  else if (field.type.includes('Boolean')) sqlType = 'INTEGER'
  else if (field.type.includes('DateTime')) sqlType = 'DATETIME'

  let defaultValue = ''
  if (field.hasDefault) {
    if (field.raw.includes('@default(now())')) {
      defaultValue = ' DEFAULT CURRENT_TIMESTAMP'
    } else if (field.raw.includes('@default(0)')) {
      defaultValue = ' DEFAULT 0'
    } else if (field.raw.includes('@default(false)')) {
      defaultValue = ' DEFAULT 0'
    }
  }

  const nullable = field.optional || field.hasDefault ? '' : ' NOT NULL'

  return `ALTER TABLE "${modelName}" ADD COLUMN "${fieldName}" ${sqlType}${nullable}${defaultValue};`
}

function detectChanges(oldModels, newModels) {
  const changes = {
    newTables: [],
    newFields: [],
    newIndexes: [],
    removedTables: [],
    removedFields: [],
    modifiedFields: []
  }

  // Detect new tables
  for (const modelName in newModels) {
    if (!oldModels[modelName]) {
      changes.newTables.push(modelName)
    }
  }

  // Detect removed tables
  for (const modelName in oldModels) {
    if (!newModels[modelName]) {
      changes.removedTables.push(modelName)
    }
  }

  // Detect field changes
  for (const modelName in newModels) {
    if (!oldModels[modelName]) continue

    const oldFields = oldModels[modelName].fields
    const newFields = newModels[modelName].fields

    const oldFieldMap = {}
    oldFields.forEach(f => { oldFieldMap[f.name] = f })

    const newFieldMap = {}
    newFields.forEach(f => { newFieldMap[f.name] = f })

    // New fields
    for (const fieldName in newFieldMap) {
      if (!oldFieldMap[fieldName] && !['category', 'customer', 'transaction', 'orderItems', 'transactions'].includes(fieldName)) {
        changes.newFields.push({ model: modelName, field: fieldName, definition: newFieldMap[fieldName] })
      }
    }

    // Removed fields
    for (const fieldName in oldFieldMap) {
      if (!newFieldMap[fieldName] && !['category', 'customer', 'transaction', 'orderItems', 'transactions'].includes(fieldName)) {
        changes.removedFields.push({ model: modelName, field: fieldName })
      }
    }

    // Modified fields (type change)
    for (const fieldName in newFieldMap) {
      if (oldFieldMap[fieldName]) {
        const oldField = oldFieldMap[fieldName]
        const newField = newFieldMap[fieldName]
        if (oldField.type !== newField.type || oldField.optional !== newField.optional) {
          changes.modifiedFields.push({ model: modelName, field: fieldName, old: oldField, new: newField })
        }
      }
    }

    // New indexes
    const oldIndexSet = new Set(oldModels[modelName].indexes.map(i => i.join(',')))
    const newIndexSet = new Set(newModels[modelName].indexes.map(i => i.join(',')))

    for (const indexKey of newIndexSet) {
      if (!oldIndexSet.has(indexKey)) {
        changes.newIndexes.push({ model: modelName, fields: indexKey.split(',') })
      }
    }
  }

  return changes
}

function determineMigrationType(changes) {
  // Breaking changes require manual migration
  if (changes.removedTables.length > 0 || changes.removedFields.length > 0 || changes.modifiedFields.length > 0) {
    return 'manual'
  }
  // Additive changes can be automatic
  return 'automatic'
}

function generateMigrationSql(version, description, changes, migrationType) {
  const lines = [
    `-- Migration: ${description}`,
    `-- Schema Version: ${version - 1} → ${version}`,
    `-- Type: ${migrationType}`,
    `-- Generated: ${new Date().toISOString().split('T')[0]}`,
    ''
  ]

  // New tables
  for (const tableName of changes.newTables) {
    lines.push(generateSqlForNewTable(tableName, changes.newModels[tableName]))
    lines.push('')
  }

  // New fields
  for (const { model, field, definition } of changes.newFields) {
    lines.push(`-- Add ${field} to ${model}`)
    lines.push(generateSqlForNewField(model, field, definition))
    lines.push('')
  }

  // New indexes
  for (const { model, fields } of changes.newIndexes) {
    const indexName = `${model}_${fields.join('_')}_idx`
    lines.push(`CREATE INDEX IF NOT EXISTS "${indexName}" ON "${model}"(${fields.map(f => `"${f}"`).join(', ')});`)
    lines.push('')
  }

  // Removed fields/tables - add warning
  if (changes.removedFields.length > 0 || changes.removedTables.length > 0) {
    lines.push('-- WARNING: This migration includes destructive changes.')
    lines.push('-- Implement the removal logic in the TypeScript migration file.')
    lines.push('')

    for (const { model, field } of changes.removedFields) {
      lines.push(`-- TODO: Remove ${model}.${field}`)
    }

    for (const tableName of changes.removedTables) {
      lines.push(`-- TODO: Drop table ${tableName}`)
    }
    lines.push('')
  }

  // Modified fields - add warning
  if (changes.modifiedFields.length > 0) {
    lines.push('-- WARNING: This migration modifies existing fields.')
    lines.push('-- SQLite requires table recreation for type changes.')
    lines.push('-- Implement the modification logic in the TypeScript migration file.')
    lines.push('')

    for (const { model, field, old, new: newField } of changes.modifiedFields) {
      lines.push(`-- TODO: Modify ${model}.${field} from ${old.type} to ${newField.type}`)
    }
    lines.push('')
  }

  // Record migration
  lines.push('-- Record this migration')
  lines.push(`INSERT OR IGNORE INTO "SchemaVersion" ("version", "name", "appliedAt")`)
  lines.push(`VALUES (${version}, '${description}', CURRENT_TIMESTAMP);`)

  return lines.join('\n')
}

function generateTypeScriptMigration(version, description, migrationType) {
  const versionPadded = String(version).padStart(3, '0')
  const safeName = description.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

  return `import { Migration } from '../types'

export const migration: Migration = {
  version: ${version},
  name: '${description}',
  type: '${migrationType}',
  sqlFile: 'prisma/migrations/${versionPadded}_${safeName}.sql',
  requiresBackup: ${migrationType === 'manual' ? 'true' : 'false'},
  up: async (prisma, progress) => {
    progress?.('正在应用数据库迁移...', 20)

    // SQL file handles schema changes
    // Add data transformation logic here if needed

    progress?.('正在验证迁移...', 80)

    // Add verification logic here

    progress?.('迁移完成', 100)
    console.log('Migration to version ${version} completed successfully')
  }
}
`
}

// Main execution
function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('Usage: node scripts/generate-migration.js "description_of_change"')
    process.exit(1)
  }

  const description = args[0]
  const nextVersion = getNextVersion()
  const versionPadded = String(nextVersion).padStart(3, '0')
  const safeName = description.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

  console.log(`\nGenerating migration v${nextVersion}: ${description}\n`)

  // Read current schema
  if (!fs.existsSync(SCHEMA_PATH)) {
    console.error('Error: prisma/schema.prisma not found')
    process.exit(1)
  }

  const currentSchema = fs.readFileSync(SCHEMA_PATH, 'utf8')
  const newModels = parseSchema(currentSchema)

  // Read latest snapshot
  const latestSnapshot = getLatestSnapshot()
  let oldModels = {}

  if (latestSnapshot) {
    const oldSchema = fs.readFileSync(latestSnapshot, 'utf8')
    oldModels = parseSchema(oldSchema)
    console.log(`Comparing with previous schema: ${path.basename(latestSnapshot)}`)
  } else {
    console.log('No previous schema found, treating as initial migration')
  }

  // Detect changes
  const changes = detectChanges(oldModels, newModels)
  changes.newModels = newModels

  // Determine migration type
  const migrationType = determineMigrationType(changes)

  // Show summary
  console.log('\nDetected changes:')
  console.log(`- New tables: ${changes.newTables.length}`)
  console.log(`- New fields: ${changes.newFields.length}`)
  console.log(`- New indexes: ${changes.newIndexes.length}`)
  console.log(`- Removed tables: ${changes.removedTables.length}`)
  console.log(`- Removed fields: ${changes.removedFields.length}`)
  console.log(`- Modified fields: ${changes.modifiedFields.length}`)
  console.log(`\nMigration type: ${migrationType}`)

  if (changes.newTables.length === 0 && changes.newFields.length === 0 && changes.newIndexes.length === 0 &&
      changes.removedTables.length === 0 && changes.removedFields.length === 0 && changes.modifiedFields.length === 0) {
    console.log('\nNo schema changes detected. No migration needed.')
    return
  }

  // Generate SQL
  const sql = generateMigrationSql(nextVersion, description, changes, migrationType)
  const sqlPath = path.join(MIGRATIONS_DIR, `${versionPadded}_${safeName}.sql`)

  // Generate TypeScript
  const ts = generateTypeScriptMigration(nextVersion, description, migrationType)
  const tsPath = path.join(TS_MIGRATIONS_DIR, `v${versionPadded}_${safeName}.ts`)

  // Save schema snapshot
  const snapshotPath = path.join(MIGRATIONS_DIR, `${versionPadded}_schema_snapshot.prisma`)

  // Create directories if needed
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true })
  }
  if (!fs.existsSync(TS_MIGRATIONS_DIR)) {
    fs.mkdirSync(TS_MIGRATIONS_DIR, { recursive: true })
  }

  // Write files
  fs.writeFileSync(sqlPath, sql)
  fs.writeFileSync(tsPath, ts)
  fs.writeFileSync(snapshotPath, currentSchema)

  console.log(`\n✓ Created: ${path.relative(PROJECT_ROOT, sqlPath)}`)
  console.log(`✓ Created: ${path.relative(PROJECT_ROOT, snapshotPath)}`)
  console.log(`✓ Created: ${path.relative(PROJECT_ROOT, tsPath)}`)

  console.log('\nNext steps:')
  console.log('1. Review generated SQL')
  console.log(`2. Edit ${path.relative(PROJECT_ROOT, tsPath)} if data transformation needed`)
  console.log('3. Add migration to src/main/migrations/index.ts:')
  console.log(`   import { migration as v${versionPadded} } from './versions/v${versionPadded}_${safeName}'`)
  console.log(`   // Add v${versionPadded} to migrations array`)
  console.log('4. Update CURRENT_SCHEMA_VERSION in src/main/services/migrationService.ts')
  console.log('5. Run: pnpm migration:test')
  console.log('6. Test in dev: rm prisma/data.db && pnpm dev')
}

try {
  main()
} catch (error) {
  console.error('Error generating migration:', error.message)
  process.exit(1)
}
