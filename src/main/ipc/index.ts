import { registerCategoryHandlers } from './categories'
import { registerCustomerHandlers } from './customers'
import { registerTransactionHandlers } from './transactions'
import { registerOrderItemHandlers } from './orderItems'
import { registerSearchHandlers } from './search'

export function registerAllHandlers() {
  registerCategoryHandlers()
  registerCustomerHandlers()
  registerTransactionHandlers()
  registerOrderItemHandlers()
  registerSearchHandlers()
}
