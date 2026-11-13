// EduHome Chemistry Virtual Lab — Volumetric Analysis (Titration)

const EXPERIMENTS = [
  {
    id: 1,
    category: "Acidimetry & Alkalimetry",
    title: "1. NaOH vs Standard HCl (3.6 g/L)",
    buretteLabel: "Std. HCl (3.6 g/L)",
    flaskLabel: "NaOH soln",
    reaction: "HCl + NaOH → NaCl + H₂O",
    indicator: "phenolphthalein",
    indicatorName: "Phenolphthalein (Pink → Colourless)",
    needsAcid: false,
    needsHeat: false,
    stdIn: "burette",
    stdMassPerLitre: 3.6,
    stdEqMass: 36.5,
    unkEqMass: 40,
    unkLabel: "NaOH",
    buretteColor: "rgba(186, 230, 253, 0.58)",
    trueEndpoint: 19.6
  },
  {
    id: 2,
    category: "Acidimetry & Alkalimetry",
    title: "2. Na₂CO₃ vs Standard HNO₃ (6.3 g/L)",
    buretteLabel: "Std. HNO₃ (6.3 g/L)",
    flaskLabel: "Na₂CO₃ soln",
    reaction: "2HNO₃ + Na₂CO₃ → 2NaNO₃ + H₂CO₃",
    indicator: "methyl_orange",
    indicatorName: "Methyl Orange (Golden Yellow → Orange Red)",
    needsAcid: false,
    needsHeat: false,
    stdIn: "burette",
    stdMassPerLitre: 6.3,
    stdEqMass: 63,
    unkEqMass: 53,
    unkLabel: "Na₂CO₃",
    buretteColor: "rgba(186, 230, 253, 0.58)",
    trueEndpoint: 20.0
  },
  {
    id: 3,
    category: "Acidimetry & Alkalimetry",
    title: "3. KOH vs Standard Oxalic Acid (6.3 g/L)",
    buretteLabel: "Std. H₂C₂O₄ (6.3 g/L)",
    flaskLabel: "KOH soln",
    reaction: "H₂C₂O₄ + 2KOH → K₂C₂O₄ + 2H₂O",
    indicator: "phenolphthalein",
    indicatorName: "Phenolphthalein (Pink → Colourless)",
    needsAcid: false,
    needsHeat: false,
    stdIn: "burette",
    stdMassPerLitre: 6.3,
    stdEqMass: 63,
    unkEqMass: 56,
    unkLabel: "KOH",
    buretteColor: "rgba(186, 230, 253, 0.58)",
    trueEndpoint: 18.4
  },
  {
    id: 4,
    category: "Acidimetry & Alkalimetry",
    title: "4. Standard Na₂CO₃ (5.3 g/L) vs HCl",
    buretteLabel: "HCl soln",
    flaskLabel: "Std. Na₂CO₃ (5.3 g/L)",
    reaction: "2HCl + Na₂CO₃ → 2NaCl + H₂CO₃",
    indicator: "methyl_orange",
    indicatorName: "Methyl Orange (Golden Yellow → Orange Red)",
    needsAcid: false,
    needsHeat: false,
    stdIn: "flask",
    stdMassPerLitre: 5.3,
    stdEqMass: 53,
    unkEqMass: 36.5,
    unkLabel: "HCl",
    buretteColor: "rgba(186, 230, 253, 0.58)",
    trueEndpoint: 21.2
  },
  {
    id: 5,
    category: "Acidimetry & Alkalimetry",
    title: "5. Standard KOH (5.6 g/L) vs Oxalic Acid",
    buretteLabel: "Oxalic Acid (H₂C₂O₄)",
    flaskLabel: "Std. KOH (5.6 g/L)",
    reaction: "H₂C₂O₄ + 2KOH → K₂C₂O₄ + 2H₂O",
    indicator: "phenolphthalein",
    indicatorName: "Phenolphthalein (Pink → Colourless)",
    needsAcid: false,
    needsHeat: false,
    stdIn: "flask",
    stdMassPerLitre: 5.6,
    stdEqMass: 56,
    unkEqMass: 63,
    unkLabel: "H₂C₂O₄",
    buretteColor: "rgba(186, 230, 253, 0.58)",
    trueEndpoint: 19.2
  },
  {
    id: 6,
    category: "Permanganometry",
    title: "6. KMnO₄ vs Standard Oxalic Acid (6.3 g/L)",
    buretteLabel: "KMnO₄ soln",
    flaskLabel: "Std. H₂C₂O₄ (6.3 g/L)",
    reaction: "2KMnO₄ + 3H₂SO₄ + 5H₂C₂O₄ → K₂SO₄ + 2MnSO₄ + 10CO₂ + 8H₂O",
    indicator: "self",
    indicatorName: "Self-indicator KMnO₄ (Colourless → Light Permanent Pink)",
    needsAcid: true,
    needsHeat: true,
    stdIn: "flask",
    stdMassPerLitre: 6.3,
    stdEqMass: 63,
    unkEqMass: 31.6,
    unkLabel: "KMnO₄",
    buretteColor: "rgba(147, 51, 234, 0.88)",
    trueEndpoint: 20.4
  },
  {
    id: 7,
    category: "Permanganometry",
    title: "7. KMnO₄ vs Standard Mohr's Salt (6.3 g/L)",
    buretteLabel: "KMnO₄ soln",
    flaskLabel: "Std. Mohr's Salt (6.3 g/L)",
    reaction: "2KMnO₄ + 8H₂SO₄ + 10FeSO₄ → K₂SO₄ + 2MnSO₄ + 5Fe₂(SO₄)₃ + 8H₂O",
    indicator: "self",
    indicatorName: "Self-indicator KMnO₄ (Colourless → Light Permanent Pink)",
    needsAcid: true,
    needsHeat: false,
    stdIn: "flask",
    stdMassPerLitre: 6.3,
    stdEqMass: 392,
    unkEqMass: 31.6,
    unkLabel: "KMnO₄",
    buretteColor: "rgba(147, 51, 234, 0.88)",
    trueEndpoint: 16.0
  }
];

// =========================================================================
// WEB AUDIO API SOUND EFFECTS ENGINE
// =========================================================================
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }
  ensure() {
    if (this.muted) return null;
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }
  playDrop(pitchMul = 1) {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(620 * pitchMul, t);
    osc.frequency.exponentialRampToValueAtTime(1180 * pitchMul, t + 0.055);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.11, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.075);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }
  playNoise(duration, filterFreq, gainVal, rampFreq = null) {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    const bufSize = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const flt = ctx.createBiquadFilter();
    flt.type = "bandpass";
    flt.frequency.setValueAtTime(filterFreq, t);
    if (rampFreq) flt.frequency.linearRampToValueAtTime(rampFreq, t + duration);
    flt.Q.value = 1.6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(gainVal, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    src.connect(flt).connect(g).connect(ctx.destination);
    src.start(t);
    src.stop(t + duration);
  }
  playSuction() { this.playNoise(0.65, 380, 0.14, 920); }
  playPour() { this.playNoise(0.85, 760, 0.12, 480); }
  playSwirl() { this.playNoise(0.38, 460, 0.10, 300); }
  playIgnite() { this.playNoise(0.55, 220, 0.18, 130); }
  playValveClick() {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.025);
    g.gain.setValueAtTime(0.07, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.035);
  }
  playChime() {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);
      g.gain.setValueAtTime(0.001, t + idx * 0.08);
      g.gain.linearRampToValueAtTime(0.09, t + idx * 0.08 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.35);
      osc.connect(g).connect(ctx.destination);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.38);
    });
  }
  playWarn() {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    [330, 260].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, t + idx * 0.13);
      g.gain.setValueAtTime(0.04, t + idx * 0.13);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.13 + 0.11);
      osc.connect(g).connect(ctx.destination);
      osc.start(t + idx * 0.13);
      osc.stop(t + idx * 0.13 + 0.12);
    });
  }
}

const soundFX = new SoundEngine();

let currentExp = EXPERIMENTS[0];
let state = createInitialState();
let readings = [];
let lastValveTick = 0;

function createInitialState() {
  return {
    buretteReading: 50.0, // starts empty until user fills to 0.0 mL!
    initialReading: 0.0,
    isBuretteFilled: false,
    hasPipetted: false,
    pipettedVisualMl: 0,
    hasAcid: false,
    acidVisualMl: 0,
    indicator: null,
    temp: 25,
    targetTemp: 25,
    addedTitrant: 0.0,
    swirlAmp: 0,
    swirlPhase: 0,
    valveAngle: 0, // 0° = closed, 1..180° = steering wheel open angle
    drops: [],
    plumes: [],
    steam: [],
    endpointCelebrated: false,
    currColor: { r: 224, g: 242, b: 254, a: 0.35 },
    // Active bench animations
    pipetteAnim: null,  // { t: 0..1 }
    fillAnim: null,     // { t: 0..1, startReading }
    dropperAnim: null,  // { t: 0..1, ind, droppedCount }
    acidAnim: null,     // { t: 0..1 }
    heatAnim: null      // { t: 0..1 }
  };
}

const expSelect = document.getElementById("expSelect");
const obsBar = document.getElementById("obsBar");
const buretteReadout = document.getElementById("buretteReadout");
const flaskStatus = document.getElementById("flaskStatus");
const labCanvas = document.getElementById("labCanvas");
const meniscusCanvas = document.getElementById("meniscusCanvas");
const stopcockWheel = document.getElementById("stopcockWheel");
const valveFlowLabel = document.getElementById("valveFlowLabel");

function init() {
  EXPERIMENTS.forEach((e) => {
    const opt = document.createElement("option");
    opt.value = e.id;
    opt.textContent = e.title;
    expSelect.appendChild(opt);
  });

  expSelect.addEventListener("change", () => {
    currentExp = EXPERIMENTS.find((e) => e.id === parseInt(expSelect.value, 10)) || EXPERIMENTS[0];
    readings = [];
    resetTrial(true);
    renderReadings();
  });

  const soundBtn = document.getElementById("soundToggleBtn");
  soundBtn.addEventListener("click", () => {
    soundFX.muted = !soundFX.muted;
    soundBtn.textContent = soundFX.muted ? "🔇 Muted" : "🔊 Sound On";
    if (!soundFX.muted) soundFX.playDrop(1.1);
  });

  document.getElementById("pipetteBtn").addEventListener("click", pipetteSample);
  document.getElementById("acidBtn").addEventListener("click", addDilH2SO4);
  document.getElementById("phenolBtn").addEventListener("click", () => addIndicator("phenolphthalein"));
  document.getElementById("methylBtn").addEventListener("click", () => addIndicator("methyl_orange"));
  document.getElementById("heatBtn").addEventListener("click", warmFlask);
  document.getElementById("swirlBtn").addEventListener("click", swirlFlask);
  document.getElementById("fillBuretteBtn").addEventListener("click", fillBurette);
  document.getElementById("drop1Btn").addEventListener("click", () => addTitrant(0.1));

  setupStopcockWheel();

  document.getElementById("logReadingBtn").addEventListener("click", recordReading);
  document.getElementById("newTrialBtn").addEventListener("click", () => resetTrial(false));
  document.getElementById("resetAllBtn").addEventListener("click", () => {
    readings = [];
    resetTrial(true);
    renderReadings();
  });

  const drawer = document.getElementById("obsDrawer");
  document.getElementById("recordBookBtn").addEventListener("click", () => {
    drawer.classList.toggle("hidden");
    renderReadings();
  });
  document.getElementById("closeDrawerBtn").addEventListener("click", () => drawer.classList.add("hidden"));
  document.getElementById("clearReadingsBtn").addEventListener("click", () => {
    readings = [];
    renderReadings();
  });
  document.getElementById("checkCalcBtn").addEventListener("click", checkCalculation);

  // Mobile warning modal
  const dw = document.getElementById("deviceWarning");
  const tryBtn = document.getElementById("tryAnywayBtn");
  if (dw && tryBtn) {
    if (window.innerWidth <= 820 && !sessionStorage.getItem("eduhome_try_mobile")) {
      dw.classList.remove("hidden");
    }
    tryBtn.addEventListener("click", () => {
      sessionStorage.setItem("eduhome_try_mobile", "1");
      dw.classList.add("hidden");
    });
  }

  resetTrial(true);
  renderReadings();
  requestAnimationFrame(renderLoop);
}

// =========================================================================
// ROTARY STOPCOCK STEERING WHEEL LOGIC
// =========================================================================
function setValveAngle(deg) {
  const clamped = Math.max(0, Math.min(180, Math.round(deg)));
  if (Math.abs(clamped - state.valveAngle) >= 8) soundFX.playValveClick();
  state.valveAngle = clamped;
  stopcockWheel.style.transform = `rotate(${clamped}deg)`;
  stopcockWheel.setAttribute("aria-valuenow", String(clamped));

  valveFlowLabel.className = "valve-badge";
  if (clamped === 0) {
    valveFlowLabel.textContent = "Closed (0°)";
  } else if (clamped <= 60) {
    valveFlowLabel.textContent = `Slow Drops (${clamped}°)`;
    valveFlowLabel.classList.add("open-slow");
  } else if (clamped <= 120) {
    valveFlowLabel.textContent = `Fast Drops (${clamped}°)`;
    valveFlowLabel.classList.add("open-med");
  } else {
    valveFlowLabel.textContent = `Stream (${clamped}°)`;
    valveFlowLabel.classList.add("open-fast");
  }
}

function setupStopcockWheel() {
  let dragging = false;
  let lastPointerAngle = 0;

  const getPointerAngle = (el, clientX, clientY) => {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
  };

  stopcockWheel.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    dragging = true;
    stopcockWheel.setPointerCapture(e.pointerId);
    lastPointerAngle = getPointerAngle(stopcockWheel, e.clientX, e.clientY);
  });

  stopcockWheel.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const cur = getPointerAngle(stopcockWheel, e.clientX, e.clientY);
    let delta = cur - lastPointerAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    lastPointerAngle = cur;
    setValveAngle(state.valveAngle + delta);
  });

  const endDrag = () => { dragging = false; };
  stopcockWheel.addEventListener("pointerup", endDrag);
  stopcockWheel.addEventListener("pointercancel", endDrag);

  stopcockWheel.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") setValveAngle(state.valveAngle + 15);
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") setValveAngle(state.valveAngle - 15);
  });

  document.getElementById("valveLessBtn").addEventListener("click", () => setValveAngle(state.valveAngle - 20));
  document.getElementById("valveMoreBtn").addEventListener("click", () => setValveAngle(state.valveAngle + 20));
  document.getElementById("valveCloseBtn").addEventListener("click", () => setValveAngle(0));

  // Direct canvas stopcock steering/click
  let canvasDragging = false;
  let canvasStartY = 0;
  let canvasStartAngle = 0;
  labCanvas.addEventListener("pointerdown", (e) => {
    const rect = labCanvas.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (900 / rect.width);
    const sy = (e.clientY - rect.top) * (720 / rect.height);
    if (Math.hypot(sx - 450, sy - 351) < 38) {
      canvasDragging = true;
      canvasStartY = e.clientY;
      canvasStartAngle = state.valveAngle;
      labCanvas.setPointerCapture(e.pointerId);
    }
  });
  labCanvas.addEventListener("pointermove", (e) => {
    if (!canvasDragging) return;
    const dy = canvasStartY - e.clientY;
    setValveAngle(canvasStartAngle + dy * 1.4);
  });
  labCanvas.addEventListener("pointerup", () => { canvasDragging = false; });
}

// =========================================================================
// TRIAL ACTIONS WITH ANIMATIONS & SOUNDS
// =========================================================================
function resetTrial(resetBurette) {
  const prevRead = resetBurette ? 50.0 : state.buretteReading;
  const wasFilled = resetBurette ? false : state.isBuretteFilled;
  state = createInitialState();
  state.buretteReading = prevRead;
  state.initialReading = prevRead;
  state.isBuretteFilled = wasFilled;
  setValveAngle(0);

  showObs(resetBurette
    ? `🧪 <strong>${currentExp.title}</strong> — Step 1: Click <strong>Pipette 20 mL</strong> &amp; <strong>Fill (0.0 mL)</strong> the burette!`
    : `🔄 Flask rinsed! Initial burette reading: <strong>${prevRead.toFixed(1)} mL</strong>. Pipette 20 mL to begin next trial.`);
  updateStatus();
}

function pipetteSample() {
  if (state.hasPipetted || state.pipetteAnim) {
    showObs("⚠️ 20 mL is already in the conical flask. Rinse Flask to start a fresh trial.");
    return;
  }
  state.pipetteAnim = { t: 0, phaseSound: 0 };
  soundFX.playSuction();
  showObs(`🧪 Drawing <strong>20 mL ${currentExp.flaskLabel}</strong> from beaker into pipette...`);
}

function addDilH2SO4() {
  if (!state.hasPipetted) { showObs("⚠️ Pipette 20 mL of sample first!"); soundFX.playWarn(); return; }
  if (state.hasAcid || state.acidAnim) { showObs("ℹ️ 20 mL dil. H₂SO₄ is already added."); return; }
  state.acidAnim = { t: 0 };
  soundFX.playPour();
  showObs("💧 Pouring <strong>20 mL dil. H₂SO₄</strong> from measuring cylinder...");
}

function addIndicator(ind) {
  if (!state.hasPipetted) { showObs("⚠️ Pipette 20 mL into the conical flask first!"); soundFX.playWarn(); return; }
  if (currentExp.indicator === "self") {
    showObs("ℹ️ KMnO₄ acts as a <strong>self-indicator</strong> — no external indicator needed!");
    return;
  }
  if (state.dropperAnim) return;
  state.dropperAnim = { t: 0, ind, droppedCount: 0 };
  showObs(`🧪 Adding drops of <strong>${ind === "phenolphthalein" ? "Phenolphthalein" : "Methyl Orange"}</strong>...`);
}

function warmFlask() {
  if (!state.hasPipetted) { showObs("⚠️ Pipette 20 mL into the flask first!"); soundFX.playWarn(); return; }
  state.targetTemp = 65;
  state.heatAnim = { t: 0 };
  soundFX.playIgnite();
  showObs("🔥 Lighting burner to warm flask to <strong>65°C</strong>...");
}

function swirlFlask() {
  state.swirlAmp = 9.5;
  state.flashPink = Math.max(0, state.flashPink - 0.65);
  state.plumes.forEach((p) => { p.alpha *= 0.35; });
  soundFX.playSwirl();
  updateStatus();
}

function fillBurette() {
  if (state.fillAnim) return;
  setValveAngle(0);
  state.fillAnim = { t: 0, startReading: state.buretteReading };
  soundFX.playPour();
  showObs(`⬆️ Placing funnel &amp; pouring <strong>${currentExp.buretteLabel}</strong> to the <strong>0.0 mL</strong> mark...`);
}

function addTitrant(ml, fromValve = false) {
  if (!state.isBuretteFilled || state.buretteReading >= 50.0) {
    if (fromValve) setValveAngle(0);
    showObs("⚠️ Burette is empty! Click <strong>Fill (0.0 mL)</strong> with " + currentExp.buretteLabel + ".");
    soundFX.playWarn();
    return;
  }
  if (!state.hasPipetted) {
    if (fromValve) setValveAngle(0);
    showObs("⚠️ Pipette 20 mL into the conical flask first!");
    soundFX.playWarn();
    return;
  }
  if (state.buretteReading + ml > 50.0) {
    if (fromValve) setValveAngle(0);
    showObs("⚠️ Burette reached 50.0 mL! Click <strong>Fill (0.0 mL)</strong>.");
    soundFX.playWarn();
    return;
  }

  state.buretteReading = +(state.buretteReading + ml).toFixed(1);
  state.addedTitrant = +(state.addedTitrant + ml).toFixed(1);
  state.swirlAmp = Math.min(7, state.swirlAmp + 1.8);
  state.flashPink = 1.0;

  // Pitch slightly rises as flask fills
  soundFX.playDrop(0.95 + (state.addedTitrant / 40) * 0.25);

  // Spawn falling drop + localized indicator plume
  const dropCol = currentExp.indicator === "self" ? { r: 147, g: 51, b: 234 } : { r: 186, g: 230, b: 253 };
  state.drops.push({ y: 387, vy: 4.0, color: dropCol });

  const plumeCol = currentExp.indicator === "self"
    ? { r: 217, g: 70, b: 239 }
    : (state.indicator === "phenolphthalein"
      ? { r: 244, g: 114, b: 182 }
      : (state.indicator === "methyl_orange" ? { r: 249, g: 115, b: 22 } : { r: 186, g: 230, b: 253 }));
  state.plumes.push({ x: 450 + (Math.random() - 0.5) * 14, r: 5, alpha: 0.85, color: plumeCol });

  const diff = state.addedTitrant - currentExp.trueEndpoint;
  if (currentExp.needsAcid && !state.hasAcid) {
    showObs("⚠️ <strong>Forgot dil. H₂SO₄!</strong> KMnO₄ forms brown MnO₂ without acid — Rinse Flask and add 20 mL dil. H₂SO₄.");
  } else if (currentExp.needsHeat && state.temp < 55) {
    showObs("⚠️ <strong>Oxalic acid is cold!</strong> Warm the flask to ~65°C so KMnO₄ reacts rapidly.");
  } else if (currentExp.indicator !== "self" && !state.indicator) {
    showObs("⚠️ <strong>No indicator in flask!</strong> Add <strong>Phenolphthalein</strong> or <strong>Methyl Orange</strong> to observe the colour change.");
  } else if (currentExp.indicator !== "self" && state.indicator !== currentExp.indicator) {
    showObs(`⚠️ <strong>Wrong indicator!</strong> This titration requires <strong>${currentExp.indicatorName}</strong>.`);
  } else if (Math.abs(diff) <= 0.2) {
    if (!state.endpointCelebrated) {
      state.endpointCelebrated = true;
      soundFX.playChime();
    }
    const epMsg = currentExp.indicator === "phenolphthalein"
      ? "Pink colour just turned <strong>colourless</strong>!"
      : (currentExp.indicator === "methyl_orange"
        ? "Golden yellow just turned <strong>orange red</strong>!"
        : "Just appearance of <strong>light permanent pink</strong> colour!");
    showObs(`🎯 <strong>END POINT REACHED!</strong> ${epMsg} (Volume: <strong>${state.addedTitrant.toFixed(1)} mL</strong>) — Close Valve &amp; Record!`);
  } else if (diff > 0.2) {
    showObs(`⚠️ <strong>Overshot endpoint!</strong> Added ${state.addedTitrant.toFixed(1)} mL (endpoint ~${currentExp.trueEndpoint.toFixed(1)} mL). Rinse &amp; repeat!`);
  } else if (diff > -1.8) {
    showObs(`💧 Very near endpoint (${state.addedTitrant.toFixed(1)} mL) — steer valve to slow drops or use <strong>+1 Drop</strong>!`);
  }

  updateStatus();
}

function getFlaskTargetColor() {
  if (!state.hasPipetted && state.pipettedVisualMl <= 0.5) return { r: 224, g: 242, b: 254, a: 0.2 };
  const diff = state.addedTitrant - currentExp.trueEndpoint;

  if (currentExp.indicator === "self") {
    if (!state.hasAcid && state.addedTitrant > 0.2) return { r: 120, g: 53, b: 15, a: 0.82 };
    if (diff < -0.2) {
      return state.flashPink > 0.15 ? { r: 244, g: 114, b: 182, a: 0.36 } : { r: 224, g: 242, b: 254, a: 0.40 };
    }
    if (Math.abs(diff) <= 0.2) return { r: 244, g: 114, b: 182, a: 0.54 };
    return { r: 147, g: 51, b: 234, a: Math.min(0.94, 0.62 + diff * 0.12) };
  }

  if (!state.indicator) return { r: 224, g: 242, b: 254, a: 0.40 };

  if (state.indicator === "phenolphthalein") {
    if (diff < -0.6) return { r: 236, g: 72, b: 153, a: 0.80 }; // vivid pink
    if (diff < -0.2) return { r: 244, g: 114, b: 182, a: 0.50 }; // fading faint pink near endpoint
    return { r: 224, g: 242, b: 254, a: 0.38 }; // colourless at & after endpoint
  }

  if (state.indicator === "methyl_orange") {
    if (diff < -0.2) return { r: 250, g: 204, b: 21, a: 0.86 }; // golden yellow
    if (Math.abs(diff) <= 0.2) return { r: 239, g: 68, b: 34, a: 0.90 }; // vivid orange-red endpoint
    return { r: 220, g: 38, b: 38, a: 0.92 }; // overshot deep red
  }
  return { r: 224, g: 242, b: 254, a: 0.40 };
}

function updateStatus() {
  buretteReadout.textContent = state.isBuretteFilled ? state.buretteReading.toFixed(1) : "Empty";
  const parts = [];
  parts.push(state.hasPipetted ? `20 mL ${currentExp.flaskLabel}` : "Empty");
  if (state.hasAcid) parts.push("+20 mL H₂SO₄");
  if (state.indicator) parts.push(state.indicator === "phenolphthalein" ? "Phenolphthalein" : "Methyl Orange");
  parts.push(`${Math.round(state.temp)}°C`);
  flaskStatus.textContent = `Flask: ${parts.join(" · ")}`;
}

function showObs(html) {
  obsBar.innerHTML = html;
}

function recordReading() {
  if (!state.hasPipetted || state.addedTitrant <= 0) {
    showObs("⚠️ Perform a titration before recording a burette reading!");
    soundFX.playWarn();
    return;
  }
  readings.push({
    sl: readings.length + 1,
    v1: 20,
    initial: state.initialReading.toFixed(1),
    final: state.buretteReading.toFixed(1),
    used: +(state.buretteReading - state.initialReading).toFixed(1)
  });
  renderReadings();
  soundFX.playChime();
  showObs(`📝 Recorded Trial #${readings.length}: <strong>${(state.buretteReading - state.initialReading).toFixed(1)} mL</strong> used. Click <strong>Rinse Flask</strong> for concordant trial!`);
}

function getConcordantV2() {
  if (readings.length < 2) return null;
  for (let i = 0; i < readings.length; i++) {
    for (let j = i + 1; j < readings.length; j++) {
      if (Math.abs(readings[i].used - readings[j].used) <= 0.15) {
        return +((readings[i].used + readings[j].used) / 2).toFixed(2);
      }
    }
  }
  return null;
}

function renderReadings() {
  document.getElementById("readingCount").textContent = readings.length;
  const e = currentExp;
  document.getElementById("expSummaryCard").innerHTML = `
    <strong>${e.title}</strong><br/>
    Reaction: <code>${e.reaction}</code><br/>
    Indicator: <strong>${e.indicatorName}</strong><br/>
    Burette: ${e.buretteLabel} | Flask: 20 mL ${e.flaskLabel}
  `;

  const tbody = document.getElementById("readingsBody");
  if (readings.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No burette readings recorded yet.</td></tr>`;
  } else {
    tbody.innerHTML = readings.map((r) => `
      <tr>
        <td>${r.sl}</td>
        <td>${r.v1}</td>
        <td>${r.initial}</td>
        <td>${r.final}</td>
        <td><strong>${r.used.toFixed(1)}</strong></td>
      </tr>
    `).join("");
  }

  const v2 = getConcordantV2();
  const badge = document.getElementById("concordantBadge");
  const calcSteps = document.getElementById("calcFormulaText");
  const nStd = e.stdMassPerLitre / e.stdEqMass;

  if (v2) {
    badge.textContent = `Concordant V₂ = ${v2.toFixed(1)} mL`;
    badge.style.color = "#16a34a";
    const nUnk = e.stdIn === "burette" ? (v2 * nStd) / 20 : (20 * nStd) / v2;
    const massPerLitre = nUnk * e.unkEqMass;
    const mass100 = (massPerLitre * 100) / 1000;
    calcSteps.innerHTML = `
      Standard Normality = ${e.stdMassPerLitre} / ${e.stdEqMass} = <strong>${nStd.toFixed(4)} N</strong><br/>
      V₁N₁ = V₂N₂ → V₁ = 20 mL, V₂ = ${v2.toFixed(1)} mL<br/>
      Normality of ${e.unkLabel} = <strong>${nUnk.toFixed(4)} N</strong><br/>
      Mass/litre = N × ${e.unkEqMass} = ${massPerLitre.toFixed(3)} g/L<br/>
      Mass in 100 mL = (${massPerLitre.toFixed(3)} × 100) / 1000 = <strong>${mass100.toFixed(3)} g</strong>
    `;
  } else {
    badge.textContent = "Record 2 matching trials (within 0.1 mL)";
    badge.style.color = "#64748b";
    calcSteps.innerHTML = `
      Standard Normality = ${e.stdMassPerLitre} / ${e.stdEqMass} = <strong>${nStd.toFixed(4)} N</strong><br/>
      Formula: <code>V₁N₁ = V₂N₂</code> (V₁ = 20 mL)<br/>
      Mass in 100 mL = <code>(N × ${e.unkEqMass} × 100) / 1000</code>
    `;
  }
}

function checkCalculation() {
  const v2 = getConcordantV2() || currentExp.trueEndpoint;
  const e = currentExp;
  const nStd = e.stdMassPerLitre / e.stdEqMass;
  const trueN = e.stdIn === "burette" ? (v2 * nStd) / 20 : (20 * nStd) / v2;
  const trueMass = (trueN * e.unkEqMass * 100) / 1000;

  const uN = parseFloat(document.getElementById("userNormality").value);
  const uM = parseFloat(document.getElementById("userMass").value);
  const fb = document.getElementById("calcFeedback");
  if (isNaN(uN) || isNaN(uM)) {
    fb.style.color = "#dc2626";
    fb.textContent = "Enter both Normality and Mass in 100 mL.";
    soundFX.playWarn();
    return;
  }
  const nOk = Math.abs(uN - trueN) <= 0.006;
  const mOk = Math.abs(uM - trueMass) <= 0.03;
  if (nOk && mOk) {
    fb.style.color = "#16a34a";
    fb.textContent = `🎉 Correct! (${trueN.toFixed(4)} N, ${trueMass.toFixed(3)} g)`;
    soundFX.playChime();
  } else {
    fb.style.color = "#dc2626";
    fb.textContent = `${nOk ? "Normality ✅" : "Normality ❌"} | ${mOk ? "Mass ✅" : "Mass ❌"}`;
    soundFX.playWarn();
  }
}

// =========================================================================
// 60FPS ANIMATIONS & VALVE FLOW TICK
// =========================================================================
function stepSimulation(now) {
  // 1. Rotary Stopcock continuous flow
  if (state.valveAngle > 0 && state.isBuretteFilled) {
    const intervalMs = Math.max(55, 760 - (state.valveAngle / 180) * 705);
    if (now - lastValveTick >= intervalMs) {
      lastValveTick = now;
      const mlStep = state.valveAngle >= 140 ? 0.3 : (state.valveAngle >= 95 ? 0.2 : 0.1);
      addTitrant(mlStep, true);
    }
  }

  // 2. Pipette animation
  if (state.pipetteAnim) {
    const p = state.pipetteAnim;
    p.t += 0.011;
    if (p.t >= 0.72 && p.phaseSound === 0) {
      p.phaseSound = 1;
      soundFX.playPour();
    }
    if (p.t >= 0.72) {
      const frac = Math.min(1, (p.t - 0.72) / 0.25);
      state.pipettedVisualMl = frac * 20;
      state.swirlAmp = 4;
    }
    if (p.t >= 1) {
      state.pipetteAnim = null;
      state.hasPipetted = true;
      state.pipettedVisualMl = 20;
      showObs(currentExp.needsAcid
        ? `🧪 Pipetted <strong>20 mL ${currentExp.flaskLabel}</strong>. Now add <strong>20 mL dil. H₂SO₄</strong>!`
        : `🧪 Pipetted <strong>20 mL ${currentExp.flaskLabel}</strong>. Now add the proper indicator!`);
      updateStatus();
    }
  }

  // 3. Burette Fill animation
  if (state.fillAnim) {
    const f = state.fillAnim;
    f.t += 0.016;
    const frac = Math.min(1, f.t);
    state.isBuretteFilled = true;
    state.buretteReading = +(f.startReading * (1 - frac)).toFixed(1);
    updateStatus();
    if (f.t >= 1) {
      state.fillAnim = null;
      state.buretteReading = 0.0;
      state.initialReading = 0.0;
      soundFX.playDrop(1.2);
      showObs(`⬆️ Burette filled to <strong>0.0 mL</strong> with ${currentExp.buretteLabel}. Steer the Stopcock Wheel to titrate!`);
      updateStatus();
    }
  }

  // 4. Dilute H2SO4 Measuring Cylinder animation
  if (state.acidAnim) {
    const a = state.acidAnim;
    a.t += 0.018;
    if (a.t >= 0.35 && a.t <= 0.9) {
      state.acidVisualMl = Math.min(20, ((a.t - 0.35) / 0.55) * 20);
      state.swirlAmp = 4.5;
    }
    if (a.t >= 1) {
      state.acidAnim = null;
      state.hasAcid = true;
      state.acidVisualMl = 20;
      showObs(currentExp.needsHeat
        ? "💧 Added <strong>20 mL dil. H₂SO₄</strong>. Warm the flask to ~65°C before titrating Oxalic Acid with KMnO₄!"
        : "💧 Added <strong>20 mL dil. H₂SO₄</strong>. Ready to titrate against KMnO₄!");
      updateStatus();
    }
  }

  // 5. Indicator Dropper animation
  if (state.dropperAnim) {
    const d = state.dropperAnim;
    d.t += 0.022;
    if (d.t > 0.3 && d.droppedCount === 0) {
      d.droppedCount = 1;
      soundFX.playDrop(1.1);
      state.drops.push({ y: 405, vy: 3.5, color: d.ind === "phenolphthalein" ? { r: 236, g: 72, b: 153 } : { r: 250, g: 204, b: 21 } });
    }
    if (d.t > 0.55 && d.droppedCount === 1) {
      d.droppedCount = 2;
      soundFX.playDrop(1.15);
      state.indicator = d.ind;
      state.swirlAmp = 4;
      state.drops.push({ y: 405, vy: 3.5, color: d.ind === "phenolphthalein" ? { r: 236, g: 72, b: 153 } : { r: 250, g: 204, b: 21 } });
    }
    if (d.t >= 1) {
      const ind = d.ind;
      state.dropperAnim = null;
      if (ind !== currentExp.indicator) {
        showObs(`⚠️ Wrong indicator for ${currentExp.title}! Recommended: <strong>${currentExp.indicatorName}</strong>.`);
        soundFX.playWarn();
      } else {
        showObs(`✅ Added <strong>${ind === "phenolphthalein" ? "Phenolphthalein (Pink)" : "Methyl Orange (Golden Yellow)"}</strong>. Titrate with the Stopcock Wheel!`);
      }
      updateStatus();
    }
  }

  // 6. Heating animation
  if (state.temp < state.targetTemp) {
    state.temp = Math.min(state.targetTemp, state.temp + 0.35);
    updateStatus();
    if (Math.random() < 0.25) {
      state.steam.push({ x: 450 + (Math.random() - 0.5) * 26, y: 440, alpha: 0.75, r: 4 + Math.random() * 4 });
    }
  }
  if (state.heatAnim) {
    state.heatAnim.t += 0.009;
    if (state.heatAnim.t >= 1) {
      state.heatAnim = null;
      showObs("🔥 Flask warmed to <strong>65°C</strong> (bearable warm). Now titrate against KMnO₄!");
    }
  }
}

function renderLoop(now) {
  stepSimulation(now);
  renderLabCanvas();
  renderMeniscusCanvas();
  requestAnimationFrame(renderLoop);
}

function renderLabCanvas() {
  const ctx = labCanvas.getContext("2d");
  ctx.clearRect(0, 0, 900, 720);

  state.swirlPhase += 0.22;
  state.swirlAmp *= 0.94;
  state.flashPink *= 0.94;

  const tc = getFlaskTargetColor();
  state.currColor.r += (tc.r - state.currColor.r) * 0.25;
  state.currColor.g += (tc.g - state.currColor.g) * 0.25;
  state.currColor.b += (tc.b - state.currColor.b) * 0.25;
  state.currColor.a += (tc.a - state.currColor.a) * 0.25;

  // Retort Stand & White Porcelain Tile
  ctx.fillStyle = "#334155";
  ctx.fillRect(210, 678, 320, 18);
  ctx.fillStyle = "#94a3b8";
  ctx.fillRect(245, 55, 14, 625);
  ctx.fillStyle = "#475569";
  ctx.fillRect(259, 210, 175, 12);

  // White Porcelain Tile under flask
  ctx.fillStyle = "#f8fafc";
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 2;
  ctx.fillRect(365, 656, 170, 22);
  ctx.strokeRect(365, 656, 170, 22);

  // Sample Beaker on right side of bench (for Pipetting)
  drawSampleBeaker(ctx);

  // Burette body (x: 434..466, y: 65..335)
  const bx = 434, bw = 32, bTop = 65, bBot = 335;
  const fillRatio = state.isBuretteFilled ? Math.max(0, 1 - state.buretteReading / 50.0) : 0;
  const liqY = bBot - fillRatio * (bBot - bTop - 16);

  if (fillRatio > 0.01) {
    ctx.fillStyle = currentExp.buretteColor;
    ctx.fillRect(bx + 2, liqY, bw - 4, bBot - liqY);
  }

  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 2.5;
  ctx.strokeRect(bx, bTop, bw, bBot - bTop);
  ctx.fillStyle = "#475569";
  ctx.font = "11px Segoe UI";
  for (let ml = 0; ml <= 50; ml += 5) {
    const gy = bTop + 16 + (ml / 50) * (bBot - bTop - 16);
    ctx.beginPath();
    ctx.moveTo(bx, gy);
    ctx.lineTo(bx + (ml % 10 === 0 ? 12 : 7), gy);
    ctx.stroke();
    if (ml % 10 === 0) ctx.fillText(String(ml), bx - 22, gy + 4);
  }

  // Stopcock & nozzle
  ctx.fillStyle = "#64748b";
  ctx.fillRect(bx + 10, bBot, 12, 34);
  ctx.beginPath();
  ctx.moveTo(bx + 12, bBot + 34);
  ctx.lineTo(bx + 20, bBot + 34);
  ctx.lineTo(bx + 16, bBot + 52);
  ctx.closePath();
  ctx.fill();

  // Rotary Stopcock Handle on Canvas (turns smoothly with valveAngle!)
  ctx.save();
  ctx.translate(bx + 16, bBot + 16);
  ctx.rotate((Math.PI / 2) - (state.valveAngle / 180) * (Math.PI / 2));
  ctx.fillStyle = state.valveAngle > 0 ? "#0284c7" : "#475569";
  ctx.fillRect(-18, -4.5, 36, 9);
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#f8fafc";
  ctx.fill();
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Continuous stream visual if valveAngle > 130
  if (state.valveAngle > 130 && state.isBuretteFilled && state.hasPipetted) {
    ctx.strokeStyle = currentExp.buretteColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(450, 387);
    ctx.lineTo(450, 585);
    ctx.stroke();
  }

  // Falling drops
  for (let i = state.drops.length - 1; i >= 0; i--) {
    const d = state.drops[i];
    d.y += d.vy;
    d.vy += 0.35;
    if (d.y >= 585) { state.drops.splice(i, 1); continue; }
    ctx.fillStyle = `rgba(${d.color.r}, ${d.color.g}, ${d.color.b}, 0.92)`;
    ctx.beginPath();
    ctx.ellipse(450, d.y, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Conical Flask (centered at x = 450, resting on tile y = 656)
  const totalVol = state.pipettedVisualMl + state.acidVisualMl + state.addedTitrant;
  const liqTop = 656 - Math.min(132, 22 + totalVol * 1.45);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(432, 435);
  ctx.lineTo(468, 435);
  ctx.lineTo(468, 490);
  ctx.lineTo(525, 638);
  ctx.quadraticCurveTo(530, 656, 505, 656);
  ctx.lineTo(395, 656);
  ctx.quadraticCurveTo(370, 656, 375, 638);
  ctx.lineTo(432, 490);
  ctx.closePath();
  ctx.clip();

  if (totalVol > 0.3) {
    ctx.beginPath();
    ctx.moveTo(365, 660);
    ctx.lineTo(365, liqTop);
    for (let x = 365; x <= 535; x += 6) {
      const wave = Math.sin(state.swirlPhase + x * 0.08) * state.swirlAmp;
      ctx.lineTo(x, liqTop + wave);
    }
    ctx.lineTo(535, 660);
    ctx.closePath();
    const { r, g, b, a } = state.currColor;
    ctx.fillStyle = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
    ctx.fill();

    // Localized indicator color plumes
    for (let i = state.plumes.length - 1; i >= 0; i--) {
      const pl = state.plumes[i];
      pl.r += 0.65;
      pl.alpha *= 0.965;
      if (pl.alpha < 0.03) { state.plumes.splice(i, 1); continue; }
      const grad = ctx.createRadialGradient(pl.x, liqTop + 10, 1, pl.x, liqTop + 10, pl.r);
      grad.addColorStop(0, `rgba(${pl.color.r}, ${pl.color.g}, ${pl.color.b}, ${pl.alpha})`);
      grad.addColorStop(1, `rgba(${pl.color.r}, ${pl.color.g}, ${pl.color.b}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pl.x, liqTop + 10, pl.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // Flask glass outline
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(428, 435);
  ctx.lineTo(472, 435);
  ctx.moveTo(432, 435);
  ctx.lineTo(432, 490);
  ctx.lineTo(375, 638);
  ctx.quadraticCurveTo(370, 656, 395, 656);
  ctx.lineTo(505, 656);
  ctx.quadraticCurveTo(530, 656, 525, 638);
  ctx.lineTo(468, 490);
  ctx.lineTo(468, 435);
  ctx.stroke();

  // Warm glow & Bunsen flame if heating
  if (state.heatAnim || state.temp >= 55) {
    const hg = ctx.createRadialGradient(450, 656, 8, 450, 646, 85);
    hg.addColorStop(0, "rgba(249, 115, 22, 0.36)");
    hg.addColorStop(1, "rgba(249, 115, 22, 0)");
    ctx.fillStyle = hg;
    ctx.fillRect(360, 580, 180, 80);
  }
  if (state.heatAnim) {
    drawBurnerFlame(ctx, 450, 676);
  }

  // Steam wisps above warm flask
  for (let i = state.steam.length - 1; i >= 0; i--) {
    const s = state.steam[i];
    s.y -= 1.2;
    s.x += Math.sin(s.y * 0.1) * 0.6;
    s.alpha -= 0.015;
    if (s.alpha <= 0) { state.steam.splice(i, 1); continue; }
    ctx.fillStyle = `rgba(148, 163, 184, ${s.alpha * 0.45})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Active interactive apparatus animations
  if (state.pipetteAnim) drawPipetteAnimation(ctx, state.pipetteAnim);
  if (state.fillAnim) drawBuretteFillAnimation(ctx, state.fillAnim);
  if (state.acidAnim) drawAcidCylinderAnimation(ctx, state.acidAnim);
  if (state.dropperAnim) drawDropperAnimation(ctx, state.dropperAnim);
}

function drawSampleBeaker(ctx) {
  const bx = 665, by = 568, bw = 82, bh = 108;
  // Liquid in sample beaker
  ctx.fillStyle = "rgba(186, 230, 253, 0.52)";
  ctx.fillRect(bx + 3, by + 34, bw - 6, bh - 36);
  // Beaker glass
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(bx - 4, by);
  ctx.lineTo(bx, by + 8);
  ctx.lineTo(bx, by + bh);
  ctx.lineTo(bx + bw, by + bh);
  ctx.lineTo(bx + bw, by + 8);
  ctx.lineTo(bx + bw + 4, by);
  ctx.stroke();

  ctx.fillStyle = "#334155";
  ctx.font = "bold 11px Segoe UI";
  ctx.textAlign = "center";
  ctx.fillText(currentExp.flaskLabel, bx + bw / 2, by + bh + 16);
  ctx.textAlign = "left";
}

function drawPipetteAnimation(ctx, p) {
  const t = p.t;
  let px = 706, py = 360, fillFrac = 0;

  if (t < 0.25) {
    // Move down into sample beaker
    const f = t / 0.25;
    py = 310 + f * 105;
  } else if (t < 0.55) {
    // Suck liquid up to 20 mL mark
    const f = (t - 0.25) / 0.30;
    py = 415;
    fillFrac = f;
  } else if (t < 0.72) {
    // Lift and glide over conical flask mouth
    const f = (t - 0.55) / 0.17;
    px = 706 - f * (706 - 450);
    py = 415 - Math.sin(f * Math.PI) * 145 - f * 125;
    fillFrac = 1;
  } else {
    // Drain into conical flask
    const f = (t - 0.72) / 0.28;
    px = 450;
    py = 290;
    fillFrac = Math.max(0, 1 - f * 1.1);
    if (fillFrac > 0.05) {
      ctx.strokeStyle = "rgba(186, 230, 253, 0.85)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(450, py + 150);
      ctx.lineTo(450, 595);
      ctx.stroke();
    }
  }

  // Draw 20 mL bulb pipette at (px, py)
  ctx.save();
  ctx.translate(px, py);
  // Liquid inside pipette
  if (fillFrac > 0.02) {
    ctx.fillStyle = "rgba(125, 211, 252, 0.75)";
    const liqH = fillFrac * 120;
    ctx.fillRect(-4, 150 - liqH, 8, liqH);
    if (fillFrac > 0.35) {
      ctx.beginPath();
      ctx.ellipse(0, 82, 10, 22, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Glass outline
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-4, 0); ctx.lineTo(-4, 58);
  ctx.quadraticCurveTo(-13, 82, -4, 106);
  ctx.lineTo(-4, 136); ctx.lineTo(-1, 150);
  ctx.lineTo(1, 150); ctx.lineTo(4, 136);
  ctx.lineTo(4, 106);
  ctx.quadraticCurveTo(13, 82, 4, 58);
  ctx.lineTo(4, 0);
  ctx.stroke();
  // 20 mL calibration ring
  ctx.strokeStyle = "#dc2626";
  ctx.beginPath();
  ctx.moveTo(-6, 30); ctx.lineTo(6, 30);
  ctx.stroke();
  ctx.restore();
}

function drawBuretteFillAnimation(ctx, f) {
  // Funnel at top of burette (450, 65)
  ctx.fillStyle = "rgba(226, 232, 240, 0.75)";
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(428, 32);
  ctx.lineTo(472, 32);
  ctx.lineTo(455, 62);
  ctx.lineTo(445, 62);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Tilted reagent bottle pouring into funnel
  ctx.save();
  ctx.translate(525, 24);
  ctx.rotate(-0.65);
  ctx.fillStyle = "#e2e8f0";
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 2;
  ctx.fillRect(-16, -34, 32, 48);
  ctx.strokeRect(-16, -34, 32, 48);
  ctx.fillStyle = currentExp.buretteColor;
  ctx.fillRect(-14, -18, 28, 30);
  ctx.restore();

  // Pour stream into burette
  ctx.strokeStyle = currentExp.buretteColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(498, 20);
  ctx.quadraticCurveTo(465, 25, 450, 65);
  ctx.stroke();
}

function drawAcidCylinderAnimation(ctx, a) {
  const f = Math.min(1, a.t / 0.35);
  const angle = -f * 1.15;
  ctx.save();
  ctx.translate(520, 412);
  ctx.rotate(angle);
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 2;
  ctx.strokeRect(-12, -52, 24, 64);
  ctx.fillStyle = "rgba(186, 230, 253, 0.68)";
  ctx.fillRect(-10, -28 + f * 18, 20, 38 - f * 18);
  ctx.restore();

  if (a.t >= 0.35 && a.t <= 0.9) {
    ctx.strokeStyle = "rgba(186, 230, 253, 0.85)";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(482, 408);
    ctx.quadraticCurveTo(455, 420, 450, 585);
    ctx.stroke();
  }
}

function drawDropperAnimation(ctx, d) {
  ctx.save();
  ctx.translate(450, 392);
  // Rubber bulb
  ctx.fillStyle = d.ind === "phenolphthalein" ? "#ec4899" : "#f59e0b";
  ctx.beginPath();
  ctx.arc(0, -24, 10, 0, Math.PI * 2);
  ctx.fill();
  // Glass pipette tip
  ctx.fillStyle = "rgba(241, 245, 249, 0.85)";
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-6, -15);
  ctx.lineTo(6, -15);
  ctx.lineTo(2, 16);
  ctx.lineTo(-2, 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawBurnerFlame(ctx, cx, baseY) {
  const flicker = Math.sin(Date.now() * 0.025) * 3;
  // Outer blue/orange flame
  ctx.fillStyle = "rgba(249, 115, 22, 0.82)";
  ctx.beginPath();
  ctx.moveTo(cx - 14, baseY);
  ctx.quadraticCurveTo(cx - 18, baseY - 22, cx + flicker, baseY - 38);
  ctx.quadraticCurveTo(cx + 18, baseY - 22, cx + 14, baseY);
  ctx.closePath();
  ctx.fill();
  // Inner blue cone
  ctx.fillStyle = "rgba(56, 189, 248, 0.92)";
  ctx.beginPath();
  ctx.moveTo(cx - 7, baseY);
  ctx.quadraticCurveTo(cx - 8, baseY - 14, cx + flicker * 0.5, baseY - 24);
  ctx.quadraticCurveTo(cx + 8, baseY - 14, cx + 7, baseY);
  ctx.closePath();
  ctx.fill();
}

function renderMeniscusCanvas() {
  const ctx = meniscusCanvas.getContext("2d");
  ctx.clearRect(0, 0, 140, 140);

  if (!state.isBuretteFilled) {
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(35, 0); ctx.lineTo(35, 140);
    ctx.moveTo(105, 0); ctx.lineTo(105, 140);
    ctx.stroke();
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 12px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillText("EMPTY", 70, 74);
    ctx.textAlign = "left";
    return;
  }

  const val = state.buretteReading;
  const centerY = 70;
  const pxPerMl = 24;

  ctx.fillStyle = currentExp.buretteColor;
  ctx.beginPath();
  ctx.moveTo(35, centerY - 6);
  ctx.quadraticCurveTo(70, centerY + 6, 105, centerY - 6);
  ctx.lineTo(105, 140);
  ctx.lineTo(35, 140);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(35, centerY - 6);
  ctx.quadraticCurveTo(70, centerY + 6, 105, centerY - 6);
  ctx.stroke();

  ctx.strokeStyle = "#475569";
  ctx.fillStyle = "#334155";
  ctx.font = "bold 11px Segoe UI";
  const minTick = Math.max(0, Math.floor((val - 3) * 10));
  const maxTick = Math.min(500, Math.ceil((val + 3) * 10));
  for (let t = minTick; t <= maxTick; t++) {
    const tickMl = t / 10;
    const y = centerY + (tickMl - val) * pxPerMl;
    const isWhole = t % 10 === 0;
    const isHalf = t % 5 === 0;
    ctx.lineWidth = isWhole ? 1.8 : 1;
    ctx.beginPath();
    ctx.moveTo(35, y);
    ctx.lineTo(35 + (isWhole ? 22 : isHalf ? 15 : 9), y);
    ctx.stroke();
    if (isWhole) ctx.fillText(tickMl.toFixed(0), 14, y + 4);
  }

  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(35, 0); ctx.lineTo(35, 140);
  ctx.moveTo(105, 0); ctx.lineTo(105, 140);
  ctx.stroke();
}

document.addEventListener("DOMContentLoaded", init);
