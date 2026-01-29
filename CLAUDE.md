# Travel Agent Booking System

## Project Overview

Desktop app (Electron) for a travel booking agent to track customer payments.
Built with React + TypeScript + Prisma + SQLite.

## Tech Stack

- Electron + electron-vite
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Prisma + SQLite
- pnpm

## Key Commands

- `pnpm install` - Install dependencies
- `pnpm dev` - Start dev mode
- `pnpm build` - Build for production
- `pnpm build:win` - Package for Windows
- `pnpm test` - Run tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:ui` - Run tests with UI
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm prisma:generate` - Generate Prisma client
- `pnpm prisma:push` - Sync schema to database

## Test

**Testing Framework**: Vitest + React Testing Library

**Important**: Whenever you complete a task, run `pnpm test` to ensure all tests pass.

**Test Configuration**:
- Config file: `vitest.config.ts`
- Setup file: `src/renderer/test/setup.ts`
- Test files: Place `.test.tsx` or `.test.ts` files next to the component/module being tested

**Writing Tests**:
- Test React components using `@testing-library/react`
- Use `@testing-library/user-event` for user interactions
- Mock Electron IPC calls in `src/renderer/test/setup.ts`
- Follow existing test patterns in the codebase

**Test Commands**:
- `pnpm test` - Run all tests once (use this after completing tasks)
- `pnpm test:watch` - Run tests in watch mode during development
- `pnpm test:ui` - Open Vitest UI for interactive test running
- `pnpm test:coverage` - Generate test coverage report

## Architecture

- `/src/main` - Electron main process (Node.js backend)
- `/src/preload` - IPC bridge between main and renderer
- `/src/renderer` - React frontend

## Data Flow

Renderer → IPC → Main Process → Prisma → SQLite

## Database Storage

**Development Mode** (when running `pnpm dev`):
- Database location: `prisma/data.db` (in project folder)
- Allows easier access with Prisma Studio
- File is ignored by `.gitignore` (line 147-148)

**Production Mode** (when packaged with `pnpm build`):
- Database location: `app.getPath('userData')/data.db`
- Outside project directory for proper app data storage

**Git Policy**:
- ✅ DO commit: `prisma/seed.ts`, `prisma/schema.prisma`, migrations
- ❌ DON'T commit: `prisma/*.db`, `prisma/*.db-journal` (actual database files)
- Database files are protected by `.gitignore`

## Database Migrations

**Migration System**: Custom migration system with automatic schema sync for frequent app updates.

**Current Schema Version**: 2 (defined in `src/main/services/migrationService.ts`)

**Important**: When making schema changes, always use the migration system to ensure users can upgrade smoothly without losing data.

### Migration Workflow

When adding schema changes:

1. **Edit Prisma schema**: Modify `prisma/schema.prisma` (add column, table, index, etc.)

2. **Generate migration**: Run `pnpm migration:create "description_of_change"`
   - This auto-generates:
     - `prisma/migrations/XXX_description.sql` - SQL migration file
     - `prisma/migrations/XXX_schema_snapshot.prisma` - Schema snapshot
     - `src/main/migrations/versions/vXXX_description.ts` - TypeScript migration

3. **Review generated files**:
   - Check the SQL file for correctness
   - Verify it matches your intended schema changes
   - The script auto-detects: new tables, new columns, new indexes, type changes

4. **Edit TypeScript migration** (if needed):
   - Located in `src/main/migrations/versions/vXXX_*.ts`
   - Add data transformation logic if the migration requires it
   - For simple additive changes (new columns/tables), no edits needed

5. **Register migration**:
   - Add import in `src/main/migrations/index.ts`:
     ```typescript
     import { migration as vXXX } from './versions/vXXX_description'
     ```
   - Add to migrations array: `export const migrations: Migration[] = [..., vXXX]`

6. **Update schema version**:
   - Edit `src/main/services/migrationService.ts`
   - Update: `export const CURRENT_SCHEMA_VERSION = X`

7. **Test migration**: Run `pnpm migration:test`
   - Tests the migration path
   - Verifies schema changes

8. **Test in dev**:
   - Delete local DB: `rm prisma/data.db`
   - Run app: `pnpm dev`
   - Verify migration runs successfully

9. **Test in packaged app**:
   - Build: `pnpm build:win`
   - Install on test machine with existing database
   - Verify automatic migration works
   - Check all data preserved

10. **Commit and release**:
    ```bash
    git add .
    git commit -m "feat: add [description of change]"
    pnpm build:win
    ```

### Migration Types

**Automatic Migrations** (No user intervention):
- Add new column: `ALTER TABLE ADD COLUMN`
- Add new table: `CREATE TABLE`
- Add index: `CREATE INDEX`
- User sees: Brief progress indicator, auto-migrates in seconds

**Manual Migrations** (User confirmation required):
- Rename column (requires table recreation in SQLite)
- Change column type (requires data conversion)
- User sees: Dialog with "升级（推荐）", "重置数据库", "取消" options
- User clicks "升级" → sees progress bar → data preserved

### Migration Files Structure

```
prisma/migrations/
  001_initial.sql                    # SQL for schema v1
  001_schema_snapshot.prisma         # Prisma schema at v1
  002_add_order_item_ispaid.sql     # SQL for schema v2
  002_schema_snapshot.prisma         # Prisma schema at v2
  003_your_new_migration.sql        # Your new migration
  README.md                          # Migration documentation

src/main/migrations/
  types.ts                           # Migration type definitions
  index.ts                           # Migration registry
  versions/
    v001_initial.ts                  # Data transformations for v1
    v002_payment_status.ts           # Data transformations for v2
    v003_your_new_migration.ts       # Your new migration
```

### Example: Add New Column

```prisma
// 1. Edit prisma/schema.prisma
model Customer {
  // ... existing fields ...
  phoneNumber String?  // NEW FIELD
}
```

```bash
# 2. Generate migration
pnpm migration:create "add_customer_phone"

# Output:
# ✓ Created: prisma/migrations/003_add_customer_phone.sql
# ✓ Created: prisma/migrations/003_schema_snapshot.prisma
# ✓ Created: src/main/migrations/versions/v003_add_customer_phone.ts
```

```typescript
// 3. Register migration in src/main/migrations/index.ts
import { migration as v003 } from './versions/v003_add_customer_phone'
export const migrations: Migration[] = [v001, v002, v003]
```

```typescript
// 4. Update schema version in src/main/services/migrationService.ts
export const CURRENT_SCHEMA_VERSION = 3
```

```bash
# 5. Test
pnpm migration:test
rm prisma/data.db && pnpm dev

# 6. Build and release
pnpm build:win
```

### Migration Commands

- `pnpm migration:create "description"` - Generate new migration files
- `pnpm migration:test` - Test migration paths
- `pnpm migration:test --from=1 --to=3` - Test specific version range
- `pnpm migration:test --with-data` - Test with sample data

### TypeScript Type Checking

**IMPORTANT**: Always run TypeScript type checking before committing:

```bash
# Check for type errors
pnpm exec tsc --noEmit

# Or use your IDE's TypeScript integration
# VSCode: Problems panel (Cmd+Shift+M)
```

**Fix type errors** before committing code. Common issues:
- Missing type annotations
- Incorrect prop types in React components
- Untyped function parameters
- Missing return types

## Important Notes

- All UI text must be in Chinese (中文)
- Target user is 50+ years old, prioritize clarity and usability
- No HTTP API needed, use Electron IPC only
- Each entity (Customer, Transaction, OrderItem) has a comment field

## Code Style

- Use TypeScript strict mode
- Prefer async/await over callbacks
- Use shadcn/ui components, don't write custom UI from scratch
- Follow existing patterns in codebase

## File Naming

- Components: PascalCase (CustomerCard.tsx)
- Hooks: camelCase with "use" prefix (useCustomers.ts)
- Services: camelCase with "Service" suffix (customerService.ts)
- IPC handlers: camelCase (customers.ts)

## UI Design Reference

- UI designs and mockups are stored in `/design-references` folder
- Always reference these designs when implementing or modifying UI components
- Maintain consistency with existing design patterns shown in references
- Use `/ui-ux-pro-max` skill for UI design assistance (supports React + Tailwind stack)
- The Electron renderer is a React app, so all web UI/UX patterns apply

## Testing & Runtime Limitations

- Claude cannot run the dev server (`pnpm dev`) or verify the app's runtime behavior
- If automated commands produce errors, undefined values, or unexpected output, stop retrying
- Instead, ask the user to manually run commands in their terminal to verify functionality
- Focus on code changes and static analysis rather than runtime testing
