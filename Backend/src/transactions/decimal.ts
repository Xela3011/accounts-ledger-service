const decimalScale = 4n;
const decimalFactor = 10_000n;
const decimalPattern = /^(?:0|[1-9]\d*)(?:\.\d{1,4})?$/;

export function isFixedDecimal(value: string): boolean {
  return decimalPattern.test(value);
}

export function parseFixedDecimal(value: string): bigint {
  const [whole, fraction = ''] = value.split('.');
  const scaledFraction = fraction.padEnd(Number(decimalScale), '0');

  return BigInt(whole) * decimalFactor + BigInt(scaledFraction);
}

export function formatFixedDecimal(value: bigint): string {
  const whole = value / decimalFactor;
  const fraction = value % decimalFactor;

  return `${whole.toString()}.${fraction.toString().padStart(Number(decimalScale), '0')}`;
}
