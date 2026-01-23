# Travel Agent Booking System - Architecture Design Document

## Project Overview

### Background
Mom is a travel booking agent who pays for flights, hotels, and insurance on behalf of customers, then collects payment from them later. Currently using Excel to track records, which makes searching difficult and prone to missed entries.

### Goal
Build a desktop application for easy recording, searching, and payment collection. One-click install, double-click to use.

### Core Use Cases
1. Record each advance payment (customer, route, ticket number, amount)
2. View all records by category/customer
3. Search for specific customers or routes
4. Track receivables and profits

### Target User
- Mom (50+ years old, non-technical)
- Single user, local only, no login required
- All UI text in Chinese

---

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Desktop Framework | Electron | Cross-platform desktop app |
| Scaffolding | electron-vite | Official Vite integration |
| Frontend | React + TypeScript | Component-based UI |
| Build Tool | Vite | Fast dev/build |
| Styling | Tailwind CSS | Utility-first CSS |
| UI Components | shadcn/ui | Modern, accessible components |
| Backend | Electron Main Process | Node.js runtime |
| Database | SQLite | Lightweight local database |
| ORM | Prisma | Type-safe database operations |
| Package Manager | pnpm | Fast, disk-efficient, no phantom deps |
| Bundler | electron-builder | Generate installers |

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      Electron App                            │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                 Renderer Process                        │  │
│  │                (React + Vite + TS)                      │  │
│  │                                                         │  │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────┐               │  │
│  │   │  Pages  │  │Components│  │  Hooks  │               │  │
│  │   └─────────┘  └─────────┘  └─────────┘               │  │
│  │                      │                                  │  │
│  └──────────────────────┼──────────────────────────────────┘  │
│                         │ IPC (contextBridge)               │
│  ┌──────────────────────┼──────────────────────────────────┐  │
│  │                 Main Process                            │  │
│  │               (Node.js + TS)                            │  │
│  │                      │                                  │  │
│  │   ┌─────────────────────────────────────┐              │  │
│  │   │          Service Layer              │              │  │
│  │   └─────────────────────────────────────┘              │  │
│  │                      │                                  │  │
│  │   ┌─────────────────────────────────────┐              │  │
│  │   │         Prisma ORM Client           │              │  │
│  │   └─────────────────────────────────────┘              │  │
│  │                      │                                  │  │
│  └──────────────────────┼──────────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────┴──────────────────────────────────┐  │
│  │              SQLite Database                            │  │
│  │         (userData/data.db)                              │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Data Storage Location
Database stored in user data directory (not install directory) to persist across updates:

| OS | Path |
|----|------|
| Windows | `%APPDATA%/travel-agent-app/data.db` |
| macOS | `~/Library/Application Support/travel-agent-app/data.db` |

```typescript
import { app } from 'electron'
import path from 'path'
const dbPath = path.join(app.getPath('userData'), 'data.db')
```

---

## Data Model Design

### Entity Relationship

```
Category (大分类)
    │ 1:N
    ▼
Customer (客户)
    │ 1:N
    ▼
Transaction (交易/订单组)
    │ 1:N
    ▼
OrderItem (订单项)
```

### Field Mapping (Excel → Database)

| Excel Column | Database Field | Table |
|--------------|----------------|-------|
| Bottom tabs (国旅, 康辉...) | Category.name | Category |
| Customer name (汤奇) | Customer.name | Customer |
| 客户 | Customer.source | Customer |
| 开票公司 | Customer.invoiceCompany | Customer |
| 12月 | Transaction.month | Transaction |
| 合计（应收） | Transaction.totalAmount | Transaction (auto-calc) |
| 利润 | Transaction.profit | Transaction |
| 行程 (WUX-CTU) | OrderItem.route | OrderItem |
| 票号 | OrderItem.ticketNumber | OrderItem |
| 应付 | OrderItem.amount | OrderItem |

### Prisma Schema

```prisma
// prisma/schema.prisma

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Category (Tab)
model Category {
  id        String     @id @default(uuid())
  name      String     @unique
  order     Int        @default(0)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  customers Customer[]
}

// Customer
model Customer {
  id             String        @id @default(uuid())
  categoryId     String
  category       Category      @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  name           String
  source         String?
  invoiceCompany String?
  comment        String?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  transactions   Transaction[]
  
  @@index([categoryId])
  @@index([name])
}

// Transaction (Order Group by month)
model Transaction {
  id          String      @id @default(uuid())
  customerId  String
  customer    Customer    @relation(fields: [customerId], references: [id], onDelete: Cascade)
  month       String
  totalAmount Float       @default(0)
  profit      Float       @default(0)
  isPaid      Boolean     @default(false)
  comment     String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  orderItems  OrderItem[]
  
  @@index([customerId])
  @@index([month])
}

// Order Item (individual entry)
model OrderItem {
  id            String      @id @default(uuid())
  transactionId String
  transaction   Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  type          String      // flight/hotel/insurance/other
  route         String
  ticketNumber  String?
  amount        Float
  date          String?
  comment       String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  @@index([transactionId])
  @@index([route])
  @@index([ticketNumber])
}
```

---

## IPC Communication

No HTTP API needed. Use Electron IPC for renderer-main communication:

```typescript
// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // Categories
  categories: {
    getAll: () => ipcRenderer.invoke('categories:getAll'),
    create: (data) => ipcRenderer.invoke('categories:create', data),
    update: (id, data) => ipcRenderer.invoke('categories:update', id, data),
    delete: (id) => ipcRenderer.invoke('categories:delete', id),
    reorder: (ids) => ipcRenderer.invoke('categories:reorder', ids),
  },
  // Customers
  customers: {
    getByCategory: (categoryId) => ipcRenderer.invoke('customers:getByCategory', categoryId),
    create: (data) => ipcRenderer.invoke('customers:create', data),
    update: (id, data) => ipcRenderer.invoke('customers:update', id, data),
    delete: (id) => ipcRenderer.invoke('customers:delete', id),
  },
  // Transactions
  transactions: {
    getByCustomer: (customerId) => ipcRenderer.invoke('transactions:getByCustomer', customerId),
    create: (data) => ipcRenderer.invoke('transactions:create', data),
    update: (id, data) => ipcRenderer.invoke('transactions:update', id, data),
    delete: (id) => ipcRenderer.invoke('transactions:delete', id),
  },
  // Order Items
  orderItems: {
    create: (data) => ipcRenderer.invoke('orderItems:create', data),
    update: (id, data) => ipcRenderer.invoke('orderItems:update', id, data),
    delete: (id) => ipcRenderer.invoke('orderItems:delete', id),
  },
  // Search
  search: {
    global: (query, filters) => ipcRenderer.invoke('search:global', query, filters),
  },
})
```

---

## Project Structure

```
travel-agent-app/
├── package.json
├── electron.vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── components.json                 # shadcn/ui config
├── CLAUDE.md                       # Claude Code instructions
├── ARCHITECTURE.md                 # This document
│
├── .claude/
│   └── settings.json               # Claude Code settings
│
├── design-references/              # Stitch exported code (UI reference)
│   ├── README.md                   # How to use these references
│   ├── main-page/                  # Main page with tabs + customer list
│   │   ├── index.html
│   │   ├── styles.css
│   │   └── screenshot.png
│   ├── search-filter/              # Search & filter panel
│   │   └── ...
│   ├── customer-form/              # Customer add/edit modal
│   │   └── ...
│   ├── transaction-form/           # Transaction form
│   │   └── ...
│   ├── order-item-row/             # Order item inline form
│   │   └── ...
│   ├── comment-popover/            # Comment popover
│   │   └── ...
│   └── category-tabs/              # Category management
│       └── ...
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── resources/
│   └── icon.png
│
├── src/
│   ├── main/                       # Electron Main Process
│   │   ├── index.ts                # Entry point
│   │   ├── database.ts             # Prisma client init
│   │   ├── ipc/
│   │   │   ├── index.ts            # Register all handlers
│   │   │   ├── categories.ts
│   │   │   ├── customers.ts
│   │   │   ├── transactions.ts
│   │   │   ├── orderItems.ts
│   │   │   └── search.ts
│   │   └── services/
│   │       ├── categoryService.ts
│   │       ├── customerService.ts
│   │       ├── transactionService.ts
│   │       ├── orderItemService.ts
│   │       └── searchService.ts
│   │
│   ├── preload/
│   │   ├── index.ts                # contextBridge API
│   │   └── index.d.ts              # Type declarations
│   │
│   └── renderer/                   # React Frontend
│       ├── index.html
│       ├── main.tsx
│       ├── App.tsx
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Header.tsx
│       │   │   ├── SearchBar.tsx
│       │   │   ├── FilterPanel.tsx
│       │   │   └── CategoryTabs.tsx
│       │   ├── category/
│       │   │   └── CategoryForm.tsx
│       │   ├── customer/
│       │   │   ├── CustomerCard.tsx
│       │   │   ├── CustomerList.tsx
│       │   │   └── CustomerForm.tsx
│       │   ├── transaction/
│       │   │   ├── TransactionCard.tsx
│       │   │   └── TransactionForm.tsx
│       │   ├── order-item/
│       │   │   ├── OrderItemRow.tsx
│       │   │   └── OrderItemForm.tsx
│       │   ├── comment/
│       │   │   └── CommentPopover.tsx
│       │   └── ui/                 # shadcn/ui components
│       │
│       ├── hooks/
│       │   ├── useCategories.ts
│       │   ├── useCustomers.ts
│       │   ├── useTransactions.ts
│       │   └── useSearch.ts
│       │
│       ├── types/
│       │   └── index.ts
│       │
│       └── lib/
│           └── utils.ts
│
└── build/                          # Output directory
```

---

## Claude Code Configuration

### CLAUDE.md (Project Root)

```markdown
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
- `pnpm prisma generate` - Generate Prisma client
- `pnpm prisma db push` - Sync schema to database

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
```

### .claude/settings.json

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Edit",
      "Write",
      "Bash(pnpm:*)",
      "Bash(npx:*)",
      "Bash(mkdir:*)",
      "Bash(rm:*)",
      "Bash(cat:*)",
      "Bash(ls:*)"
    ],
    "deny": []
  }
}
```

---

## Page Structure

### Navigation Flow
```
App Launch
    │
    ▼
Main Page
├── Header (Search + Filter)
├── Category Tabs (国旅 | 康辉 | 心飞 | ...)
└── Customer List (current category)
        │
        ▼ (expand)
    Customer Card
    ├── Customer Info (name, source, invoice company)
    ├── Stats (total, profit, pending)
    └── Transaction Groups (by month)
            │
            ▼ (within each month)
        Order Items Table
        ├── Route | Ticket# | Amount | Comment
        └── ...
```

### Key Interactions
1. Click tab → Switch category
2. Click "+ 添加分类" → Create new category
3. Click "+ 添加客户" → Open customer form modal
4. Click customer card → Expand to show transactions
5. Click "+ 添加订单" → Open transaction form
6. Click "+ 添加项目" → Add order item inline
7. Click 💬 icon → Show comment popover
8. Type in search → Show real-time results
9. Click filter icon → Show filter panel

---

## MVP Features

### P0 - Core (Must Have)

#### Category Management
- [ ] Display tabs for all categories
- [ ] Add new category
- [ ] Rename category
- [ ] Delete category (with confirmation)
- [ ] Drag to reorder tabs

#### Customer Management
- [ ] List customers in current category
- [ ] Add customer (name, source, invoice company)
- [ ] Edit customer
- [ ] Delete customer
- [ ] Show stats (total, profit, pending)

#### Transaction Management
- [ ] List transactions by customer (grouped by month)
- [ ] Add transaction (select month)
- [ ] Edit transaction (profit, paid status)
- [ ] Delete transaction
- [ ] Auto-calculate total amount
- [ ] Prominent month headers

#### Order Item Management
- [ ] Add order item (type, route, ticket#, amount)
- [ ] Edit order item
- [ ] Delete order item
- [ ] Comment on each item

#### Search & Filter (Critical MVP)
- [ ] Global search bar
- [ ] Search customers, routes, ticket numbers
- [ ] Highlight matched text
- [ ] Filter by category
- [ ] Filter by month/date range
- [ ] Filter by payment status

#### Packaging
- [ ] Windows installer (.exe)
- [ ] App icon

### P1 - Important (Post-MVP)
- [ ] Export to Excel
- [ ] Data backup/restore
- [ ] Batch mark as paid
- [ ] Monthly/yearly reports
- [ ] macOS build

### P2 - Nice to Have
- [ ] AI quick entry (paste text, auto-parse)
- [ ] Dark mode
- [ ] Auto-update
- [ ] Print function

---

## Development Commands

```bash
# Install dependencies
pnpm install

# Initialize database
pnpm prisma generate
pnpm prisma db push

# Development
pnpm dev

# Build
pnpm build

# Package for Windows
pnpm build:win

# Package for macOS
pnpm build:mac
```

---

## Design References

See separate document: `Google Stitch UI Prompts`

Key design principles:
- Modern, clean, minimalist with subtle tech aesthetic
- NOT flashy - prioritize clarity for 50+ user
- All UI text in Chinese
- Month headers should be PROMINENT
- Every block can have comments
- Numbers clearly aligned

---

## Decisions Made

- [x] Desktop framework: Electron
- [x] Scaffolding: electron-vite
- [x] Frontend: React + Vite + TypeScript
- [x] Styling: Tailwind CSS + shadcn/ui
- [x] ORM: Prisma
- [x] Database: SQLite (in userData directory)
- [x] Package manager: pnpm
- [x] Data model: Category → Customer → Transaction → OrderItem
- [x] Core feature: Search + Filter
- [x] Every block has comment field

## Open Questions

- [ ] Need macOS version?
- [ ] Backup strategy (export JSON / copy db file)

---

## Development Workflow

### Recommended Order

```
Phase 1: Design (1-2 hours)
├── Use Google Stitch to generate UI for each page
├── Export code from Stitch
├── Save to design-references/ folder
└── Take screenshots for reference

Phase 2: Project Setup (Claude Code)
├── Initialize electron-vite project
├── Configure Prisma + SQLite
├── Setup Tailwind + shadcn/ui
└── Create folder structure

Phase 3: Implementation (Claude Code)
├── Read design-references/ code
├── Implement components using shadcn/ui
├── Match Stitch design as closely as possible
├── Connect to Prisma backend
└── Test each feature

Phase 4: Polish & Package
├── Fix bugs
├── Test with real data
├── Build Windows installer
└── Test installation on clean machine
```

---

## Step-by-Step Project Initialization

### Step 1: Create Project with electron-vite

```bash
# Create new project
pnpm create @quick-start/electron travel-agent-app --template react-ts

# Navigate to project
cd travel-agent-app

# Install dependencies
pnpm install
```

### Step 2: Install Additional Dependencies

```bash
# Tailwind CSS
pnpm add -D tailwindcss postcss autoprefixer
pnpm dlx tailwindcss init -p

# Prisma
pnpm add prisma @prisma/client
pnpm add -D prisma

# shadcn/ui dependencies
pnpm add tailwindcss-animate class-variance-authority clsx tailwind-merge
pnpm add lucide-react
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-popover @radix-ui/react-collapsible @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-slot

# Utilities
pnpm add uuid
pnpm add -D @types/uuid
```

### Step 3: Configure Tailwind CSS

**tailwind.config.js**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/renderer/index.html",
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

**src/renderer/styles/globals.css**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 210 40% 98%;
    --foreground: 222 84% 5%;
    --card: 0 0% 100%;
    --card-foreground: 222 84% 5%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 84% 5%;
    --primary: 221 83% 53%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222 47% 11%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;
    --accent: 210 40% 96%;
    --accent-foreground: 222 47% 11%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 210 40% 98%;
    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --ring: 221 83% 53%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### Step 4: Initialize Prisma

```bash
# Initialize Prisma with SQLite
pnpm prisma init --datasource-provider sqlite
```

**prisma/schema.prisma** - Copy the schema from Data Model section above.

**.env**
```
DATABASE_URL="file:./data.db"
```

**Note**: In production, the database path will be dynamically set to `app.getPath('userData')`.

### Step 5: Create Folder Structure

```bash
# Create main process folders
mkdir -p src/main/ipc
mkdir -p src/main/services

# Create renderer folders
mkdir -p src/renderer/components/layout
mkdir -p src/renderer/components/category
mkdir -p src/renderer/components/customer
mkdir -p src/renderer/components/transaction
mkdir -p src/renderer/components/order-item
mkdir -p src/renderer/components/comment
mkdir -p src/renderer/components/ui
mkdir -p src/renderer/hooks
mkdir -p src/renderer/types
mkdir -p src/renderer/lib
mkdir -p src/renderer/styles

# Create design references folder
mkdir -p design-references

# Create Claude config folder
mkdir -p .claude
```

### Step 6: Create CLAUDE.md

Create `CLAUDE.md` in project root with content from Claude Code Configuration section.

### Step 7: Create .claude/settings.json

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Edit", 
      "Write",
      "Bash(pnpm:*)",
      "Bash(npx:*)",
      "Bash(mkdir:*)",
      "Bash(rm:*)",
      "Bash(cat:*)",
      "Bash(ls:*)",
      "Bash(cd:*)"
    ],
    "deny": []
  }
}
```

### Step 8: Create design-references/README.md

```markdown
# Design References

This folder contains UI code exported from Google Stitch.
These are REFERENCE files - do not import directly.

## How to Use

1. Look at the HTML/CSS structure for layout reference
2. Check screenshots for visual reference  
3. Implement using shadcn/ui components in src/renderer/components/
4. Match the design as closely as possible

## Folder Structure

- `main-page/` - Main page with category tabs and customer list
- `search-filter/` - Search bar and filter panel
- `customer-form/` - Add/edit customer modal
- `transaction-form/` - Add/edit transaction form
- `order-item-row/` - Order item inline editing
- `comment-popover/` - Comment popover UI
- `category-tabs/` - Category tab management

## Notes

- All UI text should be in Chinese
- Use shadcn/ui components, not raw HTML
- Match colors from the design system in ARCHITECTURE.md
```

### Step 9: Verify Setup

```bash
# Generate Prisma client
pnpm prisma generate

# Push schema to database
pnpm prisma db push

# Start dev server (should open Electron window)
pnpm dev
```

---

## Initial Prompt for Claude Code

After setting up the project and adding Stitch designs, use this prompt:

```
I'm building a desktop app for my mom who is a travel booking agent. 
She needs to track payments made on behalf of customers.

Please read these files first:
1. CLAUDE.md - Project instructions
2. ARCHITECTURE.md - Full architecture design
3. design-references/ - UI code exported from Google Stitch

The app structure:
- Category tabs (like Excel sheet tabs at bottom)
- Each category has customers
- Each customer has transactions (grouped by month)
- Each transaction has order items (flights, hotels, insurance)
- Every item can have comments
- Global search + filter is critical

Please start by:
1. Setting up the Prisma database connection in main process
2. Creating IPC handlers for all CRUD operations
3. Implementing the main page layout matching the Stitch design
4. Using shadcn/ui components throughout

Key requirements:
- All UI text in Chinese
- Month headers should be prominent (colored background)
- Every block needs comment functionality
- Search should work across customers, routes, ticket numbers

Let's start with the database setup and IPC handlers first.
```

---

## Stitch Export Instructions

When exporting from Google Stitch:

1. **Generate each page separately** using the prompts from `Google Stitch UI Prompts` document

2. **Export code** from each design:
   - Click "Export" or "Get Code"
   - Download HTML + CSS

3. **Organize in design-references/**:
   ```
   design-references/
   ├── main-page/
   │   ├── index.html      # Stitch exported HTML
   │   ├── styles.css      # Stitch exported CSS
   │   └── screenshot.png  # Screenshot of the design
   └── ...
   ```

4. **Take screenshots** of each design for quick reference

5. **Add notes** if Stitch couldn't generate something correctly:
   ```
   design-references/main-page/NOTES.md
   
   - Search bar should be wider
   - Tab active state needs more contrast
   - Month header background color: #EFF6FF
   ```
