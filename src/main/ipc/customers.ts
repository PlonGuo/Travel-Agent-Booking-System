import { ipcMain } from 'electron'
import { customerService } from '../services/customerService'

export function registerCustomerHandlers() {
  ipcMain.handle('customers:getByCategory', async (_, categoryId: string) => {
    return await customerService.getByCategory(categoryId)
  })

  ipcMain.handle(
    'customers:create',
    async (
      _,
      data: {
        categoryId: string
        name: string
        source?: string
        invoiceCompany?: string
        comment?: string
      }
    ) => {
      return await customerService.create(data)
    }
  )

  ipcMain.handle(
    'customers:update',
    async (
      _,
      id: string,
      data: {
        name?: string
        source?: string
        invoiceCompany?: string
        comment?: string
      }
    ) => {
      return await customerService.update(id, data)
    }
  )

  ipcMain.handle('customers:delete', async (_, id: string) => {
    return await customerService.delete(id)
  })
}
