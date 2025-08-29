import { cn } from '@/lib/utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      const result = cn('bg-red-500', 'text-white')
      expect(result).toBe('bg-red-500 text-white')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      const result = cn('base-class', isActive && 'active-class', false && 'hidden-class')
      expect(result).toBe('base-class active-class')
    })

    it('should handle Tailwind class conflicts', () => {
      const result = cn('bg-red-500', 'bg-blue-500')
      expect(result).toBe('bg-blue-500')
    })

    it('should handle empty or undefined inputs', () => {
      const result = cn('', undefined, null, false, 'text-white')
      expect(result).toBe('text-white')
    })
  })
})