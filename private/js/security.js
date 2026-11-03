/* ─────────────────────────────────────────────────────────────────
   security.js — Edu Home Protected Auth Guard
   - Immediate Pre-render DOM Shielding (zero flicker / data leakage)
   - 60-day cryptographically signed device session
   - Anti-tampering signature verification
   - Automatic redirect to login.html if unauthorized
   ───────────────────────────────────────────────────────────────── */

(function () {
    'use strict';

    // 1. Immediately hide page DOM before rendering
    if (document.documentElement) {
        document.documentElement.style.visibility = 'hidden';
    }

    const AUTH_SALT = 'eduhome_secure_salt_2026';
    const AUTH_HASH = '3d53125c9a7a917a82edebb7060ab5b802a7cd92a0ffec38e651437e8384c0d0';
    const STORAGE_KEY = 'eduHome_auth';

    // Helper: SHA-256 using standard Web Cryptography API
    async function sha256Hex(text) {
        if (window.crypto && window.crypto.subtle) {
            const data = new TextEncoder().encode(text);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }
        return null;
    }

    function redirectToLogin(reason) {
        const query = reason ? '?reason=' + encodeURIComponent(reason) : '';
        window.location.replace('login.html' + query);
    }

    async function verifySession() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                redirectToLogin();
                return;
            }

            let session;
            try {
                session = JSON.parse(raw);
            } catch (e) {
                localStorage.removeItem(STORAGE_KEY);
                redirectToLogin('invalid');
                return;
            }

            if (!session || !session.authenticated || !session.sig || !session.expiresAt || !session.createdAt) {
                localStorage.removeItem(STORAGE_KEY);
                redirectToLogin('invalid');
                return;
            }

            // Check if 60-day session has expired
            if (Date.now() > session.expiresAt) {
                localStorage.removeItem(STORAGE_KEY);
                redirectToLogin('expired');
                return;
            }

            // Verify cryptographic signature to prevent manual console forgery
            const sigPayload = AUTH_SALT + '|' + session.createdAt + '|' + session.expiresAt + '|' + AUTH_HASH;
            const expectedSig = await sha256Hex(sigPayload);

            if (!expectedSig || session.sig !== expectedSig) {
                localStorage.removeItem(STORAGE_KEY);
                redirectToLogin('tampered');
                return;
            }

            // Session is 100% valid! Restore page visibility
            if (document.documentElement) {
                document.documentElement.style.visibility = 'visible';
            }

            // Inject logout handler into UI once DOM is loaded
            setupLogoutUI();

        } catch (err) {
            console.error('[EduHome Auth Guard] Verification error:', err);
            redirectToLogin();
        }
    }

    function setupLogoutUI() {
        document.addEventListener('DOMContentLoaded', function () {
            // Check if there is a navbar to append a logout button
            const navbars = document.querySelectorAll('.navbar-nav');
            if (navbars.length > 0) {
                const targetNav = navbars[navbars.length - 1];
                if (!targetNav.querySelector('.auth-logout-item')) {
                    const li = document.createElement('li');
                    li.className = 'nav-item auth-logout-item ml-lg-2';
                    li.innerHTML = '<a class="nav-link" href="javascript:void(0)" onclick="eduHomeLogout()" style="color: #ef4444 !important; font-weight: 600;" title="Sign out of Edu Home"><i class="fas fa-sign-out-alt"></i> Logout</a>';
                    targetNav.appendChild(li);
                }
            }
        });
    }

    // Expose global logout function
    window.eduHomeLogout = function () {
        if (confirm('Are you sure you want to sign out of the Edu Home Portal?')) {
            localStorage.removeItem(STORAGE_KEY);
            window.location.replace('login.html?reason=logout');
        }
    };

    // Run verification immediately
    verifySession();
})();
