# Database Migrations

This directory contains SQL migration files for the Travel Agent Booking System database.

## Migration Files

Each migration consists of:
- `XXX_description.sql` - SQL commands to execute
- `XXX_schema_snapshot.prisma` - Prisma schema snapshot at this version

## Current Migrations

- **001_initial.sql** - Initial schema (Category, Customer, Transaction, OrderItem, SchemaVersion tables)
- **002_add_order_item_ispaid.sql** - Add payment tracking to OrderItem level

## Adding a New Migration

When you need to make database schema changes:

1. Edit `prisma/schema.prisma` with your changes
2. Run `pnpm migration:create "description_of_change"`
3. Review the generated SQL file
4. Edit the corresponding TypeScript file in `src/main/migrations/versions/` if data transformation is needed
5. Update `CURRENT_SCHEMA_VERSION` in `src/main/services/migrationService.ts`
6. Test with `pnpm migration:test`

## Migration Types

- **Automatic** - Additive changes (new columns, tables, indexes) that don't require user confirmation
- **Manual** - Breaking changes (rename, type changes) that require user confirmation

## File Naming Convention

Format: `NNN_description.sql`
- NNN = Zero-padded version number (001, 002, etc.)
- description = Snake_case description of the change

Examples:
- `001_initial.sql`
- `002_add_order_item_ispaid.sql`
- `003_add_customer_phone.sql`

## Schema Snapshots

Each migration includes a schema snapshot (`NNN_schema_snapshot.prisma`) which is a copy of the Prisma schema at that version. This allows the migration generator to compare schemas and create SQL diffs automatically.

## Git Policy

✅ **DO commit:**
- All SQL migration files (*.sql)
- All schema snapshots (*_schema_snapshot.prisma)
- This README.md

❌ **DON'T commit:**
- Test databases or backup files
