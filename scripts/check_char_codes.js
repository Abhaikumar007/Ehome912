const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const configContent = fs.readFileSync('C:/Users/madhu/code_test/private/js/config.js', 'utf8');
const urlMatch = configContent.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = configContent.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);
const sb = createClient(urlMatch[1], keyMatch[1]);

async function check() {
    const { data } = await sb.from('classes').select('time, status').eq('id', 'a7fc65b0-ce3c-4575-8ccc-338ed6be5f38').single();
    console.log('time:', data.time);
    console.log('status:', data.status);
    for (let i = 0; i < data.time.length; i++) {
        if (data.time.charCodeAt(i) > 127) {
            console.log('char at ' + i + ':', data.time[i], 'code:', data.time.charCodeAt(i));
        }
    }
    console.log('literal • code in this script:', '•'.charCodeAt(0));
}
check();
