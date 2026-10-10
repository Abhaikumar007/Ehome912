import { AppStorage } from './storage';

// ─── 1. PURE SHA-256 IMPLEMENTATION (FIPS 180-4) ──────────────────────────────
export function pureSha256(ascii: string): string {
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i: number, j: number;
  let result = '';
  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  ascii += '\x80';
  while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] = i < 16 ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const t1 = (hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[i] + w[i]) | 0;
      const t2 = (rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj | 0;
      hash = [(t1 + t2) | 0, hash[0], hash[1], hash[2], (hash[3] + t1) | 0, hash[4], hash[5], hash[6]];
    }
    for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
  }
  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

// ─── 2. SALTED PASSWORD HASHING (COMPATIBLE WITH POSTGRES VARCHAR(16)) ─────────
/**
 * Hashes a PIN or password using a 4-hex random salt + 11-hex SHA256 digest.
 * Result format: "salt$hash" (exact length 16 characters).
 */
export function hashPassword(pinOrPassword: string): string {
  const salt = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .padStart(4, '0');
  const digest = pureSha256(salt + ':' + pinOrPassword).substring(0, 11);
  return `${salt}$${digest}`;
}

/**
 * Constant-time password verification against salted hash or legacy plain record.
 */
export function verifyPassword(candidate: string, storedHashOrPlain: string | null | undefined): boolean {
  if (!candidate || !storedHashOrPlain) return false;
  const trimmedCandidate = candidate.trim();
  const trimmedStored = storedHashOrPlain.trim();

  // Salted hash format: salt$hash
  if (trimmedStored.includes('$')) {
    const parts = trimmedStored.split('$');
    if (parts.length !== 2) return false;
    const [salt, expectedDigest] = parts;
    if (!salt || !expectedDigest) return false;
    const computed = pureSha256(salt + ':' + trimmedCandidate).substring(0, expectedDigest.length);
    if (computed.length !== expectedDigest.length) return false;
    let diff = 0;
    for (let i = 0; i < computed.length; i++) {
      diff |= computed.charCodeAt(i) ^ expectedDigest.charCodeAt(i);
    }
    return diff === 0;
  }

  // Legacy plain comparison
  return trimmedCandidate === trimmedStored;
}

// ─── 3. RATE LIMITING ────────────────────────────────────────────────────────
interface RateLimitRecord {
  attempts: number;
  lastAttempt: number;
  lockedUntil: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 1000; // 60 seconds

export function checkRateLimit(identifier: string): { allowed: boolean; waitSeconds?: number } {
  const key = identifier.toLowerCase().trim();
  const now = Date.now();
  const rec = rateLimitMap.get(key);

  if (!rec) {
    return { allowed: true };
  }

  if (rec.lockedUntil > now) {
    const waitSeconds = Math.ceil((rec.lockedUntil - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  // Reset if window has passed
  if (now - rec.lastAttempt > LOCKOUT_MS) {
    rateLimitMap.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedAttempt(identifier: string): void {
  const key = identifier.toLowerCase().trim();
  const now = Date.now();
  const rec = rateLimitMap.get(key) || { attempts: 0, lastAttempt: now, lockedUntil: 0 };

  rec.attempts += 1;
  rec.lastAttempt = now;

  if (rec.attempts >= MAX_ATTEMPTS) {
    rec.lockedUntil = now + LOCKOUT_MS;
  }

  rateLimitMap.set(key, rec);
}

export function resetRateLimit(identifier: string): void {
  const key = identifier.toLowerCase().trim();
  rateLimitMap.delete(key);
}

// ─── 4. STANDARD AUTH ERROR MESSAGES ──────────────────────────────────────────
export const INVALID_CREDENTIALS_MSG = 'Invalid username or password. Please try again.';

// ─── 5. SECURE SESSION TOKENS & STORAGE ───────────────────────────────────────
export interface AuthSession {
  token: string;
  userId: string;
  role: 'student' | 'teacher' | 'admin';
  loginTime: string;
}

const SESSION_PREFIX = 'eduhome_auth_session_';

export function generateSessionToken(role: string, userId: string): string {
  const entropy = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const signature = pureSha256(`${role}:${userId}:${entropy}`).substring(0, 24);
  return `eh_${role.substring(0, 3)}_${Date.now()}_${signature}`;
}

export async function saveAuthSession(
  role: 'student' | 'teacher' | 'admin',
  userId: string
): Promise<AuthSession> {
  const token = generateSessionToken(role, userId);
  const session: AuthSession = {
    token,
    userId,
    role,
    loginTime: new Date().toISOString(),
  };

  try {
    await AppStorage.setItem(SESSION_PREFIX + role, JSON.stringify(session));
  } catch (e) {
    console.warn('Failed to persist auth session:', e);
  }

  return session;
}

export async function getAuthSession(
  role: 'student' | 'teacher' | 'admin'
): Promise<AuthSession | null> {
  try {
    const raw = await AppStorage.getItem(SESSION_PREFIX + role);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    if (!session || !session.token || !session.userId || session.role !== role) {
      return null;
    }
    // Check 30-day session expiry
    const loginDate = new Date(session.loginTime).getTime();
    if (Date.now() - loginDate > 30 * 24 * 3600 * 1000) {
      await clearAuthSession(role);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export async function clearAuthSession(
  role?: 'student' | 'teacher' | 'admin'
): Promise<void> {
  try {
    if (role) {
      await AppStorage.removeItem(SESSION_PREFIX + role);
    } else {
      await AppStorage.removeItem(SESSION_PREFIX + 'student');
      await AppStorage.removeItem(SESSION_PREFIX + 'teacher');
      await AppStorage.removeItem(SESSION_PREFIX + 'admin');
    }
  } catch (e) {
    console.warn('Failed to clear session:', e);
  }
}
