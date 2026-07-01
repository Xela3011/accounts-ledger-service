const decimalScale = 4n;
const decimalFactor = 10_000n;
//este regex filtra para que el primer numero sea distinto de cero para que no se ponga 007, por ejemplo.
const decimalPattern = /^(?:0|[1-9]\d*)(?:\.\d{1,4})?$/;
//se usa bigint en vez de number para evitar los errores de redondeo de la coma flotante en JavaScript
//Ejemplos inválidos: "01", "12.34567" (más de 4 decimales), "-5" (no acepta negativos), ".5" (falta la parte entera)
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
