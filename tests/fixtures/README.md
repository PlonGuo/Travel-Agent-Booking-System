# Test Fixtures

This directory contains test database fixtures for migration testing.

## Structure

- `v1_database.db` - Database at schema version 1 with sample data
- `v2_database.db` - Database at schema version 2 with sample data
- `test-data.json` - Known test data for verification

## Creating Test Fixtures

To create a test database at a specific version:

1. Delete your dev database: `rm prisma/data.db`
2. Temporarily modify `CURRENT_SCHEMA_VERSION` to the desired version
3. Run the app: `pnpm dev`
4. Add some test data manually
5. Copy the database: `cp prisma/data.db tests/fixtures/vN_database.db`
6. Restore `CURRENT_SCHEMA_VERSION` to the actual current version

## Using Test Fixtures

The migration test suite (`scripts/test-migration.js`) uses these fixtures to verify that migrations preserve data correctly.
