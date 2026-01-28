import { ipcMain, BrowserWindow } from 'electron'
import { reconciliationService } from '../services/reconciliationService'
import { exportReconciliation } from '../services/excelService'

export function registerReconciliationHandlers() {
  ipcMain.handle('reconciliation:getCompanies', async (_, month: string) => {
    return await reconciliationService.getInvoiceCompanies(month)
  })

  ipcMain.handle(
    'reconciliation:getOrderItems',
    async (_, month: string, invoiceCompany: string) => {
      return await reconciliationService.getOrderItemsByCompany(month, invoiceCompany)
    }
  )

  ipcMain.handle(
    'reconciliation:export',
    async (_, month: string, invoiceCompany: string) => {
      const mainWindow = BrowserWindow.getFocusedWindow()
      return await exportReconciliation(mainWindow, month, invoiceCompany)
    }
  )
}
