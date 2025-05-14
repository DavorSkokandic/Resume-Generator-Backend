import crypto from 'crypto';

export function genToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
