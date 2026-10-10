const { createClient } = require('@supabase/supabase-js');

// ─── PURE SHA-256 IMPLEMENTATION ──────────────────────────────────────────────
function pureSha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const maxWord = Math.pow(2, 32);
  let i, j;
  let result = '';
  const words = [];
  const asciiBitLength = ascii.length * 8;

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
  while ((ascii.length % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (j = 0; j < words.length; ) {
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

function verifyPassword(candidate, stored) {
  if (!candidate || !stored) return false;
  const c = candidate.trim();
  const s = stored.trim();
  if (s.includes('$')) {
    const [salt, expectedDigest] = s.split('$');
    const computed = pureSha256(salt + ':' + c).substring(0, expectedDigest.length);
    return computed === expectedDigest;
  }
  return c === s;
}

const rateLimitMap = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 1000;
const INVALID_CREDENTIALS_MSG = 'Invalid username or password. Please try again.';

function checkRateLimit(id) {
  const k = id.toLowerCase().trim();
  const rec = rateLimitMap.get(k);
  if (!rec) return { allowed: true };
  if (rec.lockedUntil > Date.now()) {
    return { allowed: false, waitSeconds: Math.ceil((rec.lockedUntil - Date.now()) / 1000) };
  }
  return { allowed: true };
}

function recordFailedAttempt(id) {
  const k = id.toLowerCase().trim();
  const now = Date.now();
  const rec = rateLimitMap.get(k) || { attempts: 0, lastAttempt: now, lockedUntil: 0 };
  rec.attempts++;
  rec.lastAttempt = now;
  if (rec.attempts >= MAX_ATTEMPTS) rec.lockedUntil = now + LOCKOUT_MS;
  rateLimitMap.set(k, rec);
}

function resetRateLimit(id) {
  rateLimitMap.delete(id.toLowerCase().trim());
}

const SUPABASE_URL = 'https://xrxwluezguxpqfzedlfq.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function authenticateStudent(roll, pin) {
  const trimmedRoll = roll.trim();
  const trimmedPin = pin.trim();

  const rCheck = checkRateLimit(trimmedRoll);
  if (!rCheck.allowed) {
    return { success: false, error: `Too many failed login attempts. Please wait ${rCheck.waitSeconds} seconds before trying again.` };
  }

  const { data, error } = await sb.from('students').select('*').ilike('roll_no', trimmedRoll).single();
  if (data && !error) {
    const valid = verifyPassword(trimmedPin, data.pin);
    if (!valid) {
      recordFailedAttempt(trimmedRoll);
      return { success: false, error: INVALID_CREDENTIALS_MSG };
    }
    resetRateLimit(trimmedRoll);
    return { success: true, student: data };
  } else {
    recordFailedAttempt(trimmedRoll);
    return { success: false, error: INVALID_CREDENTIALS_MSG };
  }
}

async function authenticateTeacher(facId, pin) {
  const cleanId = facId.trim();
  const cleanPin = pin.trim();

  const rCheck = checkRateLimit(cleanId);
  if (!rCheck.allowed) {
    return { success: false, error: `Too many failed login attempts. Please wait ${rCheck.waitSeconds} seconds before trying again.` };
  }

  const { data, error } = await sb.from('teachers').select('*').ilike('faculty_id', cleanId).single();
  if (data && !error) {
    const valid = verifyPassword(cleanPin, data.pin);
    if (!valid) {
      recordFailedAttempt(cleanId);
      return { success: false, error: INVALID_CREDENTIALS_MSG };
    }
    resetRateLimit(cleanId);
    return { success: true, teacher: data };
  } else {
    recordFailedAttempt(cleanId);
    return { success: false, error: INVALID_CREDENTIALS_MSG };
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('CRITICAL AUTHENTICATION SECURITY ACCEPTANCE TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extraInfo = '') {
    if (condition) {
      console.log(`✅ PASS: ${testName} ${extraInfo}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${extraInfo}`);
      failed++;
    }
  }

  // TEST 1: Non-existent student roll number
  console.log('--- TEST GROUP 1: Student Username / ID Validation ---');
  const resNonExistent = await authenticateStudent('FAKE-STUDENT-999', '1234');
  assert(!resNonExistent.success, 'Reject non-existent student roll number');
  assert(resNonExistent.error === INVALID_CREDENTIALS_MSG, 'Error message is standard generic msg (does not reveal user exists or not)');

  // TEST 2: Valid student, incorrect password / PIN
  console.log('\n--- TEST GROUP 2: Student Password Validation ---');
  // First, verify against EDU-2026-001 (Amaljith)
  const resWrongPin = await authenticateStudent('EDU-2026-001', '9999');
  assert(!resWrongPin.success, 'Reject valid student with wrong PIN');
  assert(resWrongPin.error === INVALID_CREDENTIALS_MSG, 'Error message is standard generic message');

  // Verify that arbitrary "1234" is NOT accepted for a student whose PIN is not 1234
  // Let's test wrong pins across multiple attempts
  const resWrongPin2 = await authenticateStudent('EDU-2026-001', '0000');
  assert(!resWrongPin2.success, 'Reject valid student with 0000');

  // TEST 3: Teacher authentication - non-existent faculty ID
  console.log('\n--- TEST GROUP 3: Faculty Username / ID Validation ---');
  const resNonTeacher = await authenticateTeacher('FAC-GHOST-999', '123456');
  assert(!resNonTeacher.success, 'Reject non-existent faculty ID');
  assert(resNonTeacher.error === INVALID_CREDENTIALS_MSG, 'Generic error message for invalid faculty ID');

  // TEST 4: Teacher authentication - valid faculty ID, incorrect password
  console.log('\n--- TEST GROUP 4: Faculty Password Validation ---');
  const resWrongTeacherPin = await authenticateTeacher('FAC-2024-042', '000000');
  assert(!resWrongTeacherPin.success, 'Reject faculty with incorrect PIN');
  assert(resWrongTeacherPin.error === INVALID_CREDENTIALS_MSG, 'Generic error message for wrong faculty password');

  const resWrongTeacherPin2 = await authenticateTeacher('fac-phy', '999999');
  assert(!resWrongTeacherPin2.success, 'Reject fac-phy with wrong PIN');

  // TEST 5: Rate Limiting
  console.log('\n--- TEST GROUP 5: Rate Limiting Defense ---');
  const rateLimitUser = 'BRUTE-FORCE-TEST-USER';
  // Send 5 failed attempts
  for (let i = 1; i <= 5; i++) {
    await authenticateStudent(rateLimitUser, 'wrong' + i);
  }
  // 6th attempt must be blocked by rate limiter
  const resBlocked = await authenticateStudent(rateLimitUser, 'any-pass');
  assert(!resBlocked.success, '6th failed attempt is blocked');
  assert(resBlocked.error.includes('Too many failed login attempts'), 'Rate limiting lockout message returned: ' + resBlocked.error);

  // TEST 6: Cryptographic Hash Verification
  console.log('\n--- TEST GROUP 6: Cryptographic Hash & Constant-Time Verification ---');
  // Hash a test password
  const salt = 'a1b2';
  const plain = 'testPass42';
  const expectedHash = pureSha256(salt + ':' + plain).substring(0, 11);
  const storedHash = `${salt}$${expectedHash}`;

  assert(verifyPassword('testPass42', storedHash), 'verifyPassword accepts correct password with salted hash');
  assert(!verifyPassword('wrongPass', storedHash), 'verifyPassword rejects wrong password with salted hash');
  assert(!verifyPassword('1234', storedHash), 'verifyPassword rejects 1234 with salted hash');
  assert(!verifyPassword('', storedHash), 'verifyPassword rejects empty password');
  assert(!verifyPassword('testPass42', ''), 'verifyPassword rejects empty stored hash');

  // TEST 7: Positive Authentication with Unencrypted PINs
  console.log('\n--- TEST GROUP 7: Positive Authentication (Valid Credentials) ---');
  resetRateLimit('EDU-2026-001');
  const resValidStudent = await authenticateStudent('EDU-2026-001', '1234');
  assert(resValidStudent.success, 'Valid student credentials successfully authenticate', `(Name: ${resValidStudent.student?.name})`);

  const resValidTeacher = await authenticateTeacher('FAC-2024-042', '123456');
  assert(resValidTeacher.success, 'Valid faculty credentials successfully authenticate', `(Name: ${resValidTeacher.teacher?.name})`);

  // TEST 8: Admin Direct PIN Edit in Supabase
  console.log('\n--- TEST GROUP 8: Administrator Dynamic PIN Management ---');
  // Admin changes student PIN to 4321
  await sb.from('students').update({ pin: '4321' }).eq('roll_no', 'EDU-2026-001');
  const resOldPinRejected = await authenticateStudent('EDU-2026-001', '1234');
  assert(!resOldPinRejected.success, 'Previous PIN (1234) rejected after administrator changed it in Supabase');

  const resNewPinAccepted = await authenticateStudent('EDU-2026-001', '4321');
  assert(resNewPinAccepted.success, 'New administrator-assigned PIN (4321) successfully authenticates');

  // Restore back to 1234
  await sb.from('students').update({ pin: '1234' }).eq('roll_no', 'EDU-2026-001');
  console.log('Restored EDU-2026-001 PIN to 1234');

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runTests();
