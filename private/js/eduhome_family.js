// Supabase Initialization (Keys pulled from config.js safely)
let supabaseClient = null;
try {
    if (typeof window.supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.warn("Supabase CDN or config.js not loaded. Operating in LocalStorage-only mode.");
    }
} catch(e) {
    console.error("Supabase initialization error:", e);
}

// Audio synthesis logic for hyper-gamification
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'increment') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(500, audioCtx.currentTime); 
        oscillator.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.1); 
        
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'add') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + 0.25);
        
        gainNode.gain.setValueAtTime(0.6, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'decrement') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'levelup') {
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime + 0.15);
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime + 0.3);
        oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.45);
        
        gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.8);
    }
}

// Persistent Storage State Restoration
let stateStr = localStorage.getItem('eduHome_RewardState');
let gameState = stateStr ? JSON.parse(stateStr) : { total: 0, xp: 0, level: 1 };

let totalRewards = gameState.total || 0;
let currentXP = gameState.xp || 0;
let currentLevel = gameState.level || 1;
let selectedSubjects = [];
const ranks = [
    { title: "Explorer", quote: "“Just checking what’s going on 👀”" },
    { title: "Finder", quote: "“Bro wait… I know one guy”" },
    { title: "Connector", quote: "“Adding people like a WhatsApp group admin 😎”" },
    { title: "Builder", quote: "“Now it’s becoming a squad 💯”" },
    { title: "Influencer", quote: "“People actually listening to me now 👀”" },
    { title: "Leader", quote: "“Running the game at this point 🔥”" },
    { title: "Legend", quote: "“Everyone knows this guy 😌”" }
];

function getXPForNextLevel(level) {
    return level * 500;
}

function updateLevelUI() {
    document.getElementById('currentXP').innerText = currentXP;
    let nextXP = getXPForNextLevel(currentLevel);
    document.getElementById('nextLevelXP').innerText = nextXP;
    
    let percentage = (currentXP / nextXP) * 100;
    if(percentage > 100) percentage = 100;
    document.getElementById('xpFill').style.width = percentage + '%';
    
    document.getElementById('userLevel').innerText = currentLevel;
    let rankIndex = currentLevel - 1;
    if(rankIndex >= ranks.length) rankIndex = ranks.length - 1;
    document.getElementById('userRank').innerText = ranks[rankIndex].title;
    let rankQuoteEl = document.getElementById('rankQuote');
    if (rankQuoteEl) rankQuoteEl.innerText = ranks[rankIndex].quote;
}

function saveGameState() {
    localStorage.setItem('eduHome_RewardState', JSON.stringify({
        total: totalRewards,
        xp: currentXP,
        level: currentLevel
    }));
}

function processXP(gainedXP, e) {
    currentXP += gainedXP;
    let nextXP = getXPForNextLevel(currentLevel);
    let didLevelUp = false;
    
    if (currentXP >= nextXP) {
        currentXP = currentXP - nextXP; // carry over
        currentLevel++;
        didLevelUp = true;
        playSound('levelup');
        
        // Massive confetti for level up
        setTimeout(() => {
            if (typeof confetti === 'function') {
                const end = Date.now() + 2 * 1000;
                const colors = ['#0088ff', '#00eeff', '#e3b341', '#ffffff'];
                (function frame() {
                    confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: colors, zIndex: 3000 });
                    confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: colors, zIndex: 3000 });
                    if (Date.now() < end) requestAnimationFrame(frame);
                }());
            }
        }, 300);
    }
    updateLevelUI();
    saveGameState();
    return didLevelUp;
}

function toggleSubject(element, subject) {
    if (audioCtx.state === 'suspended') { audioCtx.resume(); }
    if (selectedSubjects.includes(subject)) {
        selectedSubjects = selectedSubjects.filter(s => s !== subject);
        element.classList.remove('active');
        playSound('decrement');
    } else {
        selectedSubjects.push(subject);
        element.classList.add('active');
        playSound('increment');
    }
    updateRewardDisplay();
}

function calculateReward(studentClass, selectedSubjects) {
    const count = selectedSubjects.length;
    if (count === 0) return 0;
    
    // Extract numerical class from string (e.g. "Class 10" -> "10")
    if (studentClass === 'Degree') return count * 1500; // default for degree
    
    const clsMatch = studentClass.match(/\d+/);
    if (!clsMatch) return 0;
    const cls = clsMatch[0];

    // Mirroring fee_calculator.js logic:
    if (cls === '12' || cls === '11') {
        if (count === 1) return 1500;
        if (count === 2) return 2500;
        if (count === 3) return 3500;
        return 4500;
    } 
    else if (cls === '10') {
        // Did they select all required for the package? (Physics, Chemistry, Maths, Biology)
        const hasPackage = selectedSubjects.includes('Maths') && 
                           selectedSubjects.includes('Physics') && 
                           selectedSubjects.includes('Chemistry') && 
                           selectedSubjects.includes('Biology');
        if (hasPackage) return 3000;
        
        if (count === 1) return 1000;
        if (count === 2) return 2000;
        return 3000; 
    }
    else if (cls === '9') {
        const hasMath = selectedSubjects.includes('Maths');
        const hasSci = selectedSubjects.includes('Science');
        
        if (hasMath && hasSci) return 2000;
        if (count === 1) return 1000;
        if (count === 2) return 1500;
        return 2000;
    }
    else if (cls === '8') {
        const hasSci = selectedSubjects.includes('Science');
        if (selectedSubjects.includes('Maths') && hasSci) return 1500;
        if (selectedSubjects.includes('Maths')) return 750;
        return count * 750; // fallback
    }
    else if (cls === '7') {
        const hasSci = selectedSubjects.includes('Science');
        if (selectedSubjects.includes('Maths') && hasSci) return 1200;
        if (selectedSubjects.includes('Maths')) return 600;
        return count * 600; // fallback
    }
    else if (cls === '6') {
        const hasSci = selectedSubjects.includes('Science');
        if (selectedSubjects.includes('Maths') && hasSci) return 1000;
        if (selectedSubjects.includes('Maths')) return 500;
        return count * 500; // fallback
    }
    
    return count * 1000; // Base fallback
}

function updateRewardDisplay() {
    const studentClass = document.getElementById('studentClass').value;
    const isLowerGrade = studentClass.includes('6') || studentClass.includes('7') || studentClass.includes('8') || studentClass.includes('9');
    const isClass10Lower = isLowerGrade || studentClass.includes('10'); // 6 to 10
    
    // Toggle Computer Science validation (no CS for 6-10)
    const csPill = Array.from(document.querySelectorAll('.subject-pill')).find(p => p.innerText.includes('Computer Science'));
    if (csPill) {
        if (isClass10Lower) {
            csPill.style.display = 'none';
            if (selectedSubjects.includes('Computer Science')) {
                selectedSubjects = selectedSubjects.filter(s => s !== 'Computer Science');
                csPill.classList.remove('active');
            }
        } else {
            csPill.style.display = 'inline-block';
        }
    }

    // Toggle Science vs Physics/Chem/Bio
    const sciPill = document.getElementById('pill-science');
    const phyPill = document.getElementById('pill-physics');
    const chemPill = document.getElementById('pill-chemistry');
    const bioPill = document.getElementById('pill-biology');

    if (sciPill && phyPill && chemPill && bioPill) {
        if (isLowerGrade) {
            // For 6-9: Show Science, hide Physics/Chem/Bio
            sciPill.style.display = 'inline-block';
            phyPill.style.display = 'none';
            chemPill.style.display = 'none';
            bioPill.style.display = 'none';

            // Deselect specific sciences if selected
            ['Physics', 'Chemistry', 'Biology'].forEach(subj => {
                if (selectedSubjects.includes(subj)) {
                    selectedSubjects = selectedSubjects.filter(s => s !== subj);
                }
            });
            [phyPill, chemPill, bioPill].forEach(p => p.classList.remove('active'));
        } else {
            // For 10+: Hide Science, show Physics/Chem/Bio
            sciPill.style.display = 'none';
            phyPill.style.display = 'inline-block';
            chemPill.style.display = 'inline-block';
            bioPill.style.display = 'inline-block';

            // Deselect Science if selected
            if (selectedSubjects.includes('Science')) {
                selectedSubjects = selectedSubjects.filter(s => s !== 'Science');
                sciPill.classList.remove('active');
            }
        }
    }

    const reward = calculateReward(studentClass, selectedSubjects);
    
    const rewardSpan = document.getElementById('currentRewardVal');
    rewardSpan.innerText = `₹${reward}`;
    rewardSpan.classList.remove('pop-anim');
    void rewardSpan.offsetWidth;
    rewardSpan.classList.add('pop-anim');
}

function addCollaborator() {
    const container = document.getElementById('collabContainer');
    const div = document.createElement('div');
    div.className = 'input-group';
    div.innerHTML = `<input type="text" class="gamified-input collab-input" placeholder="Add friend's name...">`;
    container.appendChild(div);
}

function showModal(message) {
    document.getElementById('modalMessage').innerText = message;
    document.getElementById('successModal').classList.add('active');
}

function closeModal() {
    document.getElementById('successModal').classList.remove('active');
}

function spawnFloatingText(text, color, x, y) {
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.innerText = text;
    el.style.color = color;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    document.body.appendChild(el);
    setTimeout(() => { el.remove(); }, 1500);
}

function buildStudentCardHTML(studentName, studentClass, subjectArray, reward) {
    const card = document.createElement('div');
    card.className = 'student-card';
    card.innerHTML = `
        <div>
            <h4 style="margin:0; font-size:1.2rem; color:#003366;"><i class="fas fa-check-circle" style="color:#00aaee; font-size:1rem; margin-right:5px;"></i> ${studentName}</h4>
            <div style="font-size:0.9rem; color:#6688aa; margin-top: 5px;">${studentClass} • ${subjectArray.join(', ')}</div>
        </div>
        <div class="reward-amount">+₹${reward}</div>
    `;
    return card;
}

function addStudent(event) {
    if (audioCtx.state === 'suspended') { audioCtx.resume(); }

    const studentName = document.getElementById('studentName').value.trim();
    if (!studentName) { alert("Please enter a student name."); return; }
    if (selectedSubjects.length === 0) { alert("Please select at least one subject."); return; }
    
    const studentClass = document.getElementById('studentClass').value;
    let reward = calculateReward(studentClass, selectedSubjects);
    
    playSound('add');
    
    if (typeof confetti === 'function') {
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, zIndex: 2001 });
    }

    const primaryName = document.getElementById('primaryName').value.trim() || 'AdminLeader';
    let collabs = [];
    document.querySelectorAll('.collab-input').forEach(input => {
        if(input.value.trim() !== '') collabs.push(input.value.trim());
    });

    try {
        let savedPin = localStorage.getItem('eduHome_CollectorPIN') || '0000';
        let secureIdentity = `${primaryName} (PIN: ${savedPin})`;

        let payload = {
            collector: secureIdentity,
            collaborators: collabs,
            studentName: studentName,
            studentClass: studentClass,
            subjects: selectedSubjects,
            reward: reward,
            timestamp: new Date().toISOString()
        };
        
        let referrals = JSON.parse(localStorage.getItem('eduHome_Referrals') || '[]');
        referrals.push(payload);
        localStorage.setItem('eduHome_Referrals', JSON.stringify(referrals));
        
        // Log asynchronously to Supabase safely
        if (supabaseClient) {
            supabaseClient.from('referrals').insert([
                {
                    collector: payload.collector,
                    collaborators: JSON.stringify(payload.collaborators),
                    student_name: payload.studentName,
                    student_class: payload.studentClass,
                    subjects: JSON.stringify(payload.subjects),
                    reward: payload.reward
                }
            ]).then(({ data, error }) => {
                if(error) {
                    console.error("Supabase Log Error:", error);
                    alert("SUPABASE LOG ERROR:\n" + error.message + "\n\n(It saved locally, but failed to reach the cloud. Did you create the 'referrals' table completely accurately?)");
                }
                else console.log("Successfully logged to Supabase referrals table.");
            });
        }

    } catch(err) { console.error("Local Storage Error: ", err); }
    
    const emptyLog = document.getElementById('emptyLogText');
    if (emptyLog) { emptyLog.remove(); }

    const list = document.getElementById('studentList');
    list.prepend(buildStudentCardHTML(studentName, studentClass, selectedSubjects, reward));
    
    totalRewards += reward;
    const totalDisplay = document.getElementById('totalRewardDisplay');
    totalDisplay.innerText = `₹${totalRewards}`;
    totalDisplay.classList.remove('pop-anim');
    void totalDisplay.offsetWidth;
    totalDisplay.classList.add('pop-anim');
    
    let clickX = event ? event.clientX : window.innerWidth/2;
    let clickY = event ? event.clientY : window.innerHeight/2;
    let gainedXP = selectedSubjects.length * 150;
    
    spawnFloatingText(`+₹${reward}`, "#0088ff", clickX - 20, clickY - 20);
    setTimeout(() => { spawnFloatingText(`+${gainedXP} XP`, "#00e5ff", clickX + 40, clickY); }, 150);

    let didLevelUp = processXP(gainedXP, event);
    
    if (didLevelUp) {
        showModal(`CONGRATULATIONS YOU ARE REWARDED WITH ₹${reward}! \n\nLEVEL UP! You are now Level ${currentLevel}!`);
    } else {
        showModal(`CONGRATULATIONS YOU ARE REWARDED WITH ₹${reward}!`);
    }

    // Reset Form
    document.getElementById('studentName').value = '';
    selectedSubjects = [];
    document.querySelectorAll('.subject-pill').forEach(p => p.classList.remove('active'));
    document.getElementById('currentRewardVal').innerText = '₹0';
}

function saveCollectorName() {
    if (audioCtx.state === 'suspended') { audioCtx.resume(); }
    let name = document.getElementById('promptNameInput').value.trim();
    let pin = document.getElementById('promptPinInput').value.trim();
    
    if (!name || name.length < 2) {
        alert("Please enter a valid Collector Name!");
        return;
    }
    
    if (!pin || pin.length < 4) {
        alert("Please create a 4-Digit Secret PIN to protect your identity!");
        return;
    }
    
    localStorage.setItem('eduHome_CollectorName', name);
    localStorage.setItem('eduHome_CollectorPIN', pin);
    document.getElementById('primaryName').value = name;
    document.getElementById('namePromptModal').classList.remove('active');
    playSound('levelup');
}

function bootLoadState() {
    updateLevelUI();
    document.getElementById('totalRewardDisplay').innerText = `₹${totalRewards}`;
    
    let savedName = localStorage.getItem('eduHome_CollectorName');
    if (savedName) {
        document.getElementById('primaryName').value = savedName;
    } else {
        document.getElementById('namePromptModal').classList.add('active');
    }
    
    document.getElementById('primaryName').addEventListener('input', function(e) {
        localStorage.setItem('eduHome_CollectorName', e.target.value.trim() || 'AdminLeader');
    });

    // Hydrate previous referrals into DOM
    try {
        let referrals = JSON.parse(localStorage.getItem('eduHome_Referrals') || '[]');
        if (referrals.length > 0) {
            const emptyLog = document.getElementById('emptyLogText');
            if (emptyLog) { emptyLog.remove(); }
            
            let recalcTotal = 0;
            const list = document.getElementById('studentList');
            referrals.forEach(ref => {
                recalcTotal += ref.reward;
                list.prepend(buildStudentCardHTML(ref.studentName, ref.studentClass, ref.subjects, ref.reward));
            });
            
            // Auto-heal totalRewards if desynced
            if (totalRewards !== recalcTotal) {
                totalRewards = recalcTotal;
                document.getElementById('totalRewardDisplay').innerText = `₹${totalRewards}`;
                saveGameState();
            }
        }
    } catch(err) { console.error("Local Storage Error: ", err); }
}

function changeProfileName() {
    document.getElementById('namePromptModal').classList.add('active');
}

function resetProfile() {
    if(confirm("CRITICAL WARNING: Are you sure you want to completely erase all your XP, levels, and referral history? This cannot be undone!")) {
        localStorage.removeItem('eduHome_RewardState');
        localStorage.removeItem('eduHome_Referrals');
        localStorage.removeItem('eduHome_CollectorName');
        localStorage.removeItem('eduHome_CollectorPIN');
        window.location.reload();
    }
}

window.onload = function() {
    bootLoadState();
    
    // Listen for class changes to dynamically update reward
    const classSelect = document.getElementById('studentClass');
    if (classSelect) {
        classSelect.addEventListener('change', updateRewardDisplay);
        updateRewardDisplay(); // Run once initially
    }
}
