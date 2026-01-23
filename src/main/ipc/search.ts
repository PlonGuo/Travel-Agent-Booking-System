import { ipcMain } from 'electron'
import { searchService } from '../services/searchService'

interface SearchFilters {
  categoryId?: string
  month?: string
  isPaid?: boolean
}

export function registerSearchHandlers() {
  ipcMain.handle('search:global', async (_, query: string, filters?: SearchFilters) => {
    return await searchService.globalSearch(query, filters)
  })
}
