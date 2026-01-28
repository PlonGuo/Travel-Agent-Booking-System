import { ipcMain, BrowserWindow } from 'electron'
import {
  importFromExcel,
  exportToExcel,
  selectImportFile,
  detectMonthFromExcel
} from '../services/excelService'

export function registerExcelHandlers() {
  // Select file for import
  ipcMain.handle('excel:selectFile', async () => {
    const mainWindow = BrowserWindow.getFocusedWindow()
    return await selectImportFile(mainWindow)
  })

  // Detect month from Excel file
  ipcMain.handle('excel:detectMonth', async (_, filePath: string) => {
    return detectMonthFromExcel(filePath)
  })

  // Import data from Excel
  ipcMain.handle(
    'excel:import',
    async (_, filePath: string, year: string, month: string) => {
      return await importFromExcel(filePath, year, month)
    }
  )

  // Export data to Excel
  ipcMain.handle('excel:export', async () => {
    const mainWindow = BrowserWindow.getFocusedWindow()
    return await exportToExcel(mainWindow)
  })
}
