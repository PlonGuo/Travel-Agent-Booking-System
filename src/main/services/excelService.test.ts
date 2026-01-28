import { describe, it, expect } from 'vitest'
import {
  isEmptyCell,
  isEmptyRow,
  isSummaryRow,
  parseNumber,
  parseString,
  parseTransactionGroup,
  groupRowsIntoTransactions,
  detectOrderItemType
} from './excelService'

describe('isEmptyCell', () => {
  it('should return true for null', () => {
    expect(isEmptyCell(null)).toBe(true)
  })

  it('should return true for undefined', () => {
    expect(isEmptyCell(undefined)).toBe(true)
  })

  it('should return true for 0', () => {
    expect(isEmptyCell(0)).toBe(true)
  })

  it('should return true for empty string', () => {
    expect(isEmptyCell('')).toBe(true)
  })

  it('should return true for whitespace string', () => {
    expect(isEmptyCell('   ')).toBe(true)
  })

  it('should return false for non-zero number', () => {
    expect(isEmptyCell(100)).toBe(false)
  })

  it('should return false for non-empty string', () => {
    expect(isEmptyCell('PEK-PAR')).toBe(false)
  })
})

describe('isEmptyRow', () => {
  it('should return true for null row', () => {
    expect(isEmptyRow(null as any)).toBe(true)
  })

  it('should return true for empty array', () => {
    expect(isEmptyRow([])).toBe(true)
  })

  it('should return true for row with all null values', () => {
    expect(isEmptyRow([null, null, null, null, null, null, null, null, null])).toBe(true)
  })

  it('should return true for row with only empty values in key columns', () => {
    // Key columns: Route (1), Ticket Number (2), Amount (3), Customer Name (6)
    // Other columns can have data but row should still be considered empty
    expect(isEmptyRow(['10月', null, null, null, null, null, null, null, null])).toBe(true)
  })

  it('should return false for row with route data', () => {
    expect(isEmptyRow([null, 'PEK-PAR', null, null, null, null, null, null, null])).toBe(false)
  })

  it('should return false for row with ticket number', () => {
    expect(isEmptyRow([null, null, '999-123456', null, null, null, null, null, null])).toBe(false)
  })

  it('should return false for row with non-zero amount', () => {
    expect(isEmptyRow([null, null, null, 100, null, null, null, null, null])).toBe(false)
  })

  it('should return false for row with customer name', () => {
    expect(isEmptyRow([null, null, null, null, null, null, '张三', null, null])).toBe(false)
  })

  it('should return true for row with 0 amount (amount=0 is empty)', () => {
    expect(isEmptyRow([null, null, null, 0, null, null, null, null, null])).toBe(true)
  })
})

describe('parseNumber', () => {
  it('should return number as is', () => {
    expect(parseNumber(100)).toBe(100)
  })

  it('should parse string with commas', () => {
    expect(parseNumber('29,152.00')).toBe(29152)
  })

  it('should parse negative numbers', () => {
    expect(parseNumber(-100)).toBe(-100)
  })

  it('should return 0 for null', () => {
    expect(parseNumber(null)).toBe(0)
  })

  it('should return 0 for undefined', () => {
    expect(parseNumber(undefined)).toBe(0)
  })
})

describe('parseString', () => {
  it('should return trimmed string', () => {
    expect(parseString('  hello  ')).toBe('hello')
  })

  it('should return null for empty string', () => {
    expect(parseString('')).toBe(null)
  })

  it('should return null for whitespace only', () => {
    expect(parseString('   ')).toBe(null)
  })

  it('should return null for null', () => {
    expect(parseString(null)).toBe(null)
  })

  it('should convert number to string', () => {
    expect(parseString(123)).toBe('123')
  })
})

describe('groupRowsIntoTransactions', () => {
  it('should group rows separated by empty rows', () => {
    const rows: (string | number | null)[][] = [
      // Transaction 1
      [null, 'PEK-PAR', '999-123', 100, 200, 50, '张三', '国旅', null],
      // Empty row
      [null, null, null, null, null, null, null, null, null],
      // Transaction 2
      [null, 'SHA-BJS', '888-456', 200, 300, 100, '李四', '国旅', null]
    ]

    const groups = groupRowsIntoTransactions(rows)
    expect(groups).toHaveLength(2)
    expect(groups[0]).toHaveLength(1)
    expect(groups[1]).toHaveLength(1)
  })

  it('should handle multiple rows per transaction', () => {
    const rows: (string | number | null)[][] = [
      // Transaction 1 - row 1
      [null, 'PEK-PAR', '999-123', 100, 200, 50, '张三', '国旅', null],
      // Transaction 1 - row 2
      [null, 'PEK-PAR REF', '999-123-REF', -100, null, null, null, '国旅', null],
      // Empty row
      [null, null, null, null, null, null, null, null, null],
      // Transaction 2
      [null, 'SHA-BJS', '888-456', 200, 300, 100, '李四', '国旅', null]
    ]

    const groups = groupRowsIntoTransactions(rows)
    expect(groups).toHaveLength(2)
    expect(groups[0]).toHaveLength(2) // First transaction has 2 rows
    expect(groups[1]).toHaveLength(1) // Second transaction has 1 row
  })

  it('should handle same customer name in different transactions', () => {
    const rows: (string | number | null)[][] = [
      // Transaction 1 for 张三
      [null, 'PEK-PAR', '999-123', 100, 200, 50, '张三', '国旅', null],
      // Empty row
      [null, null, null, null, null, null, null, null, null],
      // Transaction 2 for 张三 (same customer, different transaction!)
      [null, 'SHA-BJS', '888-456', 200, 300, 100, '张三', '国旅', null],
      // Empty row
      [null, null, null, null, null, null, null, null, null],
      // Transaction 3 for 张三
      [null, 'CAN-PEK', '777-789', 300, 400, 150, '张三', '国旅', null]
    ]

    const groups = groupRowsIntoTransactions(rows)
    expect(groups).toHaveLength(3) // Should be 3 separate transactions!
  })

  it('should handle transactions without customer name (作废)', () => {
    const rows: (string | number | null)[][] = [
      // Transaction without customer name
      [null, 'PEK-PAR', '999-123', 100, null, null, null, '国旅', null],
      // Empty row
      [null, null, null, null, null, null, null, null, null],
      // Another transaction without customer name
      [null, 'SHA-BJS', '888-456', 200, null, null, null, '国旅', null]
    ]

    const groups = groupRowsIntoTransactions(rows)
    expect(groups).toHaveLength(2) // Should detect 2 transactions
  })

  it('should handle row with only col A having data (month) as empty', () => {
    const rows: (string | number | null)[][] = [
      // Transaction 1
      [null, 'PEK-PAR', '999-123', 100, 200, 50, '张三', '国旅', null],
      // Row with only month in col A - should be treated as empty!
      ['10月', null, null, null, null, null, null, null, null],
      // Transaction 2
      [null, 'SHA-BJS', '888-456', 200, 300, 100, '李四', '国旅', null]
    ]

    const groups = groupRowsIntoTransactions(rows)
    expect(groups).toHaveLength(2) // The middle row should be treated as separator
  })

  it('should handle multiple consecutive empty rows', () => {
    const rows: (string | number | null)[][] = [
      // Transaction 1
      [null, 'PEK-PAR', '999-123', 100, 200, 50, '张三', '国旅', null],
      // Multiple empty rows
      [null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
      // Transaction 2
      [null, 'SHA-BJS', '888-456', 200, 300, 100, '李四', '国旅', null]
    ]

    const groups = groupRowsIntoTransactions(rows)
    expect(groups).toHaveLength(2)
  })

  it('should handle row with data in non-key columns as empty', () => {
    // This simulates Excel formatting where "empty" rows might have data
    // in col A (month), col E (total), col F (profit), col H (invoice), col I (comment)
    // but NOT in key columns (route, ticket, amount, customer)
    const rows: (string | number | null)[][] = [
      // Transaction 1
      [null, 'PEK-PAR', '999-123', 100, 200, 50, '张三', '国旅', null],
      // "Empty" row with some non-key data
      ['10月', null, null, null, 1000, 500, null, '某公司', '备注'],
      // Transaction 2
      [null, 'SHA-BJS', '888-456', 200, 300, 100, '李四', '国旅', null]
    ]

    const groups = groupRowsIntoTransactions(rows)
    expect(groups).toHaveLength(2) // Should treat middle row as separator
  })
})

describe('parseTransactionGroup', () => {
  it('should return null for empty group', () => {
    expect(parseTransactionGroup([])).toBe(null)
  })

  it('should parse single row transaction', () => {
    const rows: (string | number | null)[][] = [
      [null, 'PEK-PAR', '999-123', 100, 200, 50, '张三', '国旅', null]
    ]

    const result = parseTransactionGroup(rows)
    expect(result).not.toBe(null)
    expect(result!.customerName).toBe('张三')
    expect(result!.totalAmount).toBe(200)
    expect(result!.profit).toBe(50)
    expect(result!.orderItems).toHaveLength(1)
    expect(result!.orderItems[0].route).toBe('PEK-PAR')
  })

  it('should use 作废 for transaction without customer name', () => {
    const rows: (string | number | null)[][] = [
      [null, 'PEK-PAR', '999-123', 100, null, null, null, '国旅', null]
    ]

    const result = parseTransactionGroup(rows)
    expect(result).not.toBe(null)
    expect(result!.customerName).toBe('作废')
  })

  it('should parse multi-row transaction', () => {
    const rows: (string | number | null)[][] = [
      [null, 'PEK-PAR', '999-123', 29152, 29152, 100, '张三', '国旅', null],
      [null, 'PEK-PAR', '999-123-REF', -29152, null, null, null, '国旅', null]
    ]

    const result = parseTransactionGroup(rows)
    expect(result).not.toBe(null)
    expect(result!.customerName).toBe('张三')
    expect(result!.orderItems).toHaveLength(2)
    expect(result!.orderItems[0].amount).toBe(29152)
    expect(result!.orderItems[1].amount).toBe(-29152)
  })

  it('should extract customer name from first row that has it', () => {
    const rows: (string | number | null)[][] = [
      [null, 'PEK-PAR', '999-123', 100, 200, 50, null, '国旅', null], // No customer name
      [null, 'PEK-PAR', '999-456', 100, null, null, '张三', '国旅', null] // Has customer name
    ]

    const result = parseTransactionGroup(rows)
    expect(result!.customerName).toBe('张三')
  })
})

describe('detectOrderItemType', () => {
  it('should detect flight pattern', () => {
    expect(detectOrderItemType('PEK-PAR')).toBe('flight')
    expect(detectOrderItemType('SHA/BJS')).toBe('flight')
  })

  it('should detect hotel', () => {
    expect(detectOrderItemType('北京酒店')).toBe('hotel')
  })

  it('should detect train', () => {
    expect(detectOrderItemType('G123 北京-上海')).toBe('train')
    expect(detectOrderItemType('高铁票')).toBe('train')
  })

  it('should detect insurance', () => {
    expect(detectOrderItemType('电子保险')).toBe('insurance')
  })

  it('should return other for unknown', () => {
    expect(detectOrderItemType('其他服务')).toBe('other')
  })
})

describe('isSummaryRow', () => {
  it('should detect 合计 in col A', () => {
    expect(isSummaryRow(['合计', null, null, 100, 200, 50, null, null, null])).toBe(true)
  })

  it('should detect 总计 in col A', () => {
    expect(isSummaryRow(['总计', null, null, 100, 200, 50, null, null, null])).toBe(true)
  })

  it('should detect 小计 in col A', () => {
    expect(isSummaryRow(['小计', null, null, 100, 200, 50, null, null, null])).toBe(true)
  })

  it('should detect 合计 in col G (customer name)', () => {
    expect(isSummaryRow([null, null, null, null, null, null, '合计', null, null])).toBe(true)
  })

  it('should return false for normal row', () => {
    expect(isSummaryRow([null, 'PEK-PAR', '999-123', 100, 200, 50, '张三', '国旅', null])).toBe(false)
  })

  it('should return false for empty row', () => {
    expect(isSummaryRow([null, null, null, null, null, null, null, null, null])).toBe(false)
  })
})

describe('Summary/Total rows separation', () => {
  it('should treat summary row with 合计 in col A as separator', () => {
    const rows: (string | number | null)[][] = [
      // Transaction 1
      [null, 'PEK-PAR', '999-123', 100, 200, 50, '张三', '国旅', null],
      // Summary row with 合计 - should be treated as separator
      ['合计', null, null, 100, 200, 50, null, null, null],
      // Transaction 2
      [null, 'SHA-BJS', '888-456', 200, 300, 100, '李四', '国旅', null]
    ]

    const groups = groupRowsIntoTransactions(rows)
    // Now summary row is treated as separator, so we get 2 groups
    expect(groups).toHaveLength(2)
    expect(groups[0]).toHaveLength(1) // Only the transaction, not the summary
    expect(groups[1]).toHaveLength(1)
  })

  it('should NOT merge summary row into transaction', () => {
    const rows: (string | number | null)[][] = [
      // Transaction 1
      [null, 'PEK-PAR', '999-123', 100, 200, 50, '张三', '国旅', null],
      // Summary row - treated as separator now
      ['小计', null, null, 100, null, null, null, null, null],
      // Empty row
      [null, null, null, null, null, null, null, null, null],
      // Transaction 2
      [null, 'SHA-BJS', '888-456', 200, 300, 100, '李四', '国旅', null]
    ]

    const groups = groupRowsIntoTransactions(rows)

    // Fixed: group 0 now has only 1 row (the transaction, not the summary)
    expect(groups).toHaveLength(2)
    expect(groups[0]).toHaveLength(1)
  })

  it('should handle multiple summary rows between transactions', () => {
    const rows: (string | number | null)[][] = [
      // Transaction 1
      [null, 'PEK-PAR', '999-123', 100, 200, 50, '张三', '国旅', null],
      // Summary rows
      ['小计', null, null, 100, null, null, null, null, null],
      ['合计', null, null, 100, null, null, null, null, null],
      // Empty row
      [null, null, null, null, null, null, null, null, null],
      // Transaction 2
      [null, 'SHA-BJS', '888-456', 200, 300, 100, '李四', '国旅', null]
    ]

    const groups = groupRowsIntoTransactions(rows)
    expect(groups).toHaveLength(2)
    expect(groups[0]).toHaveLength(1)
    expect(groups[1]).toHaveLength(1)
  })
})

describe('Edge cases for isEmptyCell', () => {
  it('should handle non-breaking space as empty', () => {
    // Non-breaking space (U+00A0) might come from Excel
    expect(isEmptyCell('\u00A0')).toBe(true)
    expect(isEmptyCell('  \u00A0  ')).toBe(true)
  })

  it('should handle string "0" as NOT empty (it is a string, not number 0)', () => {
    // String "0" is NOT the same as number 0
    expect(isEmptyCell('0')).toBe(false)
  })

  it('should handle negative numbers as NOT empty', () => {
    expect(isEmptyCell(-100)).toBe(false)
    expect(isEmptyCell(-0.01)).toBe(false)
  })

  it('should handle very small numbers as NOT empty', () => {
    expect(isEmptyCell(0.001)).toBe(false)
  })
})

// Integration test simulating actual Excel data patterns
describe('Integration: Full import flow simulation', () => {
  it('should correctly count 35 transactions from user sample data pattern', () => {
    // Simulate the pattern the user described: 35 transactions separated by empty rows
    // with some having the same customer name
    const rows: (string | number | null)[][] = []

    // Create 35 transactions with varying patterns
    for (let i = 0; i < 35; i++) {
      // Add transaction rows (some have 1 row, some have 2)
      if (i % 3 === 0) {
        // Transaction with 2 rows (like the user's example)
        rows.push([null, 'PEK-PAR', `999-${i}`, 29152, 29152, 100, `客户${i % 5}`, '国旅', null])
        rows.push([null, 'PEK-PAR', `999-${i}-REF`, -29152, null, null, null, '国旅', null])
      } else if (i % 5 === 0) {
        // Transaction without customer name (should use 作废)
        rows.push([null, 'PEK-PAR', `888-${i}`, 1000, 1000, 50, null, '国旅', null])
      } else {
        // Normal single row transaction
        rows.push([null, 'SHA-BJS', `777-${i}`, 500, 500, 25, `客户${i % 5}`, '国旅', null])
      }

      // Add empty row as separator
      rows.push([null, null, null, null, null, null, null, null, null])
    }

    const groups = groupRowsIntoTransactions(rows)
    expect(groups).toHaveLength(35)

    // Parse each group and verify
    let transactionsWithCustomer = 0
    let transactionsWithZuofei = 0

    for (const group of groups) {
      const parsed = parseTransactionGroup(group)
      expect(parsed).not.toBe(null)

      if (parsed!.customerName === '作废') {
        transactionsWithZuofei++
      } else {
        transactionsWithCustomer++
      }
    }

    // Verify some transactions use 作废
    expect(transactionsWithZuofei).toBeGreaterThan(0)
    expect(transactionsWithCustomer).toBeGreaterThan(0)
    expect(transactionsWithCustomer + transactionsWithZuofei).toBe(35)
  })
})
