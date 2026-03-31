import crypto from 'crypto';

const SALT = 'campus-bustrack-salt';
const ITERATIONS = 100000;
const KEY_LEN = 64;
const DIGEST = 'sha512';

export function hashPassword(plain) {
  return crypto.pbkdf2Sync(plain, SALT, ITERATIONS, KEY_LEN, DIGEST).toString('hex');
}

export function verifyPassword(plain, hash) {
  if (!hash || typeof hash !== 'string') return false;
  try {
    const a = Buffer.from(hashPassword(plain), 'hex');
    const b = Buffer.from(hash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

