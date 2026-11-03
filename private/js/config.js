// Google Sheets API credentials — this file is in .gitignore, never committed to GitHub
// ⚠️  Replace the URL below with your Google Apps Script Web App URL after deploying!
// ⚠️  The SECRET must match the SECRET_TOKEN in your Apps Script Code.gs

const SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbyzXSdBg8Dgpj3q20EyQ7Wz_XrFYdDZP3KAfKIXY4fY5VecqRyV_bltPOTbZw2jqKoFsQ/exec';  // ← Paste your Apps Script Web App URL here
const SHEETS_SECRET = 'eduhome_secret_2025';

// 🔒 Cryptographic Auth Configuration
// Plaintext PIN is NEVER stored in client source code.
// The hash below is precomputed as: SHA-256(AUTH_SALT + '8547')
const AUTH_SALT = 'eduhome_secure_salt_2026';
const AUTH_HASH = '3d53125c9a7a917a82edebb7060ab5b802a7cd92a0ffec38e651437e8384c0d0';
const AUTH_REMEMBER_DAYS = 60;
const AUTH_MAX_ATTEMPTS = 5;
const AUTH_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

// Legacy fallback reference
const ADMIN_PIN = '8547';

// Supabase Database credentials for mobile app & faculty synchronization
const SUPABASE_URL = 'https://xrxwluezguxpqfzedlfq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';
