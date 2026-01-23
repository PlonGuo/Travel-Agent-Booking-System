import { ipcMain } from 'electron'
import { transactionService } from '../services/transactionService'

export function registerTransactionHandlers() {
  ipcMain.handle('transactions:getByCustomer', async (_, customerId: string) => {
    return await transactionService.getByCustomer(customerId)
  })

  ipcMain.handle(
    'transactions:create',
    async (
      _,
      data: {
        customerId: string
        month: string
        profit?: number
        isPaid?: boolean
        comment?: string
      }
    ) => {
      return await transactionService.create(data)
    }
  )

  ipcMain.handle(
    'transactions:update',
    async (
      _,
      id: string,
      data: {
        month?: string
        profit?: number
        isPaid?: boolean
        comment?: string
      }
    ) => {
      return await transactionService.update(id, data)
    }
  )

  ipcMain.handle('transactions:delete', async (_, id: string) => {
    return await transactionService.delete(id)
  })
}
