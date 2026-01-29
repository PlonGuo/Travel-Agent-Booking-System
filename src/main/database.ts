import { PrismaClient } from '@prisma/client'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let prisma: PrismaClient

async function migrateDatabase(client: PrismaClient): Promise<void> {
  console.log('Checking for schema migrations...')

  // Migration: Add invoiceCompany column to OrderItem if it doesn't exist
  try {
    // Check if column exists by querying it
    await client.$queryRawUnsafe(`SELECT "invoiceCompany" FROM "OrderItem" LIMIT 1`)
    console.log('Migration: invoiceCompany column already exists')
  } catch {
    // Column doesn't exist, add it
    console.log('Migration: Adding invoiceCompany column to OrderItem...')
    await client.$executeRawUnsafe(`ALTER TABLE "OrderItem" ADD COLUMN "invoiceCompany" TEXT`)
    await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "OrderItem_invoiceCompany_idx" ON "OrderItem"("invoiceCompany")`)
    console.log('Migration: invoiceCompany column added successfully')
  }
}

async function initializeDatabase(client: PrismaClient): Promise<void> {
  try {
    // Check if tables exist by trying to count categories
    await client.category.count()
    console.log('Database tables already exist')

    // Run migrations for existing databases
    await migrateDatabase(client)
  } catch (error) {
    // Tables don't exist, create them
    console.log('Creating database tables...')

    await client.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Category" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL UNIQUE,
        "order" INTEGER NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      );
    `)

    await client.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Customer" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "categoryId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "source" TEXT,
        "invoiceCompany" TEXT,
        "comment" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE
      );
    `)

    await client.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Customer_categoryId_idx" ON "Customer"("categoryId");
    `)

    await client.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Customer_name_idx" ON "Customer"("name");
    `)

    await client.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Transaction" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "customerId" TEXT NOT NULL,
        "totalAmount" REAL NOT NULL DEFAULT 0,
        "profit" REAL NOT NULL DEFAULT 0,
        "comment" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE
      );
    `)

    await client.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Transaction_customerId_idx" ON "Transaction"("customerId");
    `)

    await client.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "OrderItem" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "transactionId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "route" TEXT NOT NULL,
        "ticketNumber" TEXT,
        "amount" REAL NOT NULL,
        "invoiceCompany" TEXT,
        "date" TEXT,
        "comment" TEXT,
        "isPaid" INTEGER NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE
      );
    `)

    await client.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "OrderItem_transactionId_idx" ON "OrderItem"("transactionId");
    `)

    await client.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "OrderItem_route_idx" ON "OrderItem"("route");
    `)

    await client.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "OrderItem_ticketNumber_idx" ON "OrderItem"("ticketNumber");
    `)

    await client.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "OrderItem_invoiceCompany_idx" ON "OrderItem"("invoiceCompany");
    `)

    await client.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "OrderItem_isPaid_idx" ON "OrderItem"("isPaid");
    `)

    // Create SchemaVersion table
    await client.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SchemaVersion" (
        "id" INTEGER NOT NULL PRIMARY KEY DEFAULT 1,
        "version" INTEGER NOT NULL UNIQUE,
        "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "name" TEXT NOT NULL
      );
    `)

    // Insert initial schema version
    await client.$executeRawUnsafe(`
      INSERT OR IGNORE INTO "SchemaVersion" ("id", "version", "name", "appliedAt")
      VALUES (1, 2, 'Initial schema with OrderItem.isPaid', CURRENT_TIMESTAMP);
    `)

    console.log('Database tables created successfully with schema version 2')
  }
}

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    let dbPath: string

    // In development (not packaged), use project directory database for easier access with Prisma Studio
    // In production (packaged), use userData directory for proper app data storage
    if (!app.isPackaged) {
      // Development mode - use project directory
      // __dirname is /path/to/project/out/main, so go up 2 levels to project root
      const projectRoot = path.join(__dirname, '../..')
      dbPath = path.join(projectRoot, 'prisma/data.db')

      // Ensure prisma directory exists
      const prismaDir = path.dirname(dbPath)
      if (!fs.existsSync(prismaDir)) {
        fs.mkdirSync(prismaDir, { recursive: true })
      }

      console.log('Running in DEVELOPMENT mode')
    } else {
      // Production mode - use userData directory
      const userDataPath = app.getPath('userData')

      // Ensure the directory exists
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true })
      }

      dbPath = path.join(userDataPath, 'data.db')
      console.log('Running in PRODUCTION mode')
    }

    process.env.DATABASE_URL = `file:${dbPath}`

    // Initialize Prisma client
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${dbPath}`
        }
      }
    })

    console.log(`Database initialized at: ${dbPath}`)
    console.log(`Database path exists: ${fs.existsSync(dbPath)}`)

    // Initialize database tables asynchronously
    initializeDatabase(prisma).then(async () => {
      // Log database stats
      try {
        const categoryCount = await prisma.category.count()
        const customerCount = await prisma.customer.count()
        console.log(`Database stats - Categories: ${categoryCount}, Customers: ${customerCount}`)
      } catch (error) {
        console.error('Failed to get database stats:', error)
      }
    }).catch(error => {
      console.error('Failed to initialize database:', error)
    })
  }

  return prisma
}

export async function closePrismaClient(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect()
    // @ts-ignore - allow resetting prisma to null
    prisma = null
    console.log('Prisma client disconnected and reset')
  }
}
