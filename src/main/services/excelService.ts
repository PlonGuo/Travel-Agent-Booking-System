import * as XLSX from 'xlsx'
import { dialog, BrowserWindow } from 'electron'
import { getPrismaClient } from '../database'
import { v4 as uuidv4 } from 'uuid'

export interface ImportResult {
  success: boolean
  categoriesCreated: number
  customersCreated: number
  transactionsCreated: number
  orderItemsCreated: number
  errors: string[]
}

export interface ParsedTransaction {
  customerName: string
  totalAmount: number
  profit: number
  orderItems: ParsedOrderItem[]
}

export interface ParsedOrderItem {
  type: string
  route: string
  ticketNumber: string | null
  amount: number
  invoiceCompany: string | null
  comment: string | null
}

// Detect order item type from route text
export function detectOrderItemType(route: string): string {
  if (!route) return 'other'
  const r = route.toLowerCase()
  if (r.includes('保险') || r.includes('电子保险')) return 'insurance'
  if (r.includes('酒店')) return 'hotel'
  if (r.includes('火车') || r.includes('高铁') || /g\d+/i.test(route)) return 'train'
  if (r.includes('租车') || r.includes('用车') || r.includes('地接')) return 'other'
  if (r.includes('签证')) return 'visa'
  // Check for flight patterns: 3-letter codes like SHA-PEK
  if (/[a-z]{3}[-/][a-z]{3}/i.test(route)) return 'flight'
  return 'other'
}

// Check if a cell is empty
export function isEmptyCell(cell: string | number | null | undefined): boolean {
  return (
    cell === null ||
    cell === undefined ||
    cell === 0 ||
    (typeof cell === 'string' && cell.trim() === '')
  )
}

// Check if a row is a summary row (contains 合计/总计/小计)
export function isSummaryRow(row: (string | number | null | undefined)[]): boolean {
  if (!row || row.length === 0) return false

  // Check col A (index 0) and col G (index 6) for summary keywords
  const colA = row[0]
  const colG = row[6]

  const summaryKeywords = ['合计', '总计', '小计']

  const checkForSummary = (cell: unknown): boolean => {
    if (typeof cell === 'string') {
      return summaryKeywords.some((keyword) => cell.includes(keyword))
    }
    return false
  }

  return checkForSummary(colA) || checkForSummary(colG)
}

// Check if a row is a transaction separator (no meaningful data in key columns)
// Key columns: Route (1), Ticket Number (2), Amount (3), Customer Name (6)
// Also treats summary rows as separators
export function isEmptyRow(row: (string | number | null | undefined)[]): boolean {
  if (!row || row.length === 0) return true

  // Summary rows should be treated as separators (not merged with transactions)
  if (isSummaryRow(row)) return true

  const route = row[1]
  const ticketNumber = row[2]
  const amount = row[3]
  const customerName = row[6]

  // A row is considered empty if all key columns are empty
  return (
    isEmptyCell(route) &&
    isEmptyCell(ticketNumber) &&
    isEmptyCell(amount) &&
    isEmptyCell(customerName)
  )
}

// Parse cell value as number, handling various formats
export function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const cleaned = value.replace(/[,\s]/g, '')
    const num = parseFloat(cleaned)
    return isNaN(num) ? 0 : num
  }
  return 0
}

// Parse cell value as string
export function parseString(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed === '' ? null : trimmed
  }
  return String(value)
}

// Group rows into transaction groups (separated by empty rows)
export function groupRowsIntoTransactions(
  dataRows: (string | number | null)[][]
): (string | number | null)[][][] {
  const transactionGroups: (string | number | null)[][][] = []
  let currentGroup: (string | number | null)[][] = []

  for (const row of dataRows) {
    if (isEmptyRow(row)) {
      if (currentGroup.length > 0) {
        transactionGroups.push(currentGroup)
        currentGroup = []
      }
    } else {
      currentGroup.push(row)
    }
  }

  // Don't forget the last group
  if (currentGroup.length > 0) {
    transactionGroups.push(currentGroup)
  }

  return transactionGroups
}

// Detect month from cell A1 (e.g., "10月" -> "10")
export function detectMonthFromExcel(filePath: string): string | null {
  try {
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames.find((name) => name.includes('月报表')) || workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]

    if (!sheet) return null

    const a1Value = sheet['A1']?.v
    if (!a1Value) return null

    const match = String(a1Value).match(/(\d+)月/)
    if (match) {
      return match[1].padStart(2, '0')
    }
    return null
  } catch (error) {
    console.error('Error detecting month from Excel:', error)
    return null
  }
}

// Import data from Excel file
export async function importFromExcel(
  filePath: string,
  year: string,
  month: string
): Promise<ImportResult> {
  const prisma = getPrismaClient()
  const result: ImportResult = {
    success: false,
    categoriesCreated: 0,
    customersCreated: 0,
    transactionsCreated: 0,
    orderItemsCreated: 0,
    errors: []
  }

  try {
    // Format month with padding
    const monthStr = `${year}-${month.padStart(2, '0')}`

    // Read Excel file
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames.find((name) => name.includes('月报表')) || workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]

    if (!sheet) {
      result.errors.push('无法找到月报表工作表')
      return result
    }

    // Convert sheet to array of arrays (skip header row)
    const data: (string | number | null)[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: true,
      defval: null
    })

    // Skip header row (row 0)
    const dataRows = data.slice(1)

    // Create or find category for this month
    let category = await prisma.category.findUnique({
      where: { name: monthStr }
    })

    if (!category) {
      // Get max order
      const maxOrder = await prisma.category.aggregate({
        _max: { order: true }
      })

      category = await prisma.category.create({
        data: {
          id: uuidv4(),
          name: monthStr,
          order: (maxOrder._max.order ?? -1) + 1,
          updatedAt: new Date()
        }
      })
      result.categoriesCreated = 1
    }

    // Group rows into transactions (separated by empty rows)
    const transactionGroups = groupRowsIntoTransactions(dataRows)

    // Process each transaction group
    for (const group of transactionGroups) {
      try {
        const parsed = parseTransactionGroup(group)
        if (!parsed) {
          continue
        }

        // Skip summary rows (rows that look like totals)
        if (parsed.customerName.includes('合计') || parsed.customerName.includes('总计')) {
          continue
        }

        // Find or create customer
        let customer = await prisma.customer.findFirst({
          where: {
            categoryId: category.id,
            name: parsed.customerName
          }
        })

        if (!customer) {
          customer = await prisma.customer.create({
            data: {
              id: uuidv4(),
              categoryId: category.id,
              name: parsed.customerName,
              updatedAt: new Date()
            }
          })
          result.customersCreated++
        }

        // Create transaction
        const transaction = await prisma.transaction.create({
          data: {
            id: uuidv4(),
            customerId: customer.id,
            totalAmount: parsed.totalAmount,
            profit: parsed.profit,
            updatedAt: new Date()
          }
        })
        result.transactionsCreated++

        // Create order items
        for (const item of parsed.orderItems) {
          if (!item.route && item.amount === 0) continue // Skip empty items

          await prisma.orderItem.create({
            data: {
              id: uuidv4(),
              transactionId: transaction.id,
              type: item.type,
              route: item.route || '',
              ticketNumber: item.ticketNumber,
              amount: item.amount,
              invoiceCompany: item.invoiceCompany,
              comment: item.comment,
              updatedAt: new Date()
            }
          })
          result.orderItemsCreated++
        }
      } catch (groupError) {
        result.errors.push(`处理交易组时出错: ${groupError}`)
      }
    }

    result.success = true
  } catch (error) {
    result.errors.push(`导入失败: ${error}`)
  }

  return result
}

// Parse a group of rows into a transaction
export function parseTransactionGroup(rows: (string | number | null)[][]): ParsedTransaction | null {
  if (rows.length === 0) return null

  // Column mapping (0-indexed):
  // 0: Month/Comment (col A)
  // 1: Route (col B - 行程)
  // 2: Ticket Number (col C - 票号)
  // 3: Amount to pay (col D - 应付)
  // 4: Total receivable (col E - 合计应收)
  // 5: Profit (col F - 利润)
  // 6: Customer name (col G - 客户)
  // 7: Invoice company (col H - 开票公司)
  // 8: Comment (col I - 备注)

  let customerName = ''
  let totalAmount = 0
  let profit = 0
  const orderItems: ParsedOrderItem[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]

    // Extract customer info from first row with customer name (col 6)
    const rowCustomerName = parseString(row[6])
    if (rowCustomerName && !customerName) {
      customerName = rowCustomerName
    }

    // Extract totalAmount from first row with value in col 4
    const rowTotalAmount = parseNumber(row[4])
    if (rowTotalAmount !== 0 && totalAmount === 0) {
      totalAmount = rowTotalAmount
    }

    // Extract profit from first row with value in col 5
    const rowProfit = parseNumber(row[5])
    if (rowProfit !== 0 && profit === 0) {
      profit = rowProfit
    }

    // Parse order item from each row
    const route = parseString(row[1])
    const ticketNumber = parseString(row[2])
    const amount = parseNumber(row[3])
    const invoiceCompany = parseString(row[7])

    // Combine comments from col 0 and col 8
    const colAComment = parseString(row[0])
    const colIComment = parseString(row[8])
    let comment: string | null = null
    if (colAComment && colIComment) {
      comment = `${colAComment} | ${colIComment}`
    } else {
      comment = colAComment || colIComment
    }

    // Only add if there's meaningful data
    if (route || ticketNumber || amount !== 0) {
      orderItems.push({
        type: detectOrderItemType(route || ''),
        route: route || '',
        ticketNumber,
        amount,
        invoiceCompany,
        comment
      })
    }
  }

  // Use "作废" as default name for transactions without a customer name
  if (!customerName) {
    customerName = '作废'
  }

  return {
    customerName,
    totalAmount,
    profit,
    orderItems
  }
}

// Export all data to Excel
export async function exportToExcel(mainWindow: BrowserWindow | null): Promise<string | null> {
  const prisma = getPrismaClient()

  try {
    // Show save dialog
    const result = await dialog.showSaveDialog(mainWindow || BrowserWindow.getFocusedWindow()!, {
      title: '导出数据',
      defaultPath: `报表_${new Date().toISOString().slice(0, 10)}.xlsx`,
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
    })

    if (result.canceled || !result.filePath) {
      return null
    }

    // Fetch all data
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        customers: {
          include: {
            transactions: {
              include: {
                orderItems: true
              },
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    })

    // Create workbook
    const workbook = XLSX.utils.book_new()

    // Create a sheet for each category (month)
    for (const category of categories) {
      const rows: (string | number | null)[][] = []

      // Header row
      rows.push(['', '行程', '票号', '应付', '合计（应收）', '利润', '客户', '开票公司', '备注'])

      // Add data for each customer
      for (const customer of category.customers) {
        for (const transaction of customer.transactions) {
          // First row of transaction has summary info
          let isFirstRow = true

          for (const item of transaction.orderItems) {
            const row: (string | number | null)[] = [
              isFirstRow ? category.name : null, // Col A: Month (only on first row)
              item.route, // Col B: Route
              item.ticketNumber, // Col C: Ticket Number
              item.amount, // Col D: Amount (应付)
              isFirstRow ? transaction.totalAmount : null, // Col E: Total (only on first row)
              isFirstRow ? transaction.profit : null, // Col F: Profit (only on first row)
              isFirstRow ? customer.name : null, // Col G: Customer (only on first row)
              item.invoiceCompany, // Col H: Invoice Company
              item.comment // Col I: Comment
            ]
            rows.push(row)
            isFirstRow = false
          }

          // If transaction has no items, still show transaction row
          if (transaction.orderItems.length === 0) {
            rows.push([
              category.name,
              null,
              null,
              null,
              transaction.totalAmount,
              transaction.profit,
              customer.name,
              null,
              transaction.comment
            ])
          }

          // Add empty row after each transaction
          rows.push([])
        }
      }

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(rows)

      // Set column widths
      worksheet['!cols'] = [
        { wch: 10 }, // A: Month
        { wch: 25 }, // B: Route
        { wch: 25 }, // C: Ticket Number
        { wch: 12 }, // D: Amount
        { wch: 15 }, // E: Total
        { wch: 12 }, // F: Profit
        { wch: 15 }, // G: Customer
        { wch: 15 }, // H: Invoice Company
        { wch: 20 } // I: Comment
      ]

      // Add sheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, category.name || '月报表')
    }

    // Write file
    XLSX.writeFile(workbook, result.filePath)

    return result.filePath
  } catch (error) {
    console.error('Export failed:', error)
    throw error
  }
}

// Select file for import
export async function selectImportFile(
  mainWindow: BrowserWindow | null
): Promise<string | null> {
  const result = await dialog.showOpenDialog(mainWindow || BrowserWindow.getFocusedWindow()!, {
    title: '选择要导入的Excel文件',
    filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
    properties: ['openFile']
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
}

// Export reconciliation data to Excel
export async function exportReconciliation(
  mainWindow: BrowserWindow | null,
  month: string,
  invoiceCompany: string
): Promise<string | null> {
  const prisma = getPrismaClient()

  try {
    // Show save dialog
    const result = await dialog.showSaveDialog(mainWindow || BrowserWindow.getFocusedWindow()!, {
      title: '导出对账单',
      defaultPath: `对账单_${invoiceCompany}_${month}.xlsx`,
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
    })

    if (result.canceled || !result.filePath) {
      return null
    }

    // Fetch order items for the company and month
    const items = await prisma.orderItem.findMany({
      where: {
        invoiceCompany,
        transaction: {
          customer: {
            category: {
              name: month
            }
          }
        }
      },
      include: {
        transaction: {
          include: {
            customer: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Create workbook
    const workbook = XLSX.utils.book_new()

    // Prepare data rows
    const rows: (string | number | null)[][] = []

    // Header row
    rows.push(['客户', '类型', '行程', '票号', '金额', '日期', '付款状态'])

    // Data rows
    const typeLabels: Record<string, string> = {
      flight: '机票',
      hotel: '酒店',
      insurance: '保险',
      train: '火车',
      visa: '签证',
      other: '其他'
    }

    for (const item of items) {
      rows.push([
        item.transaction.customer.name,
        typeLabels[item.type] || '其他',
        item.route,
        item.ticketNumber,
        item.amount,
        item.date,
        item.isPaid ? '已付' : '未付'
      ])
    }

    // Add total row - only sum unpaid items
    const unpaidItems = items.filter(item => !item.isPaid)
    const totalAmount = unpaidItems.reduce((sum, item) => sum + item.amount, 0)
    rows.push([])
    rows.push(['', '', '', '未付合计', totalAmount, '', ''])

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(rows)

    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // 客户
      { wch: 8 }, // 类型
      { wch: 25 }, // 行程
      { wch: 20 }, // 票号
      { wch: 12 }, // 金额
      { wch: 12 }, // 日期
      { wch: 10 } // 付款状态
    ]

    // Add sheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, `${month}_${invoiceCompany}`)

    // Write file
    XLSX.writeFile(workbook, result.filePath)

    return result.filePath
  } catch (error) {
    console.error('Export reconciliation failed:', error)
    throw error
  }
}
