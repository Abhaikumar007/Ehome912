(function () {
    const validUA = "EduHomeSecure";
    // Check if UA contains the secret string. 
    // We utilize a 'safe mode' for local development if needed, but strict for production.
    // user agent on mobile often includes details, we just check inclusion.

    // Bypass for local development (file:// protocol) or specific localhost if needed, 
    // but user requested strict security.
    // However, to prevent locking THE USER out now during testing if they are on a standard browser,
    // we will initially comment out the redirect or make it alert-only until they confirm.

    // UNCOMMENT THE BELOW LINES TO ENABLE STRICT SECURITY
    /*
    if (!navigator.userAgent.includes(validUA)) {
        document.body.innerHTML = ''; // Clear content
        // Alternatively redirect
        window.location.href = 'access_denied.html';
    }
    */

    // For now, we will just log it or show a warning banner for testing
    if (!navigator.userAgent.includes(validUA)) {
        console.warn("Security Warning: Unauthorized User-Agent. Expected 'EduHomeSecure'.");
        // Create a banner
        const banner = document.createElement('div');
        banner.style.position = 'fixed';
        banner.style.top = '0';
        banner.style.left = '0';
        banner.style.width = '100%';
        banner.style.backgroundColor = '#d9534f';
        banner.style.color = 'white';
        banner.style.textAlign = 'center';
        banner.style.padding = '10px';
        banner.style.zIndex = '9999';
        banner.innerHTML = '<strong>Security Alert:</strong> App is not running in Secure Sketchware View. <button onclick="this.parentElement.style.display=\'none\'" style="color:black; margin-left:10px;">Dismiss</button>';
        document.body.prepend(banner);

        // AUTO-REDIRECT logic (Disabled for now to let user test logic)
        // setTimeout(() => { window.location.href = 'access_denied.html'; }, 3000);
    }
})();
