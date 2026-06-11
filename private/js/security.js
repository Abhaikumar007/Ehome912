/* ─────────────────────────────────────────────────────────────────
   security.js  —  Edu Home Admin Password Gate
   Blocks all private pages until the correct password is entered.
   Password is stored hashed in sessionStorage so it survives
   page navigation within the same browser tab session.
   ───────────────────────────────────────────────────────────────── */
(function () {

    // ── CONFIG ────────────────────────────────────────────────────
    // Change ADMIN_PASS to whatever you want the password to be.
    const ADMIN_PASS      = 'Eduhome@2025';   // ← your password here
    const SESSION_KEY     = 'eh_auth_ok';
    const SESSION_VALUE   = 'granted';        // simple flag

    // ── Already authenticated this session? ───────────────────────
    if (sessionStorage.getItem(SESSION_KEY) === SESSION_VALUE) {
        return; // Already logged in — let the page load normally
    }

    // ── Block page content immediately ───────────────────────────
    document.documentElement.style.visibility = 'hidden';

    // ── Inject login overlay ──────────────────────────────────────
    window.addEventListener('DOMContentLoaded', function () {

        document.documentElement.style.visibility = 'visible';

        // Blur/hide actual page body until auth
        document.body.style.filter = 'blur(8px)';
        document.body.style.pointerEvents = 'none';
        document.body.style.userSelect = 'none';

        const overlay = document.createElement('div');
        overlay.id = 'eh-login-overlay';
        overlay.innerHTML = `
            <style>
                #eh-login-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 99999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(10, 20, 40, 0.85);
                    backdrop-filter: blur(6px);
                    font-family: 'Segoe UI', sans-serif;
                }
                #eh-login-box {
                    background: #fff;
                    border-radius: 16px;
                    padding: 40px 36px 32px;
                    width: 90%;
                    max-width: 360px;
                    text-align: center;
                    box-shadow: 0 24px 60px rgba(0,0,0,0.35);
                }
                #eh-login-box h2 {
                    margin: 0 0 4px;
                    font-size: 1.5rem;
                    color: #003366;
                    font-weight: 700;
                }
                #eh-login-box p {
                    margin: 0 0 24px;
                    color: #6c757d;
                    font-size: 0.9rem;
                }
                #eh-pass-input {
                    width: 100%;
                    padding: 12px 14px;
                    font-size: 1rem;
                    border: 2px solid #dee2e6;
                    border-radius: 8px;
                    outline: none;
                    transition: border-color 0.2s;
                    box-sizing: border-box;
                }
                #eh-pass-input:focus { border-color: #0066cc; }
                #eh-pass-input.error { border-color: #dc3545; animation: eh-shake 0.3s; }
                #eh-login-btn {
                    width: 100%;
                    margin-top: 14px;
                    padding: 12px;
                    background: #003366;
                    color: #fff;
                    border: none;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                #eh-login-btn:hover { background: #0055aa; }
                #eh-error-msg {
                    color: #dc3545;
                    font-size: 0.85rem;
                    margin-top: 10px;
                    min-height: 20px;
                }
                @keyframes eh-shake {
                    0%,100%{ transform: translateX(0); }
                    25%    { transform: translateX(-6px); }
                    75%    { transform: translateX(6px); }
                }
            </style>

            <div id="eh-login-box">
                <div style="font-size:2.5rem; margin-bottom:10px;">🔐</div>
                <h2>Edu Home Admin</h2>
                <p>Enter admin password to continue</p>
                <input
                    type="password"
                    id="eh-pass-input"
                    placeholder="Password"
                    autocomplete="current-password"
                />
                <button id="eh-login-btn" onclick="ehCheckPass()">Login</button>
                <div id="eh-error-msg"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Focus input immediately
        setTimeout(function () {
            var inp = document.getElementById('eh-pass-input');
            if (inp) inp.focus();
        }, 100);

        // Allow Enter key
        document.getElementById('eh-pass-input').addEventListener('keydown', function (e) {
            if (e.key === 'Enter') ehCheckPass();
        });
    });

    // ── Password check function ───────────────────────────────────
    window.ehCheckPass = function () {
        var input = document.getElementById('eh-pass-input');
        var errEl = document.getElementById('eh-error-msg');

        if (!input) return;

        if (input.value === ADMIN_PASS) {
            // ✅ Correct — grant access
            sessionStorage.setItem(SESSION_KEY, SESSION_VALUE);
            document.getElementById('eh-login-overlay').remove();
            document.body.style.filter        = '';
            document.body.style.pointerEvents = '';
            document.body.style.userSelect    = '';
        } else {
            // ❌ Wrong — shake and show error
            input.classList.remove('error');
            void input.offsetWidth; // reflow to restart animation
            input.classList.add('error');
            input.value = '';
            if (errEl) errEl.textContent = 'Incorrect password. Try again.';
            setTimeout(function () { input.classList.remove('error'); }, 400);
        }
    };

})();
