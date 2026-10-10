const fs = require('fs');
const js = fs.readFileSync('C:/Users/madhu/code_test/private/js/live_timetable.js', 'utf8');

// Simulate basic browser environment
const dom = {
    document: {
        getElementById: () => null,
        querySelectorAll: () => [],
        createElement: () => ({ style: {}, appendChild: () => {} }),
        body: { appendChild: () => {} },
        addEventListener: () => {}
    },
    window: {
        location: { hash: '' }
    },
    localStorage: {
        getItem: () => null,
        setItem: () => {}
    }
};

try {
    const fn = new Function('window', 'document', 'localStorage', js);
    fn(dom.window, dom.document, dom.localStorage);
    console.log('Executed live_timetable.js successfully without errors');
    console.log('Window keys exported:', Object.keys(dom.window));
} catch (e) {
    console.error('Execution error:', e);
}
