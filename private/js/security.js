/* ─────────────────────────────────────────────────────────────────
   security.js  —  Edu Home Auth Guard
   Checks if a Supabase session exists in localStorage.
   If not → redirects to login.html instantly (synchronous).
   Supabase stores the session under:
       sb-{projectRef}-auth-token
   Session is auto-refreshed by Supabase and persists indefinitely,
   so a device only needs to log in once.
   ───────────────────────────────────────────────────────────────── */
(function () {
    const PROJECT_REF = 'fliozfydpgygmisocvcx';
    const AUTH_KEY    = 'sb-' + PROJECT_REF + '-auth-token';

    try {
        const raw = localStorage.getItem(AUTH_KEY);
        if (!raw) throw new Error('no session');

        const session = JSON.parse(raw);
        // Supabase v2 stores session as { access_token, refresh_token, ... }
        if (!session || !session.access_token) throw new Error('invalid session');

        // ✅ Session exists — allow the page to load normally

    } catch (e) {
        // ❌ No valid session — hide page and redirect to login
        document.documentElement.style.display = 'none';
        window.location.replace('login.html');
    }
})();
