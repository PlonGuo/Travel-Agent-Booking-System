import { ipcMain } from 'electron'
import { orderItemService } from '../services/orderItemService'

export function registerOrderItemHandlers() {
  ipcMain.handle(
    'orderItems:create',
    async (
      _,
      data: {
        transactionId: string
        type: string
        route: string
        ticketNumber?: string
        amount: number
        invoiceCompany?: string
        date?: string
        comment?: string
      }
    ) => {
      return await orderItemService.create(data)
    }
  )

  ipcMain.handle(
    'orderItems:update',
    async (
      _,
      id: string,
      data: {
        type?: string
        route?: string
        ticketNumber?: string
        amount?: number
        invoiceCompany?: string
        date?: string
        comment?: string
      }
    ) => {
      return await orderItemService.update(id, data)
    }
  )

  ipcMain.handle('orderItems:delete', async (_, id: string) => {
    return await orderItemService.delete(id)
  })
}
