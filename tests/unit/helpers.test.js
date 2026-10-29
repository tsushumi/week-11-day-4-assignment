import { describe, it, expect } from 'vitest';
import { formatAmount, generateRef } from '../../utils/helpers.js';

describe('formatAmount', () => {
  it('should format a whole number with two decimal places', () => {
    expect(formatAmount(1000)).toBe('KES 1000.00');
  });

  it('should handle zero correctly', () => {
    expect(formatAmount(0)).toBe('KES 0.00');
  });

  it('should throw on invalid input', () => {
    expect(() => formatAmount('abc')).toThrow(TypeError);
    expect(() => formatAmount(-5)).toThrow(RangeError);
  });
});

describe('generateRef', () => {
  it('should generate unique references', () => {
    const refs = new Set(Array.from({ length: 1000 }, () => generateRef()));
    expect(refs.size).toBe(1000);
  });
});
