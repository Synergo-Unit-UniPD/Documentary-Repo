import { describe, it, expect } from 'vitest'
import { FormatType } from './FormatType'

describe('FormatType', () => {
  it('dovrebbe contenere tutti i valori definiti a livello architetturale', () => {
    expect(FormatType.BOLD).toBe('BOLD')
    expect(FormatType.ITALIC).toBe('ITALIC')
    expect(FormatType.UNDERLINE).toBe('UNDERLINE')
    expect(FormatType.STRIKETHROUGH).toBe('STRIKETHROUGH')
    expect(FormatType.QUOTE).toBe('QUOTE')
    expect(FormatType.HEADING).toBe('HEADING')
  })
})
