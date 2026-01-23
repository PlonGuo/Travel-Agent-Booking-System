import { ipcMain } from 'electron'
import { categoryService } from '../services/categoryService'

export function registerCategoryHandlers() {
  ipcMain.handle('categories:getAll', async () => {
    console.log('IPC: categories:getAll called')
    const result = await categoryService.getAll()
    console.log('IPC: categories:getAll result count:', result.length)
    console.log('IPC: categories data:', JSON.stringify(result, null, 2))
    return result
  })

  ipcMain.handle('categories:create', async (_, data: { name: string; order?: number }) => {
    return await categoryService.create(data)
  })

  ipcMain.handle(
    'categories:update',
    async (_, id: string, data: { name?: string; order?: number }) => {
      return await categoryService.update(id, data)
    }
  )

  ipcMain.handle('categories:delete', async (_, id: string) => {
    return await categoryService.delete(id)
  })

  ipcMain.handle('categories:reorder', async (_, ids: string[]) => {
    return await categoryService.reorder(ids)
  })
}
