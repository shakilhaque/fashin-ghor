import { randomInt } from 'crypto';

export function generateOtpCode(length: number): string {
  const digits = Array.from({ length }, () => randomInt(0, 10));
  return digits.join('');
}
