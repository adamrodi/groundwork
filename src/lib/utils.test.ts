import { describe, it, expect } from 'vitest'
import { formatCents } from './utils'

describe('formatCents', () => {
  it('formats zero', () => {
    const result = formatCents(0)
    expect(result).toContain('0.00')
    expect(result).toContain('$')
  })

  it('formats 100 cents as 1.00', () => {
    expect(formatCents(100)).toContain('1.00')
  })

  it('formats 9999 cents as 99.99', () => {
    expect(formatCents(9999)).toContain('99.99')
  })

  it('formats 100000 cents with thousands separator', () => {
    expect(formatCents(100000)).toContain('1,000.00')
  })

  it('formats 150 cents as 1.50', () => {
    expect(formatCents(150)).toContain('1.50')
  })
})
