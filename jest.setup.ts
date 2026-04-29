import '@testing-library/jest-dom'

// Suppress React 19 act() warning in jsdom — this is a known limitation with
// React 19 concurrent mode and testing environments that do not support it.
const originalError = console.error.bind(console)
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('not configured to support act')) return
    originalError(...args)
  }
})
afterAll(() => {
  console.error = originalError
})
