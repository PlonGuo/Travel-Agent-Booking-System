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
  customers: {
    getByCategory: async () => [],
    create: async () => ({ id: 'test-id' }),
    update: async () => ({ id: 'test-id' }),
    delete: async () => {},
  },
  // Add more mocks as needed
}
