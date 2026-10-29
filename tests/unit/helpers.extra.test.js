import { describe, it, expect } from 'vitest';
import { formatAmount, isValidEmail, slugify, generateRef } from '../../utils/helpers.js';

describe('formatAmount (extras)', () => {
  it('rounds to two decimals and accepts a custom currency', () => {
    expect(formatAmount(10.456, 'USD')).toBe('USD 10.46');
  });

  it('rejects NaN and Infinity', () => {
    expect(() => formatAmount(NaN)).toThrow(TypeError);
    expect(() => formatAmount(Infinity)).toThrow(TypeError);
  });
});

describe('isValidEmail', () => {
  it('accepts valid emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('rejects invalid emails and non-strings', () => {
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(`${'a'.repeat(250)}@x.co`)).toBe(false);
  });
});

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('  Hello, World!  ')).toBe('hello-world');
  });

  it('returns an empty string for symbols only and throws for non-strings', () => {
    expect(slugify('***')).toBe('');
    expect(() => slugify(42)).toThrow(TypeError);
  });
});

describe('generateRef (extras)', () => {
  it('uses the given prefix in upper case', () => {
    expect(generateRef('pay')).toMatch(/^PAY-[0-9A-Z]+-[0-9A-F]{8}$/);
  });
});
