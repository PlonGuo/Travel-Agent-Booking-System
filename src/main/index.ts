import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { getPrismaClient, closePrismaClient } from './database'
import { registerAllHandlers } from './ipc'
import { handleMigrationOnStartup } from './services/migrationService'

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Initialize database and handlers when app is ready
app.whenReady().then(async () => {
  // Initialize Prisma database connection
  getPrismaClient()

  // Check and handle database migrations
  const migrationSuccess = await handleMigrationOnStartup()

  if (!migrationSuccess) {
    // User cancelled or migration failed, quit the app
    console.log('Migration cancelled or failed, exiting app')
    app.quit()
    return
  }

  // Register all IPC handlers
  registerAllHandlers()

  // Create the main window
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Cleanup on app quit
app.on('will-quit', async () => {
  await closePrismaClient()
})

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
