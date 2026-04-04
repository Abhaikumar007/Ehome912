const subjectData = {
    '12': {
        rulesText: 'Select up to 4 subjects. (Biology and Computer Science cannot be chosen together). ₹1500 for 1, ₹2500 for 2, ₹3500 for 3, ₹4500 for 4.',
        subjects: [
            { id: 'maths', name: 'Mathematics', icon: 'fa-subscript' },
            { id: 'physics', name: 'Physics', icon: 'fa-atom' },
            { id: 'chemistry', name: 'Chemistry', icon: 'fa-flask' },
            { id: 'english', name: 'English', icon: 'fa-book' },
            { id: 'bio', name: 'Biology', icon: 'fa-leaf' },
            { id: 'cs', name: 'Computer Science', icon: 'fa-laptop-code' }
        ],
        calculateFee: (selected) => {
            const count = selected.length;
            if (count === 0) return 0;
            if (count === 1) return 1500;
            if (count === 2) return 2500;
            if (count === 3) return 3500;
            return 4500;
        },
        maxSelectable: 4
    },
    '11': {
        rulesText: 'Select up to 4 subjects. (Biology and Computer Science cannot be chosen together). ₹1500 for 1, ₹2500 for 2, ₹3500 for 3, ₹4500 for 4.',
        subjects: [
            { id: 'maths', name: 'Mathematics', icon: 'fa-subscript' },
            { id: 'physics', name: 'Physics', icon: 'fa-atom' },
            { id: 'chemistry', name: 'Chemistry', icon: 'fa-flask' },
            { id: 'english', name: 'English', icon: 'fa-book' },
            { id: 'bio', name: 'Biology', icon: 'fa-leaf' },
            { id: 'cs', name: 'Computer Science', icon: 'fa-laptop-code' }
        ],
        calculateFee: (selected) => {
            const count = selected.length;
            if (count === 0) return 0;
            if (count === 1) return 1500;
            if (count === 2) return 2500;
            if (count === 3) return 3500;
            return 4500;
        },
        maxSelectable: 4
    },
    '10': {
        rulesText: 'Choose individual subjects (₹1000 for 1, ₹2000 for 2) OR the complete Maths & Science Package (Maths, Physics, Chemistry, Biology) for ₹3000.',
        subjects: [
            { id: 'maths', name: 'Mathematics', icon: 'fa-subscript' },
            { id: 'physics', name: 'Physics', icon: 'fa-atom' },
            { id: 'chemistry', name: 'Chemistry', icon: 'fa-flask' },
            { id: 'bio', name: 'Biology', icon: 'fa-leaf' },
            { id: 'package_math_sci', name: 'Maths & Science (Full)', icon: 'fa-box-open', special: true }
        ],
        calculateFee: (selected) => {
            if (selected.includes('package_math_sci')) return 3000;
            const count = selected.length;
            if (count === 0) return 0;
            if (count === 1) return 1000;
            if (count === 2) return 2000;
            return 3000; // If they somehow select 3 individually, we cap at package price but better to enforce logic
        },
        maxSelectable: 4
    },
    '9': {
        rulesText: 'Maths (₹1000), Science (₹1000), Any other 2 subjects (₹1500), Maths + Science (₹2000).',
        subjects: [
            { id: 'maths', name: 'Mathematics', icon: 'fa-subscript' },
            { id: 'science', name: 'Science', icon: 'fa-flask' },
            { id: 'english', name: 'English', icon: 'fa-book' },
            { id: 'malayalam', name: 'Malayalam', icon: 'fa-language' }
        ],
        calculateFee: (selected) => {
            if (selected.includes('maths') && selected.includes('science')) return 2000;
            const count = selected.length;
            if (count === 0) return 0;
            if (count === 1) return 1000;
            if (count === 2) return 1500;
            return 2000; 
        },
        maxSelectable: 4
    },
    '8': {
        rulesText: 'Maths (₹750) or Maths + Science (₹1500).',
        subjects: [
            { id: 'maths', name: 'Mathematics Only', icon: 'fa-subscript' },
            { id: 'maths_sci', name: 'Maths & Science', icon: 'fa-flask', special: true }
        ],
        calculateFee: (selected) => {
            if (selected.includes('maths_sci')) return 1500;
            if (selected.includes('maths')) return 750;
            return 0;
        },
        maxSelectable: 1
    },
    '7': {
        rulesText: 'Maths (₹600) or Maths + Science (₹1200).',
        subjects: [
            { id: 'maths', name: 'Mathematics Only', icon: 'fa-subscript' },
            { id: 'maths_sci', name: 'Maths & Science', icon: 'fa-flask', special: true }
        ],
        calculateFee: (selected) => {
            if (selected.includes('maths_sci')) return 1200;
            if (selected.includes('maths')) return 600;
            return 0;
        },
        maxSelectable: 1
    },
    '6': {
        rulesText: 'Maths (₹500) or Maths + Science (₹1000).',
        subjects: [
            { id: 'maths', name: 'Mathematics Only', icon: 'fa-subscript' },
            { id: 'maths_sci', name: 'Maths & Science', icon: 'fa-flask', special: true }
        ],
        calculateFee: (selected) => {
            if (selected.includes('maths_sci')) return 1000;
            if (selected.includes('maths')) return 500;
            return 0;
        },
        maxSelectable: 1
    }
};

let currentClass = null;
let selectedSubjects = [];

// Elements
const classBtns = document.querySelectorAll('.class-btn');
const subjectSection = document.getElementById('subjectSection');
const subjectGrid = document.getElementById('subjectGrid');
const subjectBanner = document.getElementById('subjectBanner');
const priceDisplay = document.getElementById('priceDisplay');
const selectedSummary = document.getElementById('selectedSummary');
const resetBtn = document.getElementById('resetBtn');
const confirmBtn = document.getElementById('calculateFinalBtn');

// Event Listeners for Classes
classBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active from all
        classBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        currentClass = btn.dataset.class;
        selectedSubjects = [];
        
        renderSubjects();
        updateDisplay();
    });
});

function renderSubjects() {
    subjectSection.classList.remove('hidden');
    const data = subjectData[currentClass];
    
    subjectBanner.innerHTML = `<i class="fas fa-info-circle"></i> ${data.rulesText}`;
    subjectGrid.innerHTML = '';
    
    data.subjects.forEach(sub => {
        const btn = document.createElement('div');
        btn.className = 'subject-btn';
        if (sub.special) btn.style.background = 'rgba(139, 92, 246, 0.2)'; // purple tint for specials
        btn.dataset.id = sub.id;
        btn.innerHTML = `<i class="fas ${sub.icon}"></i> <span>${sub.name}</span>`;
        
        btn.addEventListener('click', () => toggleSubject(sub.id));
        subjectGrid.appendChild(btn);
    });
}

function toggleSubject(subjectId) {
    const data = subjectData[currentClass];
    
    // Class 10: Logic for Package vs Individuals
    if (currentClass === '10') {
        if (subjectId === 'package_math_sci') {
            selectedSubjects = ['package_math_sci'];
        } else {
            selectedSubjects = selectedSubjects.filter(s => s !== 'package_math_sci');
            if (selectedSubjects.includes(subjectId)) {
                selectedSubjects = selectedSubjects.filter(id => id !== subjectId);
            } else if (selectedSubjects.length < 3) {
                selectedSubjects.push(subjectId);
            }
        }
    }
    // Class 6, 7, 8: Only 1 selection possible (Radio style)
    else if (data.maxSelectable === 1) {
        selectedSubjects = [subjectId];
    }
    // Class 11 & 12
    else {
        if (selectedSubjects.includes(subjectId)) {
            selectedSubjects = selectedSubjects.filter(id => id !== subjectId);
        } else {
            // Check Mutually Exclusive constraint
            if (subjectId === 'cs' && selectedSubjects.includes('bio')) return;
            if (subjectId === 'bio' && selectedSubjects.includes('cs')) return;
            
            // Check max size
            if (selectedSubjects.length < data.maxSelectable) {
                selectedSubjects.push(subjectId);
            }
        }
    }
    
    updateDisplay();
}

function updateDisplay() {
    const data = subjectData[currentClass];
    const subjectBtns = document.querySelectorAll('.subject-btn');
    
    // 1. Update UI active states & locks
    subjectBtns.forEach(btn => {
        const id = btn.dataset.id;
        btn.classList.remove('active', 'locked');
        
        // Active
        if (selectedSubjects.includes(id)) {
            btn.classList.add('active');
        }
        
        // Locks for 11/12
        if (currentClass === '11' || currentClass === '12') {
            if (id === 'cs' && selectedSubjects.includes('bio')) {
                btn.classList.add('locked');
                btn.innerHTML = `<i class="fas fa-lock"></i> <span>Comp Sci</span>`;
            } else if (id === 'cs' && !selectedSubjects.includes('bio')) {
                btn.innerHTML = `<i class="fas fa-laptop-code"></i> <span>Computer Science</span>`;
            }
            if (id === 'bio' && selectedSubjects.includes('cs')) {
                btn.classList.add('locked');
                btn.innerHTML = `<i class="fas fa-lock"></i> <span>Biology</span>`;
            } else if (id === 'bio' && !selectedSubjects.includes('cs')) {
                btn.innerHTML = `<i class="fas fa-leaf"></i> <span>Biology</span>`;
            }
            
            // Max reached (but not included)
            if (selectedSubjects.length >= data.maxSelectable && !selectedSubjects.includes(id)) {
                 btn.classList.add('locked');
            }
        }
    });

    // 2. Calculate Pricing
    const currentPrice = data.calculateFee(selectedSubjects);
    
    // Pulse animation
    if (priceDisplay.innerText !== currentPrice.toString()) {
        priceDisplay.classList.remove('pulse-anim');
        void priceDisplay.offsetWidth; // trigger reflow
        priceDisplay.classList.add('pulse-anim');
        priceDisplay.innerText = currentPrice;
    }

    // 3. Update Summary
    if (selectedSubjects.length === 0) {
        selectedSummary.innerHTML = `Class ${currentClass}: No subjects selected.`;
    } else {
        const names = selectedSubjects.map(id => data.subjects.find(s => s.id === id).name);
        selectedSummary.innerHTML = `<strong>Class ${currentClass} Selection:</strong><br>${names.join(', ')}`;
    }
}

// Reset
resetBtn.addEventListener('click', () => {
    classBtns.forEach(b => b.classList.remove('active'));
    currentClass = null;
    selectedSubjects = [];
    subjectSection.classList.add('hidden');
    priceDisplay.innerText = '0';
    selectedSummary.innerHTML = 'No class selected yet.';
});

// Confirm & Confetti
confirmBtn.addEventListener('click', () => {
    if (priceDisplay.innerText !== '0') {
        fireConfetti();
    } else {
         selectedSummary.innerHTML = '<span style="color:#ff007f;">Please select subjects first!</span>';
    }
});

function fireConfetti() {
    var count = 200;
    var defaults = {
        origin: { y: 0.7 },
        zIndex: 1000
    };

    function fire(particleRatio, opts) {
        confetti(Object.assign({}, defaults, opts, {
            particleCount: Math.floor(count * particleRatio)
        }));
    }

    fire(0.25, { spread: 26, startVelocity: 55, colors: ['#ec4899', '#8b5cf6'] });
    fire(0.2, { spread: 60, colors: ['#ec4899', '#10b981'] });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
}
