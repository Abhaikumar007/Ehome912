const fs = require('fs');
const filePath = 'C:/Users/madhu/code_test/private/add_student.html';
let html = fs.readFileSync(filePath, 'utf8');

const regex = /(<div class="form-group">\s*<label>Phone Number<\/label>\s*<input type="tel" class="form-control" id="phone" required>\s*<\/div>)/;
if (regex.test(html) && !html.includes('id="pin"')) {
  const pinHtml = `\n\n                        <div class="form-group">
                            <label>Student Login PIN (4 Digits) <small class="text-muted">(Auto-assigned if left blank)</small></label>
                            <input type="text" class="form-control font-weight-bold" id="pin" maxlength="4" placeholder="e.g. 5015" pattern="[0-9]{4}">
                            <small class="form-text text-muted">Used by student to log into the EduHome mobile app.</small>
                        </div>`;
  html = html.replace(regex, '$1' + pinHtml);
  fs.writeFileSync(filePath, html, 'utf8');
  console.log('✓ Successfully added PIN input field to add_student.html');
} else {
  console.log('Already present or pattern not matched. Contains id="pin"?', html.includes('id="pin"'));
}
