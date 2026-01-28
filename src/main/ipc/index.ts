import { registerCategoryHandlers } from './categories'
import { registerCustomerHandlers } from './customers'
import { registerTransactionHandlers } from './transactions'
import { registerOrderItemHandlers } from './orderItems'
import { registerSearchHandlers } from './search'
import { registerExcelHandlers } from './excel'
import { registerReconciliationHandlers } from './reconciliation'

export function registerAllHandlers() {
  registerCategoryHandlers()
  registerCustomerHandlers()
  registerTransactionHandlers()
  registerOrderItemHandlers()
  registerSearchHandlers()
  registerExcelHandlers()
  registerReconciliationHandlers()
}
