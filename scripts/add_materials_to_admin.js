const fs = require('fs');

const hubHtmlPath = 'C:/Users/madhu/code_test/private/master_hub.html';
const hubJsPath = 'C:/Users/madhu/code_test/private/js/master_hub.js';

// 1. Update master_hub.html
let hubHtml = fs.readFileSync(hubHtmlPath, 'utf8');

// Add tab button if not already present
if (!hubHtml.includes('id="tab-materials-link"')) {
  const targetNav = `<li class="nav-item">
                <a class="nav-link" id="tab-broadcast-link" data-toggle="tab" href="#tab-broadcast" role="tab">`;
  const replacementNav = `<li class="nav-item">
                <a class="nav-link" id="tab-materials-link" data-toggle="tab" href="#tab-materials" role="tab">
                    <i class="fas fa-book-reader mr-2"></i>Study Materials & Notes
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" id="tab-broadcast-link" data-toggle="tab" href="#tab-broadcast" role="tab">`;

  hubHtml = hubHtml.replace(targetNav, replacementNav);

  // Add tab pane
  const targetPane = `<!-- TAB 2: BROADCAST ANNOUNCEMENTS -->`;
  const materialsPane = `<!-- TAB: STUDY MATERIALS & NOTES MANAGEMENT -->
            <div class="tab-pane fade" id="tab-materials" role="tabpanel">
                <div class="hub-card">
                    <div class="d-flex flex-wrap justify-content-between align-items-center mb-3">
                        <div>
                            <h5 class="font-weight-bold mb-1"><i class="fas fa-book-open text-primary mr-2"></i>Study Material Repository (Cloud & Mobile Sync)</h5>
                            <p class="text-muted small mb-0">Super Admin control to monitor and delete study materials published by teachers or administrators.</p>
                        </div>
                        <div class="d-flex align-items-center">
                            <select id="materialSubjectFilter" class="form-control form-control-sm mr-2" style="width: 160px;" onchange="filterMaterialsTable()">
                                <option value="">All Subjects</option>
                                <option value="Physics">Physics</option>
                                <option value="Chemistry">Chemistry</option>
                                <option value="Mathematics">Mathematics</option>
                                <option value="Biology">Biology</option>
                                <option value="Computer Science">Computer Science</option>
                            </select>
                            <button class="btn btn-outline-primary btn-sm" onclick="loadStudyMaterials()">
                                <i class="fas fa-sync-alt mr-1"></i> Refresh
                            </button>
                        </div>
                    </div>

                    <div class="table-responsive" style="max-height: 520px; overflow-y: auto;">
                        <table class="table table-hover table-bordered" id="materialsMasterTable">
                            <thead class="thead-dark">
                                <tr>
                                    <th style="width: 50px;">#</th>
                                    <th style="width: 140px;">Subject</th>
                                    <th>Chapter / Unit</th>
                                    <th>Title</th>
                                    <th style="width: 120px;">Size</th>
                                    <th style="width: 140px;">Published Date</th>
                                    <th style="width: 100px;" class="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody id="materialsTableBody">
                                <tr>
                                    <td colspan="7" class="text-center py-4 text-muted">
                                        <i class="fas fa-spinner fa-spin mr-2"></i>Loading study materials...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- TAB 2: BROADCAST ANNOUNCEMENTS -->`;

  hubHtml = hubHtml.replace(targetPane, materialsPane);
  fs.writeFileSync(hubHtmlPath, hubHtml, 'utf8');
  console.log('Updated master_hub.html with Study Materials tab successfully!');
}

// 2. Update master_hub.js
let hubJs = fs.readFileSync(hubJsPath, 'utf8');

if (!hubJs.includes('function loadStudyMaterials()')) {
  const materialsJsCode = `
// ==============================================================================
//  STUDY MATERIALS MANAGEMENT (SUPER ADMIN DELETE & VIEW)
// ==============================================================================
let allStudyMaterials = [];

async function loadStudyMaterials() {
    const tbody = document.getElementById('materialsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted"><i class="fas fa-spinner fa-spin mr-2"></i>Loading study materials from cloud...</td></tr>';

    const sb = _getMasterHubSupabase();
    if (!sb) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger"><i class="fas fa-exclamation-triangle mr-2"></i>Supabase not connected.</td></tr>';
        return;
    }

    try {
        const { data, error } = await sb
            .from('study_materials')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching study materials:', error);
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Failed to load materials: ' + error.message + '</td></tr>';
            return;
        }

        allStudyMaterials = data || [];
        renderMaterialsTable(allStudyMaterials);
    } catch (e) {
        console.error('Error loading study materials:', e);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Unexpected error loading materials.</td></tr>';
    }
}

function renderMaterialsTable(materials) {
    const tbody = document.getElementById('materialsTableBody');
    if (!tbody) return;

    if (!materials || materials.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted"><i class="fas fa-folder-open mr-2"></i>No study materials found.</td></tr>';
        return;
    }

    tbody.innerHTML = materials.map((m, idx) => {
        const subBadgeColor = (m.subject || '').toLowerCase().includes('chem') ? 'success'
            : (m.subject || '').toLowerCase().includes('phys') ? 'primary'
            : (m.subject || '').toLowerCase().includes('math') ? 'warning'
            : (m.subject || '').toLowerCase().includes('comp') ? 'info' : 'secondary';

        const dateStr = m.created_at ? new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
        const safeTitle = (m.title || 'Untitled').replace(/"/g, '&quot;');

        return '<tr>' +
            '<td><strong>#' + (idx + 1) + '</strong></td>' +
            '<td><span class="badge badge-' + subBadgeColor + ' px-2 py-1">' + (m.subject || 'General') + '</span></td>' +
            '<td>' + (m.chapter || '—') + '</td>' +
            '<td><strong>' + (m.title || 'Untitled') + '</strong>' + (m.file_url ? ' <a href="' + m.file_url + '" target="_blank" class="badge badge-light border ml-1"><i class="fas fa-paperclip mr-1"></i>File</a>' : '') + '</td>' +
            '<td><small class="text-muted">' + (m.size || '1.5 MB') + '</small></td>' +
            '<td><small class="text-muted">' + dateStr + '</small></td>' +
            '<td class="text-center">' +
                '<button class="btn btn-outline-danger btn-sm py-1 px-2" onclick="deleteStudyMaterial(\\'' + m.id + '\\', \\'' + safeTitle + '\\')" title="Delete Material">' +
                    '<i class="fas fa-trash-alt mr-1"></i>Delete' +
                '</button>' +
            '</td>' +
        '</tr>';
    }).join('');
}

function filterMaterialsTable() {
    const sel = document.getElementById('materialSubjectFilter');
    const val = sel ? sel.value.toLowerCase() : '';
    if (!val) {
        renderMaterialsTable(allStudyMaterials);
        return;
    }
    const filtered = allStudyMaterials.filter(m => (m.subject || '').toLowerCase().includes(val));
    renderMaterialsTable(filtered);
}

async function deleteStudyMaterial(id, title) {
    if (!confirm('Are you sure you want to permanently delete "' + title + '" from the cloud and mobile app?')) {
        return;
    }

    const sb = _getMasterHubSupabase();
    if (!sb) {
        alert('Supabase client not connected.');
        return;
    }

    try {
        const { error } = await sb.from('study_materials').delete().eq('id', id);
        if (error) {
            alert('Failed to delete material: ' + error.message);
            return;
        }
        alert('Study Material "' + title + '" has been permanently deleted from both cloud and mobile apps.');
        await loadStudyMaterials();
    } catch (e) {
        console.error('Delete error:', e);
        alert('Failed to delete material: ' + e.message);
    }
}

// Hook into tab activation
document.addEventListener('DOMContentLoaded', function () {
    const materialsTabLink = document.getElementById('tab-materials-link');
    if (materialsTabLink) {
        materialsTabLink.addEventListener('shown.bs.tab', function () {
            loadStudyMaterials();
        });
    }
});
`;

  hubJs += '\n' + materialsJsCode;
  fs.writeFileSync(hubJsPath, hubJs, 'utf8');
  console.log('Updated master_hub.js with Study Materials load/delete functions successfully!');
}
