/* ─────────────────────────────────────────────────────────────────
   security.js  —  Edu Home Auth Guard
   Checks if a valid login session exists in localStorage.
   If not → redirects to login.html instantly (synchronous).
   Session is set by the PIN login and persists indefinitely.
   ───────────────────────────────────────────────────────────────── */
(function () {
    const AUTH_KEY = 'eduHome_auth';

    try {
        const raw = localStorage.getItem(AUTH_KEY);
        if (!raw) throw new Error('no session');

        const session = JSON.parse(raw);
        // Check that the session has a valid marker
        if (!session || !session.authenticated) throw new Error('invalid session');

        // ✅ Session exists — allow the page to load normally

    } catch (e) {
        // ❌ No valid session — hide page and redirect to login
        document.documentElement.style.display = 'none';
        window.location.replace('login.html');
    }
})();
