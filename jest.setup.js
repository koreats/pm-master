// Jest setup file
import '@testing-library/jest-dom'

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/test-path',
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Add Web API globals for Node.js test environment
global.Request = class Request {
  constructor(input, init = {}) {
    this.url = input
    this.method = init.method || 'GET'
    this.headers = new global.Headers(init.headers)
    this.body = init.body
  }
}

global.Headers = class Headers {
  constructor(init = {}) {
    this.headers = new Map()
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.set(key, value)
      })
    }
  }
  
  set(name, value) {
    this.headers.set(name.toLowerCase(), value)
  }
  
  get(name) {
    return this.headers.get(name.toLowerCase()) || null
  }
  
  has(name) {
    return this.headers.has(name.toLowerCase())
  }
}

// Suppress console warnings in tests unless debugging
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning:') &&
      (args[0].includes('ReactDOM.render') || args[0].includes('act'))
    ) {
      return
    }
    originalConsoleError.call(console, ...args)
  }

  console.warn = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('componentWillReceiveProps')) {
      return
    }
    originalConsoleWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})