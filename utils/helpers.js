import { randomBytes } from 'node:crypto';

/**
 * Format a number as a currency string, e.g. 1000 -> "KES 1000.00".
 * Throws on non-numeric or negative input.
 */
export function formatAmount(amount, currency = 'KES') {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    throw new TypeError('Amount must be a finite number');
  }
  if (amount < 0) {
    throw new RangeError('Amount cannot be negative');
  }
  return `${currency} ${amount.toFixed(2)}`;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns true for a plausible email address, false otherwise (never throws). */
export function isValidEmail(email) {
  return typeof email === 'string' && email.length <= 254 && EMAIL_PATTERN.test(email);
}

/** "Hello, World!" -> "hello-world" */
export function slugify(text) {
  if (typeof text !== 'string') {
    throw new TypeError('Text must be a string');
  }
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Generate a unique reference such as "REF-LZ4K2M9A-9F3A1C7E". */
export function generateRef(prefix = 'REF') {
  const time = Date.now().toString(36);
  const random = randomBytes(4).toString('hex');
  return `${prefix}-${time}-${random}`.toUpperCase();
}
