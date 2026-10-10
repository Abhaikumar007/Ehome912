const fs = require('fs');
const path = require('path');

const codeTestDir = 'C:/Users/madhu/code_test/private';
const now = Date.now();

const modalHtml = `
<!-- Modal: Delete Faculty Academic Opinion & Student Remark Confirmation -->
<div class="modal fade" id="deleteOpinionConfirmModal" tabindex="-1" role="dialog" aria-labelledby="deleteOpinionConfirmModalLabel" aria-hidden="true" style="z-index: 1080;">
    <div class="modal-dialog modal-dialog-centered" role="document" style="max-width: 440px;">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 12px; overflow: hidden;">
            <div class="modal-header bg-danger text-white py-3">
                <h5 class="modal-title font-weight-bold mb-0" id="deleteOpinionConfirmModalLabel" style="font-size: 1.1rem;">
                    <i class="fas fa-trash-alt mr-2"></i>Delete Opinion / Remark
                </h5>
                <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close" onclick="closeDeleteOpinionModal()" style="opacity: 0.9; outline: none;">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body p-4 text-center">
                <div class="mb-3">
                    <span style="display:inline-flex; width: 62px; height: 62px; border-radius: 50%; background-color: #fee2e2; align-items: center; justify-content: center;">
                        <i class="fas fa-exclamation-triangle fa-2x text-danger"></i>
                    </span>
                </div>
                <h6 class="font-weight-bold text-dark mb-2" style="font-size: 1.05rem;">
                    Are you sure you want to delete this opinion/remark?
                </h6>
                <div id="deleteOpinionConfirmDetails" class="bg-light p-3 rounded text-left border small text-dark my-3" style="display:none; line-height: 1.5;"></div>
                <p class="text-muted small mb-0">
                    This entry will be permanently removed from the database and will no longer appear in the student or faculty portals.
                </p>
            </div>
            <div class="modal-footer bg-light px-4 py-3 d-flex justify-content-between">
                <button type="button" class="btn btn-secondary px-3" data-dismiss="modal" onclick="closeDeleteOpinionModal()">
                    Cancel
                </button>
                <button type="button" class="btn btn-danger font-weight-bold px-4" id="executeDeleteOpinionBtn" onclick="confirmAndExecuteDeleteOpinion()">
                    <i class="fas fa-trash-alt mr-1"></i> Yes, Delete
                </button>
            </div>
        </div>
    </div>
</div>
`;

// 1. Patch master_hub.html
const masterHubPath = path.join(codeTestDir, 'master_hub.html');
let hubHtml = fs.readFileSync(masterHubPath, 'utf8');

if (!hubHtml.includes('id="deleteOpinionConfirmModal"')) {
    const spmClose = '<button type="button" class="btn btn-secondary btn-sm" data-dismiss="modal" onclick="closeStudentProfileModal()">Close</button>\n            </div>\n        </div>\n    </div>\n</div>';
    if (hubHtml.includes(spmClose)) {
        hubHtml = hubHtml.replace(spmClose, spmClose + '\n' + modalHtml);
        console.log('✓ Inserted deleteOpinionConfirmModal into master_hub.html');
    } else {
        // Fallback: before </body>
        hubHtml = hubHtml.replace('</body>', modalHtml + '\n</body>');
        console.log('✓ Inserted deleteOpinionConfirmModal before body in master_hub.html');
    }
} else {
    console.log('Modal already exists in master_hub.html');
}

hubHtml = hubHtml.replace(/src="js\/admin\.js\?v=\d+"/g, `src="js/admin.js?v=${now}"`);
hubHtml = hubHtml.replace(/src="js\/master_hub\.js\?v=\d+"/g, `src="js/master_hub.js?v=${now}"`);
fs.writeFileSync(masterHubPath, hubHtml, 'utf8');
console.log(`✓ Updated master_hub.html script versions to ${now}`);

// 2. Patch add_student.html
const addStudentPath = path.join(codeTestDir, 'add_student.html');
let addStudentHtml = fs.readFileSync(addStudentPath, 'utf8');

if (!addStudentHtml.includes('id="deleteOpinionConfirmModal"')) {
    const spmClose = '<button type="button" class="btn btn-secondary btn-sm" data-dismiss="modal" onclick="closeStudentProfileModal()">Close</button>\n            </div>\n        </div>\n    </div>\n</div>';
    if (addStudentHtml.includes(spmClose)) {
        addStudentHtml = addStudentHtml.replace(spmClose, spmClose + '\n' + modalHtml);
        console.log('✓ Inserted deleteOpinionConfirmModal into add_student.html');
    } else {
        addStudentHtml = addStudentHtml.replace('</body>', modalHtml + '\n</body>');
        console.log('✓ Inserted deleteOpinionConfirmModal before body in add_student.html');
    }
} else {
    console.log('Modal already exists in add_student.html');
}

addStudentHtml = addStudentHtml.replace(/src="js\/admin\.js\?v=\d+"/g, `src="js/admin.js?v=${now}"`);
fs.writeFileSync(addStudentPath, addStudentHtml, 'utf8');
console.log(`✓ Updated add_student.html script versions to ${now}`);
