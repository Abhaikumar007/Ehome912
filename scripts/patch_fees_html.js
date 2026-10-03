const fs = require('fs');

const FILE_PATH = 'C:/Users/madhu/code_test/private/fees.html';
let content = fs.readFileSync(FILE_PATH, 'utf8');

// 1. Add All Classes option
if (!content.includes('value="all"')) {
    content = content.replace(
        '<option value="">Select Class to View</option>',
        '<option value="">Select Class to View</option>\n                    <option value="all">All Classes (Overview)</option>'
    );
    console.log('✓ Added All Classes option');
}

// 2. Add Receipt Proof th
if (!content.includes('<th>Receipt Proof</th>')) {
    content = content.replace(
        '<th>Transaction / UTR</th>\n                                <th>Submitted On</th>',
        '<th>Transaction / UTR</th>\n                                <th>Receipt Proof</th>\n                                <th>Submitted On</th>'
    );
    console.log('✓ Added Receipt Proof th header');
}

// 3. Update bottom script
const scriptStart = content.lastIndexOf('<script>');
if (scriptStart !== -1) {
    const newScript = `<script>
    // ── Direct Supabase Cloud Handlers for Fees Page ─────────────────

    document.addEventListener('DOMContentLoaded', function() {
        // Direct Supabase pull on page load
        if (typeof window.loadSupabaseFeesData === 'function') {
            window.loadSupabaseFeesData();
        } else if (typeof sb_loadFromCloud === 'function') {
            sb_loadFromCloud().then(function(result) {
                if (result && result.ok && typeof window.loadFeeTable === 'function') {
                    window.loadFeeTable();
                }
            });
        }
        if (typeof window.loadPendingVerifications === 'function') {
            window.loadPendingVerifications();
        }
    });

    async function runPullFromCloud() {
        const btn    = document.getElementById('pullCloudBtn');
        const status = document.getElementById('manualSyncStatus');

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Pulling...';
        status.innerHTML = '<span class="text-muted"><i class="fas fa-cloud-download-alt mr-1"></i>Downloading live fees from Supabase...</span>';

        let result = null;
        if (typeof window.loadSupabaseFeesData === 'function') {
            result = await window.loadSupabaseFeesData();
        } else if (typeof sb_loadFromCloud === 'function') {
            result = await sb_loadFromCloud();
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-cloud-download-alt mr-1"></i> Pull';

        if (result && result.ok) {
            status.innerHTML = '<span class="text-success" style="font-size:0.85rem;"><i class="fas fa-check-circle mr-1"></i>Successfully pulled live fees from Supabase!</span>';
            setTimeout(() => { if (status) status.innerHTML = ''; }, 4000);
        } else {
            status.innerHTML = '<span class="text-danger" style="font-size:0.85rem;"><i class="fas fa-exclamation-triangle mr-1"></i>Pull failed: ' + (result ? (result.msg || result.message) : 'Network error') + '</span>';
        }
    }

    async function runPushToCloud() {
        const btn    = document.getElementById('pushCloudBtn');
        const status = document.getElementById('manualSyncStatus');

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Pushing...';
        status.innerHTML = '<span class="text-muted"><i class="fas fa-cloud-upload-alt mr-1"></i>Uploading fees and students to Supabase cloud...</span>';

        const result = await sb_migrateFromLocalStorage();

        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-cloud-upload-alt mr-1"></i> Push';

        if (result && result.ok) {
            status.innerHTML = '<span class="text-success" style="font-size:0.85rem;"><i class="fas fa-check-circle mr-1"></i>Successfully pushed all data to Supabase cloud!</span>';
            setTimeout(() => { if (status) status.innerHTML = ''; }, 4000);
        } else {
            status.innerHTML = '<span class="text-danger" style="font-size:0.85rem;"><i class="fas fa-exclamation-triangle mr-1"></i>Push failed: ' + (result ? result.msg : 'Network error') + '</span>';
        }
    }
    </script>
</body>

</html>
`;

    content = content.slice(0, scriptStart) + newScript;
    console.log('✓ Successfully replaced script in fees.html');
}

fs.writeFileSync(FILE_PATH, content, 'utf8');
console.log('Saved updated fees.html ✓');
