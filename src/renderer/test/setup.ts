import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Electron IPC for renderer tests
global.window = global.window || {}
// @ts-ignore
global.window.api = {
  // Mock IPC methods here as needed for tests
  getCustomers: async () => [],
  createCustomer: async () => ({ id: 'test-id' }),
  // Add more mocks as needed
}
