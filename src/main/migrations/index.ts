/**
 * Migration registry
 *
 * Import and export all migration versions here.
 * Migrations will be executed in order by version number.
 */

import { Migration } from './types'
import { migration as v001 } from './versions/v001_initial'
import { migration as v002 } from './versions/v002_payment_status'

/**
 * All migrations in order
 * Add new migrations to the end of this array
 */
export const migrations: Migration[] = [
  v001,
  v002
]

export * from './types'
