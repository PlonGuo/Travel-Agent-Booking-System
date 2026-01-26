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
- `pnpm prisma:generate` - Generate Prisma client
- `pnpm prisma:push` - Sync schema to database

## Architecture

- `/src/main` - Electron main process (Node.js backend)
- `/src/preload` - IPC bridge between main and renderer
- `/src/renderer` - React frontend

## Data Flow

Renderer → IPC → Main Process → Prisma → SQLite

## Important Notes

- All UI text must be in Chinese (中文)
- Target user is 50+ years old, prioritize clarity and usability
- Database stored in app.getPath('userData'), not install directory
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

## UI

- Always follow the UI design in design-references folder

## Servers availability

- If the OUTPUT of some command you ran for testing shows undefined or some error messages, ask me to run cli instead of keeping trying.
