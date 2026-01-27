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
