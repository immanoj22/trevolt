import { feeManagment, toCutOff, toFixedNumber } from '../calculationlib';

describe('feeManagment', () => {
  const currency = {
    gstFee: 18,
    depositFee: 1,
    withdrawalFee: 2,
    tdsFee: 1,
  };

  test('calculates deposit fees correctly', async () => {
    const result = await feeManagment(1000, currency, false);
    expect(result.gst).toBe(180);
    expect(result.fee).toBe(10);
    expect(result.tds).toBe(0);
    expect(result.totalFee).toBe(190);
  });

  test('calculates withdrawal fees with TDS', async () => {
    const result = await feeManagment(1000, currency, true);
    expect(result.gst).toBe(180);
    expect(result.fee).toBe(20);
    expect(result.tds).toBe(10);
    expect(result.totalFee).toBe(210);
  });

  test('handles string amount input', async () => {
    const result = await feeManagment('500', currency, false);
    expect(result.gst).toBe(90);
  });

  test('returns zero fees on error', async () => {
    const result = await feeManagment(1000, null);
    expect(result).toEqual({ gst: 0, fee: 0, tds: 0, totalFee: 0 });
  });
});

describe('toCutOff', () => {
  test('truncates to 6 decimal places by default', () => {
    const result = toCutOff(1.123456789);
    expect(Number(result)).toBe(1.123456);
  });

  test('truncates to custom decimal places', () => {
    const result = toCutOff(1.9999999, 2);
    expect(Number(result)).toBe(1.99);
  });

  test('returns value unchanged when decimals are within limit', () => {
    const result = toCutOff(1.12, 6);
    expect(result).toBe('1.12');
  });

  test('returns 0 for empty/falsy value', () => {
    expect(toCutOff(0)).toBe(0);
    expect(toCutOff('')).toBe(0);
  });

  test('handles integer input without decimals', () => {
    const result = toCutOff(100);
    expect(Number(result)).toBe(100);
  });
});

describe('toFixedNumber', () => {
  test('returns regular numbers unchanged', () => {
    expect(toFixedNumber(100)).toBe(100);
  });

  test('converts scientific notation small numbers to decimal string', () => {
    const result = toFixedNumber(1.5e-7);
    expect(result.toString()).toContain('0.00000015');
  });

  test('handles zero', () => {
    expect(toFixedNumber(0)).toBe(0);
  });

  test('handles negative values', () => {
    expect(toFixedNumber(-123.45)).toBe(-123.45);
  });
});
