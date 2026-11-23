import { describe, expect, it } from 'vitest';
import { formatCompactMoney, formatDate, formatMoney, formatPercent, salaryChangePct } from './format';
import { toQueryString } from './api';

describe('formatMoney', () => {
  it('formats whole amounts in the given currency', () => {
    expect(formatMoney(125000, 'USD')).toBe('$125,000');
    expect(formatMoney(2500000, 'INR')).toBe('₹2,500,000');
    expect(formatMoney(85000, 'EUR')).toBe('€85,000');
  });
});

describe('formatCompactMoney', () => {
  it('uses compact notation', () => {
    expect(formatCompactMoney(653_374_519)).toBe('$653.4M');
    expect(formatCompactMoney(58_696)).toBe('$58.7K');
  });
});

describe('salaryChangePct', () => {
  it('shows signed percentage change', () => {
    expect(salaryChangePct(100_000, 108_500)).toBe('+8.5%');
    expect(salaryChangePct(100_000, 90_000)).toBe('-10.0%');
  });
  it('returns null without a comparable previous salary', () => {
    expect(salaryChangePct(null, 1)).toBeNull();
  });
});

describe('formatPercent / formatDate', () => {
  it('formats', () => {
    expect(formatPercent(0.256)).toBe('26%');
    expect(formatDate('2024-03-05')).toBe('05 Mar 2024');
  });
});

describe('toQueryString', () => {
  it('drops empty values', () => {
    expect(toQueryString({ a: 1, b: '', c: undefined, d: 'x y' })).toBe('?a=1&d=x+y');
    expect(toQueryString({})).toBe('');
  });
});
