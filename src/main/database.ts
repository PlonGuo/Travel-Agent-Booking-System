import { PrismaClient } from '@prisma/client'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let prisma: PrismaClient

async function initializeDatabase(client: PrismaClient): Promise<void> {
  try {
    // Check if tables exist by trying to count categories
    await client.category.count()
    console.log('Database tables already exist')
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
        "month" TEXT NOT NULL,
        "totalAmount" REAL NOT NULL DEFAULT 0,
        "profit" REAL NOT NULL DEFAULT 0,
        "isPaid" INTEGER NOT NULL DEFAULT 0,
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
      CREATE INDEX IF NOT EXISTS "Transaction_month_idx" ON "Transaction"("month");
    `)

    await client.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "OrderItem" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "transactionId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "route" TEXT NOT NULL,
        "ticketNumber" TEXT,
        "amount" REAL NOT NULL,
        "date" TEXT,
        "comment" TEXT,
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

    console.log('Database tables created successfully')
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
  }
}
