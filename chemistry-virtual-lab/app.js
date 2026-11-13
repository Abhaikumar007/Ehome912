// Class 12 Chemistry Virtual Lab — Multi-Tube Freeform PhET-Style Bench

const SALTS = [
  { id: 1, name: "Ammonium Carbonate", formula: "(NH₄)₂CO₃", cation: "NH4", anion: "CO3", cGroup: 0 },
  { id: 2, name: "Ammonium Acetate", formula: "CH₃COONH₄", cation: "NH4", anion: "CH3COO", cGroup: 0 },
  { id: 3, name: "Ammonium Chloride", formula: "NH₄Cl", cation: "NH4", anion: "Cl", cGroup: 0 },
  { id: 4, name: "Ammonium Sulphate", formula: "(NH₄)₂SO₄", cation: "NH4", anion: "SO4", cGroup: 0 },
  { id: 5, name: "Lead Acetate", formula: "Pb(CH₃COO)₂", cation: "Pb", anion: "CH3COO", cGroup: 1 },
  { id: 6, name: "Lead Nitrate", formula: "Pb(NO₃)₂", cation: "Pb", anion: "NO3", cGroup: 1 },
  { id: 7, name: "Aluminium Acetate", formula: "Al(CH₃COO)₃", cation: "Al", anion: "CH3COO", cGroup: 3 },
  { id: 8, name: "Aluminium Nitrate", formula: "Al(NO₃)₃", cation: "Al", anion: "NO3", cGroup: 3 },
  { id: 9, name: "Aluminium Sulphate", formula: "Al₂(SO₄)₃", cation: "Al", anion: "SO4", cGroup: 3 },
  { id: 10, name: "Zinc Acetate", formula: "Zn(CH₃COO)₂", cation: "Zn", anion: "CH3COO", cGroup: 4 },
  { id: 11, name: "Zinc Chloride", formula: "ZnCl₂", cation: "Zn", anion: "Cl", cGroup: 4 },
  { id: 12, name: "Zinc Nitrate", formula: "Zn(NO₃)₂", cation: "Zn", anion: "NO3", cGroup: 4 },
  { id: 13, name: "Zinc Sulphate", formula: "ZnSO₄", cation: "Zn", anion: "SO4", cGroup: 4 },
  { id: 14, name: "Barium Acetate", formula: "Ba(CH₃COO)₂", cation: "Ba", anion: "CH3COO", cGroup: 5 },
  { id: 15, name: "Barium Chloride", formula: "BaCl₂", cation: "Ba", anion: "Cl", cGroup: 5 },
  { id: 16, name: "Barium Nitrate", formula: "Ba(NO₃)₂", cation: "Ba", anion: "NO3", cGroup: 5 },
  { id: 17, name: "Calcium Chloride", formula: "CaCl₂", cation: "Ca", anion: "Cl", cGroup: 5 },
  { id: 18, name: "Calcium Nitrate", formula: "Ca(NO₃)₂", cation: "Ca", anion: "NO3", cGroup: 5 },
  { id: 19, name: "Magnesium Acetate", formula: "Mg(CH₃COO)₂", cation: "Mg", anion: "CH3COO", cGroup: 6 },
  { id: 20, name: "Magnesium Chloride", formula: "MgCl₂", cation: "Mg", anion: "Cl", cGroup: 6 },
  { id: 21, name: "Magnesium Nitrate", formula: "Mg(NO₃)₂", cation: "Mg", anion: "NO3", cGroup: 6 },
  { id: 22, name: "Magnesium Sulphate", formula: "MgSO₄", cation: "Mg", anion: "SO4", cGroup: 6 },
  { id: 23, name: "Copper(II) Sulphate", formula: "CuSO₄", cation: "Cu", anion: "SO4", cGroup: 2 }
];

const ORGANIC_GROUPS = [
  { id: 24, kind: "organic", org: "COOH", name: "Carboxylic Acid", formula: "R–COOH" },
  { id: 25, kind: "organic", org: "OH", name: "Phenol", formula: "Ar–OH" },
  { id: 26, kind: "organic", org: "NH2", name: "Amine", formula: "Ar–NH₂" },
  { id: 27, kind: "organic", org: "CHO", name: "Aldehyde", formula: "R–CHO" },
  { id: 28, kind: "organic", org: "CO", name: "Ketone", formula: "R–CO–R'" }
];

const ALL_SUBSTANCES = [...SALTS, ...ORGANIC_GROUPS];

let currentSalt = SALTS[0];
let mysteryMode = false;
let logs = [];

// Dynamic Bench Apparatus Instances
let nextUid = 1;
let benchTubes = [];        // { uid, el, state }
let benchBurners = [];      // { uid, el, on }
let benchBaths = [];        // { uid, el }
let benchWatchGlasses = []; // { uid, el, state }
let benchRods = [];         // { uid, el, reagent }
let activeTubeUid = null;

const saltSelect = document.getElementById("saltSelect");
const obsBar = document.getElementById("obsBar");
const logBody = document.getElementById("logBody");
const logCount = document.getElementById("logCount");
const dragGhost = document.getElementById("dragGhost");
const benchCanvas = document.getElementById("benchCanvas");

function init() {
  const og1 = document.createElement("optgroup");
  og1.label = "Inorganic Salts (23)";
  SALTS.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.id}. ${s.name} (${s.formula})`;
    og1.appendChild(opt);
  });
  saltSelect.appendChild(og1);

  const og2 = document.createElement("optgroup");
  og2.label = "Organic Functional Groups (5)";
  ORGANIC_GROUPS.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.id}. ${s.name} (${s.formula})`;
    og2.appendChild(opt);
  });
  saltSelect.appendChild(og2);

  saltSelect.addEventListener("change", () => {
    currentSalt = ALL_SUBSTANCES.find((s) => s.id === parseInt(saltSelect.value, 10)) || SALTS[0];
    clearBench(true);
    renderRecordBook();
  });

  const mysteryBtn = document.getElementById("mysteryBtn");
  mysteryBtn.addEventListener("click", () => {
    mysteryMode = !mysteryMode;
    mysteryBtn.classList.toggle("active", mysteryMode);
    mysteryBtn.textContent = mysteryMode ? "🎯 Mystery: ON" : "🎯 Mystery";
    document.getElementById("mysteryBar").classList.toggle("hidden", !mysteryMode);
    saltSelect.disabled = mysteryMode;
    if (mysteryMode) startMystery();
    else {
      currentSalt = SALTS.find((s) => s.id === parseInt(saltSelect.value, 10)) || SALTS[0];
      clearBench(true);
      renderRecordBook();
    }
  });

  document.getElementById("newMysteryBtn").addEventListener("click", startMystery);
  document.getElementById("verifyBtn").addEventListener("click", verifyMystery);
  document.getElementById("revealBtn").addEventListener("click", () => {
    document.getElementById("guessAnion").value = currentSalt.anion;
    document.getElementById("guessCation").value = currentSalt.cation;
    const fb = document.getElementById("mysteryFeedback");
    fb.style.color = "#0284c7";
    fb.textContent = `🔍 Answer: ${currentSalt.name} (${currentSalt.formula})`;
  });
  document.getElementById("guessAnion").addEventListener("change", () => {
    document.getElementById("mysteryFeedback").textContent = "";
  });
  document.getElementById("guessCation").addEventListener("change", () => {
    document.getElementById("mysteryFeedback").textContent = "";
  });

  document.getElementById("washTubeBtn").addEventListener("click", () => {
    const t = benchTubes.find((x) => x.uid === activeTubeUid) || benchTubes[benchTubes.length - 1];
    if (t) washSingleTube(t);
    if (benchWatchGlasses.length > 0) {
      benchWatchGlasses.forEach((wg) => {
        wg.state = { hasDrySalt: false, reagents: [], bubbles: false, liquidColor: null, pptColor: null, dippedTool: null, vapour: false };
        wg.fx = createWatchGlassFX(true);
      });
      showObs(t ? "🚰 Test tube & watch glass rinsed and clean!" : "🚰 Watch glass rinsed and clean!");
    }
  });
  document.getElementById("washBtn").addEventListener("click", () => clearBench(false));

  // Drawer & Tabs
  const drawer = document.getElementById("notebookDrawer");
  document.getElementById("notebookToggleBtn").addEventListener("click", () => {
    drawer.classList.toggle("hidden");
    renderRecordBook();
  });
  document.getElementById("closeDrawerBtn").addEventListener("click", () => drawer.classList.add("hidden"));
  document.getElementById("clearLogBtn").addEventListener("click", () => {
    logs = [];
    renderLog();
  });

  const tabMyLog = document.getElementById("tabMyLog");
  const tabRecordBook = document.getElementById("tabRecordBook");
  const panelMyLog = document.getElementById("panelMyLog");
  const panelRecordBook = document.getElementById("panelRecordBook");

  tabMyLog.addEventListener("click", () => {
    tabMyLog.classList.add("active");
    tabRecordBook.classList.remove("active");
    panelMyLog.classList.remove("hidden");
    panelRecordBook.classList.add("hidden");
  });

  tabRecordBook.addEventListener("click", () => {
    tabRecordBook.classList.add("active");
    tabMyLog.classList.remove("active");
    panelRecordBook.classList.remove("hidden");
    panelMyLog.classList.add("hidden");
    renderRecordBook();
  });

  setupShelfDrag();
  renderRecordBook();
  setInterval(runThermalPhysics, 350);
  requestAnimationFrame(renderAllPhysics);

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
}

// =========================================================================
// SPAWNING APPARATUS ON THE BENCH
// =========================================================================
function spawnTube(clientX, clientY) {
  const cRect = benchCanvas.getBoundingClientRect();
  const uid = nextUid++;
  const left = clientX !== undefined
    ? Math.max(20, Math.min(cRect.width - 100, clientX - cRect.left - 36))
    : 60 + ((benchTubes.length * 105) % Math.max(200, cRect.width - 160));
  const bottom = clientY !== undefined
    ? Math.max(24, Math.min(cRect.height - 220, cRect.bottom - clientY - 100))
    : 24;

  const el = document.createElement("div");
  el.className = "tube-anchor";
  el.style.left = `${left}px`;
  el.style.bottom = `${bottom}px`;
  el.innerHTML = `
    <button class="apparatus-wash" type="button" title="Wash Test Tube">🚰</button>
    <button class="apparatus-close" type="button" title="Remove Test Tube">×</button>
    <div class="pour-dropper hidden">
      <div class="pd-bulb"></div>
      <div class="pd-stem"></div>
      <div class="pd-drop"></div>
    </div>
    <div class="mouth-rod hidden">
      <div class="mr-stick"></div>
      <div class="mr-fumes hidden"></div>
    </div>
    <div class="mouth-smell hidden">〰️ 👃 〰️</div>
    <div class="tube-steam hidden"><span></span><span></span></div>
    <div class="h2s-pipe hidden"></div>
    <canvas class="tube-fx-canvas" width="288" height="580"></canvas>
    <div class="test-tube">
      <div class="tube-vapours"></div>
      <div class="tube-paper-ball hidden"></div>
      <div class="tube-top-layer hidden"></div>
      <div class="tube-brown-ring hidden"></div>
      <div class="tube-liquid">
        <div class="tube-bubbles hidden"><span></span><span></span><span></span><span></span><span></span></div>
        <div class="tube-spangles hidden"></div>
      </div>
      <div class="tube-ppt hidden"></div>
    </div>
    <div class="lime-setup hidden">
      <div class="lime-cork"></div>
      <div class="lime-pipe"></div>
      <div class="lime-beaker"><div class="lime-liquid"></div></div>
    </div>
    <div class="tube-temp-tag hidden"></div>
  `;

  benchCanvas.appendChild(el);

  const tubeObj = {
    uid,
    el,
    canvas: el.querySelector(".tube-fx-canvas"),
    fx: createTubeFX(),
    state: {
      hasDrySalt: false, hasSolution: false, reagents: [], temp: 25,
      wasBoiled: false, wasCooledAfterBoil: false, hasPaperBall: false,
      heldRod: null, hasLimeWater: false, passedH2S: false, smelled: false, volume: 0,
      evaporatedDry: false, lastThermalEvent: null
    }
  };
  benchTubes.push(tubeObj);
  setActiveTube(uid);

  el.querySelector(".apparatus-wash").addEventListener("click", (e) => {
    e.stopPropagation();
    washSingleTube(tubeObj);
  });

  el.querySelector(".apparatus-close").addEventListener("click", (e) => {
    e.stopPropagation();
    el.remove();
    benchTubes = benchTubes.filter((t) => t.uid !== uid);
    if (activeTubeUid === uid) activeTubeUid = benchTubes.length ? benchTubes[benchTubes.length - 1].uid : null;
  });

  makeTubeDraggable(tubeObj);
  return tubeObj;
}

function washSingleTube(tubeObj) {
  const tt = tubeObj.el.querySelector(".test-tube");
  const rinse = document.createElement("div");
  rinse.className = "tube-rinse";
  tt.appendChild(rinse);
  setTimeout(() => rinse.remove(), 660);

  tubeObj.state = {
    hasDrySalt: false, hasSolution: false, reagents: [], temp: 25,
    wasBoiled: false, wasCooledAfterBoil: false, hasPaperBall: false,
    heldRod: null, hasLimeWater: false, passedH2S: false, smelled: false, volume: 0,
    evaporatedDry: false, lastThermalEvent: null
  };
  tubeObj.fx = createTubeFX();
  evaluateTube(tubeObj, true);
  showObs("🚰 Test tube rinsed and clean!");
}

function spawnBurner(clientX, clientY) {
  const cRect = benchCanvas.getBoundingClientRect();
  const uid = nextUid++;
  const left = clientX !== undefined
    ? Math.max(40, Math.min(cRect.width - 80, clientX - cRect.left))
    : Math.round(cRect.width * 0.5);

  const el = document.createElement("div");
  el.className = "burner-anchor";
  el.style.left = `${left}px`;
  el.style.bottom = "22px";
  el.innerHTML = `
    <button class="apparatus-close" type="button" title="Remove Burner">×</button>
    <div class="burner-tool hidden">
      <div class="bt-wire"></div>
      <div class="bt-tip-loop"></div>
    </div>
    <div class="burner-flame">
      <div class="flame-outer"></div>
      <div class="flame-inner"></div>
    </div>
    <canvas class="burner-fx-canvas" width="240" height="260"></canvas>
    <div class="burner-tube"></div>
    <button class="burner-collar on" type="button" title="Toggle Flame"></button>
    <div class="burner-base"></div>
  `;

  benchCanvas.appendChild(el);
  const bObj = {
    uid, el, on: true,
    canvas: el.querySelector(".burner-fx-canvas"),
    fx: { outer: "rgba(14, 165, 233, 0.82)", inner: "rgba(2, 132, 199, 0.95)", sparkColor: null, sparks: [] }
  };
  benchBurners.push(bObj);

  el.querySelector(".apparatus-close").addEventListener("click", (e) => {
    e.stopPropagation();
    el.remove();
    benchBurners = benchBurners.filter((b) => b.uid !== uid);
  });

  el.querySelector(".burner-collar").addEventListener("click", (e) => {
    e.stopPropagation();
    toggleBurnerObj(bObj);
  });

  makeSimpleDraggable(el);
  return bObj;
}

function spawnBath(clientX, clientY) {
  const cRect = benchCanvas.getBoundingClientRect();
  const uid = nextUid++;
  const left = clientX !== undefined
    ? Math.max(20, Math.min(cRect.width - 120, clientX - cRect.left - 52))
    : Math.round(cRect.width * 0.76);

  const el = document.createElement("div");
  el.className = "bath-anchor";
  el.style.left = `${left}px`;
  el.style.right = "auto";
  el.style.bottom = "22px";
  el.innerHTML = `
    <button class="apparatus-close" type="button" title="Remove Cold Bath">×</button>
    <div class="beaker">
      <div class="beaker-water">
        <span class="ice">🧊</span>
        <span class="ice i2">🧊</span>
      </div>
    </div>
  `;

  benchCanvas.appendChild(el);
  const bathObj = { uid, el };
  benchBaths.push(bathObj);

  el.querySelector(".apparatus-close").addEventListener("click", (e) => {
    e.stopPropagation();
    el.remove();
    benchBaths = benchBaths.filter((b) => b.uid !== uid);
  });

  makeSimpleDraggable(el);
  return bathObj;
}

function spawnWatchGlass(clientX, clientY) {
  const cRect = benchCanvas.getBoundingClientRect();
  const uid = nextUid++;
  const left = clientX !== undefined
    ? Math.max(20, Math.min(cRect.width - 130, clientX - cRect.left - 58))
    : Math.round(cRect.width * 0.25);

  const el = document.createElement("div");
  el.className = "watchglass-anchor";
  el.style.left = `${left}px`;
  el.style.bottom = "24px";
  el.innerHTML = `
    <button class="apparatus-wash" type="button" title="Wash Watch Glass">🚰</button>
    <button class="apparatus-close" type="button" title="Remove Watch Glass">×</button>
    <div class="watchglass-dish">
      <canvas class="wg-fx-canvas" width="248" height="128"></canvas>
    </div>
  `;

  benchCanvas.appendChild(el);
  const wgObj = {
    uid,
    el,
    canvas: el.querySelector(".wg-fx-canvas"),
    fx: createWatchGlassFX(false),
    state: { hasDrySalt: false, reagents: [], bubbles: false, liquidColor: null, pptColor: null, dippedTool: null, vapour: false }
  };
  benchWatchGlasses.push(wgObj);

  el.querySelector(".apparatus-wash").addEventListener("click", (e) => {
    e.stopPropagation();
    wgObj.state = { hasDrySalt: false, reagents: [], bubbles: false, liquidColor: null, pptColor: null, dippedTool: null, vapour: false };
    wgObj.fx = createWatchGlassFX(true);
    showObs("🚰 Watch glass rinsed and clean!");
  });

  el.querySelector(".apparatus-close").addEventListener("click", (e) => {
    e.stopPropagation();
    el.remove();
    benchWatchGlasses = benchWatchGlasses.filter((w) => w.uid !== uid);
  });

  makeSimpleDraggable(el);
  return wgObj;
}

function spawnRod(clientX, clientY) {
  const cRect = benchCanvas.getBoundingClientRect();
  const uid = nextUid++;
  const left = clientX !== undefined
    ? Math.max(20, Math.min(cRect.width - 140, clientX - cRect.left - 60))
    : Math.round(cRect.width * 0.36);
  const bottom = clientY !== undefined
    ? Math.max(40, Math.min(cRect.height - 90, cRect.bottom - clientY - 15))
    : 135;

  const el = document.createElement("div");
  el.className = "rod-anchor";
  el.style.left = `${left}px`;
  el.style.bottom = `${bottom}px`;
  el.innerHTML = `
    <button class="apparatus-close" type="button" title="Remove Glass Rod">×</button>
    <div class="glass-rod-body">
      <div class="rod-tip-drop hidden"></div>
      <span class="rod-tag">Glass Rod</span>
    </div>
  `;

  benchCanvas.appendChild(el);
  const rodObj = { uid, el, reagent: null, attachedTubeUid: null };
  benchRods.push(rodObj);

  el.querySelector(".apparatus-close").addEventListener("click", (e) => {
    e.stopPropagation();
    if (rodObj.attachedTubeUid) {
      const t = benchTubes.find((x) => x.uid === rodObj.attachedTubeUid);
      if (t) { t.state.heldRod = null; evaluateTube(t, true); }
    }
    el.remove();
    benchRods = benchRods.filter((r) => r.uid !== uid);
  });

  makeRodDraggable(rodObj);
  return rodObj;
}

function makeRodDraggable(rodObj) {
  const el = rodObj.el;
  let drag = null;
  el.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    e.preventDefault();
    const cRect = benchCanvas.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    drag = {
      sx: e.clientX, sy: e.clientY,
      startLeft: r.left - cRect.left,
      startBottom: cRect.bottom - r.bottom,
      moved: false
    };
    el.setPointerCapture(e.pointerId);
  });

  el.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) > 4) drag.moved = true;
    if (drag.moved) {
      const cRect = benchCanvas.getBoundingClientRect();
      el.style.left = `${Math.max(10, Math.min(cRect.width - 120, drag.startLeft + dx))}px`;
      el.style.bottom = `${Math.max(22, Math.min(cRect.height - 60, drag.startBottom - dy))}px`;
      clearAllGlows();
      const tipR = el.querySelector(".rod-tip-drop").getBoundingClientRect();
      const t = findHitTube(tipR.left, tipR.top) || findHitTube(e.clientX, e.clientY);
      const wg = findHitWatchGlass(tipR.left, tipR.top) || findHitWatchGlass(e.clientX, e.clientY);
      const b = findHitBurner(tipR.left, tipR.top) || findHitBurner(e.clientX, e.clientY);
      if (t) t.el.classList.add("drop-glow");
      else if (wg) wg.el.classList.add("drop-glow");
      else if (b) b.el.classList.add("drop-glow");
    }
  });

  el.addEventListener("pointerup", (e) => {
    if (!drag) return;
    clearAllGlows();
    const tipR = el.querySelector(".rod-tip-drop").getBoundingClientRect();
    const t = findHitTube(tipR.left, tipR.top) || findHitTube(e.clientX, e.clientY);
    const wg = findHitWatchGlass(tipR.left, tipR.top) || findHitWatchGlass(e.clientX, e.clientY);
    const b = findHitBurner(tipR.left, tipR.top) || findHitBurner(e.clientX, e.clientY);

    if (rodObj.attachedTubeUid && (!t || t.uid !== rodObj.attachedTubeUid)) {
      const oldT = benchTubes.find((x) => x.uid === rodObj.attachedTubeUid);
      if (oldT) { oldT.state.heldRod = null; evaluateTube(oldT, true); }
      rodObj.attachedTubeUid = null;
    }

    if (t) {
      if (rodObj.reagent === "nh4oh" || rodObj.reagent === "conc_hcl") {
        t.state.heldRod = rodObj.reagent === "nh4oh" ? "rod_nh4oh" : "rod_hcl";
        rodObj.attachedTubeUid = t.uid;
        evaluateTube(t);
      } else {
        shakeTubeEl(t.el.querySelector(".test-tube"));
        if (t.state.hasDrySalt || t.state.hasSolution || t.state.reagents.length > 0) {
          rodObj.reagent = "salt";
          updateRodDOM(rodObj);
          showObs("🥢 <strong>Glass rod stirred solution</strong> — dipped with sample (bring to Burner for Flame Test, or dip in NH₄OH/conc. HCl).");
        } else {
          showObs("🥢 Stirred empty test tube.");
        }
      }
    } else if (wg) {
      if (wg.state.hasDrySalt || wg.state.reagents.length > 0) {
        rodObj.reagent = "salt";
        updateRodDOM(rodObj);
        showObs("🥢 <strong>Mixed paste on Watch Glass</strong> — glass rod coated with salt (bring to Burner for Flame Test!).");
      } else {
        showObs("🥢 Watch glass is empty — add Dry Salt + conc. HCl first.");
      }
    } else if (b && rodObj.reagent === "salt") {
      b.activeTool = "pt_wire";
      performBurnerAction("pt_wire", b, true);
    }
    drag = null;
  });
}

function updateRodDOM(rodObj) {
  const drop = rodObj.el.querySelector(".rod-tip-drop");
  const tag = rodObj.el.querySelector(".rod-tag");
  if (!rodObj.reagent) {
    drop.classList.add("hidden");
    tag.textContent = "Glass Rod";
  } else {
    drop.classList.remove("hidden");
    if (rodObj.reagent === "nh4oh") {
      tag.textContent = "NH₄OH Rod";
      drop.style.background = "radial-gradient(circle at 35% 35%, #ffffff, rgba(186, 230, 253, 0.95))";
    } else if (rodObj.reagent === "conc_hcl") {
      tag.textContent = "conc. HCl Rod";
      drop.style.background = "radial-gradient(circle at 35% 35%, #fef9c3, rgba(253, 224, 71, 0.9))";
    } else if (rodObj.reagent === "salt") {
      tag.textContent = "Salt Paste";
      drop.style.background = "radial-gradient(circle at 35% 35%, #ffffff, #cbd5e1)";
    }
  }
}

function setActiveTube(uid) {
  activeTubeUid = uid;
  benchTubes.forEach((t) => t.el.classList.toggle("active-tube", t.uid === uid));
}

function getActiveTube() {
  let t = benchTubes.find((x) => x.uid === activeTubeUid);
  if (!t && benchTubes.length > 0) t = benchTubes[benchTubes.length - 1];
  if (!t) t = spawnTube();
  return t;
}

// =========================================================================
// POINTER DRAG & DROP (SHELF + BENCH APPARATUS)
// =========================================================================
function overlaps(x, y, el, pad = 30) {
  const r = el.getBoundingClientRect();
  return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
}

function findHitTube(x, y) {
  for (let i = benchTubes.length - 1; i >= 0; i--) {
    if (overlaps(x, y, benchTubes[i].el, 35)) return benchTubes[i];
  }
  return null;
}

function findHitBurner(x, y) {
  for (let i = benchBurners.length - 1; i >= 0; i--) {
    if (overlaps(x, y, benchBurners[i].el, 40)) return benchBurners[i];
  }
  return null;
}

function findHitBath(x, y) {
  for (let i = benchBaths.length - 1; i >= 0; i--) {
    if (overlaps(x, y, benchBaths[i].el, 35)) return benchBaths[i];
  }
  return null;
}

function findHitWatchGlass(x, y) {
  for (let i = benchWatchGlasses.length - 1; i >= 0; i--) {
    if (overlaps(x, y, benchWatchGlasses[i].el, 28)) return benchWatchGlasses[i];
  }
  return null;
}

function findHitRod(x, y) {
  for (let i = benchRods.length - 1; i >= 0; i--) {
    if (overlaps(x, y, benchRods[i].el, 25)) return benchRods[i];
  }
  return null;
}

function clearAllGlows() {
  benchTubes.forEach((t) => t.el.classList.remove("drop-glow"));
  benchBurners.forEach((b) => b.el.classList.remove("drop-glow"));
  benchBaths.forEach((b) => b.el.classList.remove("drop-glow"));
  benchWatchGlasses.forEach((w) => w.el.classList.remove("drop-glow"));
  benchRods.forEach((r) => r.el.classList.remove("drop-glow"));
}

function setupShelfDrag() {
  let drag = null;

  document.querySelectorAll(".item").forEach((el) => {
    el.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse") e.preventDefault();
      drag = {
        id: el.dataset.id,
        kind: el.dataset.kind || "reagent",
        color: el.dataset.color || "#0284c7",
        target: el.dataset.target || "tube",
        sx: e.clientX,
        sy: e.clientY,
        moved: false,
        el
      };
      if (e.pointerType === "mouse" || window.innerWidth > 820) {
        el.setPointerCapture(e.pointerId);
      }
    });

    el.addEventListener("pointermove", (e) => {
      if (!drag || drag.el !== el) return;
      const dx = e.clientX - drag.sx;
      const dy = e.clientY - drag.sy;
      if (!drag.moved && window.innerWidth <= 820 && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
        drag = null;
        return;
      }
      if (!drag.moved && Math.hypot(dx, dy) > 6) {
        drag.moved = true;
        try { el.setPointerCapture(e.pointerId); } catch (_) {}
        dragGhost.innerHTML = el.innerHTML;
        dragGhost.classList.remove("hidden");
      }
      if (drag.moved) {
        dragGhost.style.left = `${e.clientX}px`;
        dragGhost.style.top = `${e.clientY}px`;
        clearAllGlows();
        if (drag.kind !== "apparatus") {
          if (drag.target === "burner") {
            const b = findHitBurner(e.clientX, e.clientY);
            const wg = findHitWatchGlass(e.clientX, e.clientY);
            const t = findHitTube(e.clientX, e.clientY);
            if (b) b.el.classList.add("drop-glow");
            else if (wg) wg.el.classList.add("drop-glow");
            else if (t) t.el.classList.add("drop-glow");
          } else {
            const wg = findHitWatchGlass(e.clientX, e.clientY);
            const r = (drag.id === "nh4oh" || drag.id === "conc_hcl") ? findHitRod(e.clientX, e.clientY) : null;
            const t = findHitTube(e.clientX, e.clientY);
            if (r) r.el.classList.add("drop-glow");
            else if (wg) wg.el.classList.add("drop-glow");
            else if (t) t.el.classList.add("drop-glow");
          }
        }
      }
    });

    el.addEventListener("pointerup", (e) => {
      if (!drag || drag.el !== el) return;
      const onCanvas = overlaps(e.clientX, e.clientY, benchCanvas, 0);
      const click = !drag.moved;
      dragGhost.classList.add("hidden");
      clearAllGlows();

      if (drag.kind === "apparatus") {
        if (click || onCanvas) {
          const cx = click ? undefined : e.clientX;
          const cy = click ? undefined : e.clientY;
          if (drag.id === "spawn_tube") spawnTube(cx, cy);
          else if (drag.id === "spawn_burner") spawnBurner(cx, cy);
          else if (drag.id === "spawn_bath") spawnBath(cx, cy);
          else if (drag.id === "spawn_watchglass") spawnWatchGlass(cx, cy);
          else if (drag.id === "spawn_rod") spawnRod(cx, cy);
        }
      } else if (click || onCanvas) {
        if (drag.target === "burner") {
          const bHit = findHitBurner(e.clientX, e.clientY);
          const wgHit = !click ? findHitWatchGlass(e.clientX, e.clientY) : null;
          const tHit = !click ? findHitTube(e.clientX, e.clientY) : null;
          if (wgHit && !bHit) {
            performWatchGlassAction(wgHit, drag.id, drag.color);
          } else if (tHit && !bHit) {
            setActiveTube(tHit.uid);
            performTubeAction(tHit, drag.id, drag.color);
          } else {
            const b = bHit || benchBurners[0] || spawnBurner();
            performBurnerAction(drag.id, b);
          }
        } else {
          const rHit = (!click && (drag.id === "nh4oh" || drag.id === "conc_hcl")) ? findHitRod(e.clientX, e.clientY) : null;
          const wgHit = !click ? findHitWatchGlass(e.clientX, e.clientY) : null;
          if (rHit) {
            rHit.reagent = drag.id;
            updateRodDOM(rHit);
            showObs(`🥢 <strong>Glass rod dipped in ${drag.id === "nh4oh" ? "NH₄OH" : "conc. HCl"}</strong> → Hold it over a Test Tube mouth!`);
          } else if (wgHit) {
            performWatchGlassAction(wgHit, drag.id, drag.color);
          } else {
            const t = findHitTube(e.clientX, e.clientY) || getActiveTube();
            setActiveTube(t.uid);
            performTubeAction(t, drag.id, drag.color);
          }
        }
      }
      drag = null;
    });
  });
}

function makeTubeDraggable(tubeObj) {
  const testTubeEl = tubeObj.el.querySelector(".test-tube");
  let drag = null;

  testTubeEl.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    setActiveTube(tubeObj.uid);
    const cRect = benchCanvas.getBoundingClientRect();
    const tRect = tubeObj.el.getBoundingClientRect();
    drag = {
      sx: e.clientX, sy: e.clientY,
      startLeft: tRect.left - cRect.left,
      startBottom: cRect.bottom - tRect.bottom,
      moved: false
    };
    testTubeEl.setPointerCapture(e.pointerId);
  });

  testTubeEl.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) > 5) drag.moved = true;
    if (drag.moved) {
      const cRect = benchCanvas.getBoundingClientRect();
      tubeObj.el.style.left = `${Math.max(10, Math.min(cRect.width - 90, drag.startLeft + dx))}px`;
      tubeObj.el.style.bottom = `${Math.max(22, Math.min(cRect.height - 220, drag.startBottom - dy))}px`;

      clearAllGlows();
      const b = findHitBurner(e.clientX, e.clientY);
      const bath = findHitBath(e.clientX, e.clientY);
      if (b) b.el.classList.add("drop-glow");
      else if (bath) bath.el.classList.add("drop-glow");
    }
  });

  testTubeEl.addEventListener("pointerup", (e) => {
    if (!drag) return;
    const click = !drag.moved;
    clearAllGlows();
    if (click) {
      shakeTubeEl(testTubeEl);
    } else {
      const b = findHitBurner(e.clientX, e.clientY);
      const bath = findHitBath(e.clientX, e.clientY);
      if (b) {
        if (!b.on) toggleBurnerObj(b);
        if (tubeObj.state.dippedTool) {
          performBurnerAction(tubeObj.state.dippedTool, b);
          tubeObj.state.dippedTool = null;
        }
        performTubeAction(tubeObj, "heat");
      } else if (bath) {
        performTubeAction(tubeObj, "cool");
      }
    }
    drag = null;
  });
}

function makeSimpleDraggable(el) {
  let drag = null;
  el.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    e.preventDefault();
    const cRect = benchCanvas.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    drag = {
      sx: e.clientX, sy: e.clientY,
      startLeft: r.left - cRect.left + (el.classList.contains("burner-anchor") ? r.width / 2 : 0),
      startBottom: cRect.bottom - r.bottom,
      moved: false
    };
    el.setPointerCapture(e.pointerId);
  });

  el.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) > 5) drag.moved = true;
    if (drag.moved) {
      const cRect = benchCanvas.getBoundingClientRect();
      el.style.left = `${Math.max(20, Math.min(cRect.width - 40, drag.startLeft + dx))}px`;
      el.style.bottom = `${Math.max(22, Math.min(cRect.height - 160, drag.startBottom - dy))}px`;
    }
  });

  el.addEventListener("pointerup", () => {
    if (drag && drag.moved && el.classList.contains("burner-anchor")) {
      const bObj = benchBurners.find((b) => b.el === el);
      if (bObj && bObj.activeTool) performBurnerAction(bObj.activeTool, bObj);
    }
    drag = null;
  });
}

// =========================================================================
// MYSTERY MODE
// =========================================================================
function startMystery() {
  const pool = SALTS.filter((s) => s.id !== currentSalt.id);
  currentSalt = pool[Math.floor(Math.random() * pool.length)];
  document.getElementById("guessAnion").value = "";
  document.getElementById("guessCation").value = "";
  document.getElementById("mysteryFeedback").textContent = "";
  clearBench(true);
  renderRecordBook();
}

function verifyMystery() {
  const ga = document.getElementById("guessAnion").value;
  const gc = document.getElementById("guessCation").value;
  const fb = document.getElementById("mysteryFeedback");
  if (!ga || !gc) {
    fb.style.color = "#dc2626";
    fb.textContent = "Select Anion & Cation";
    return;
  }
  if (ga === currentSalt.anion && gc === currentSalt.cation) {
    fb.style.color = "#16a34a";
    fb.textContent = `🎉 Correct! ${currentSalt.name} (${currentSalt.formula})`;
  } else {
    fb.style.color = "#dc2626";
    fb.textContent = `${ga === currentSalt.anion ? "Anion ✅" : "Anion ❌"} | ${gc === currentSalt.cation ? "Cation ✅" : "Cation ❌"}`;
  }
}

// =========================================================================
// CHEMICAL ACTIONS PER TUBE & BURNER
// =========================================================================
function toggleBurnerObj(bObj) {
  bObj.on = !bObj.on;
  bObj.el.querySelector(".burner-flame").classList.toggle("hidden", !bObj.on);
  const sw = bObj.el.querySelector(".burner-collar");
  sw.className = "burner-collar " + (bObj.on ? "on" : "off");
  if (!bObj.on) {
    bObj.activeTool = null;
    bObj.el.querySelector(".burner-tool").classList.add("hidden");
    bObj.el.querySelector(".flame-outer").style.background = "";
    bObj.fx.outer = "rgba(14, 165, 233, 0.82)";
    bObj.fx.inner = "rgba(2, 132, 199, 0.95)";
    bObj.fx.sparkColor = null;
  }
}

function findLoadedTubeForBurner(id, bObj) {
  const dippedTube = benchTubes.find((t) => t.state.dippedTool === id);
  if (dippedTube) return dippedTube;
  const dippedWg = benchWatchGlasses.find((w) => w.state.dippedTool === id);
  if (dippedWg) return dippedWg;
  const br = bObj.el.getBoundingClientRect();
  const bx = br.left + br.width / 2;
  const by = br.top + br.height / 2;
  const nearTube = benchTubes.find((t) => {
    const st = t.state;
    if (!st.hasDrySalt && !st.hasSolution && st.reagents.length === 0) return false;
    const tr = t.el.querySelector(".test-tube").getBoundingClientRect();
    const tx = tr.left + tr.width / 2;
    const ty = tr.top + tr.height / 2;
    return Math.hypot(tx - bx, ty - by) < 120;
  });
  if (nearTube) return nearTube;
  return benchWatchGlasses.find((w) => {
    const st = w.state;
    if (!st.hasDrySalt && st.reagents.length === 0) return false;
    const wr = w.el.getBoundingClientRect();
    return Math.hypot(wr.left + wr.width / 2 - bx, wr.top + wr.height / 2 - by) < 120;
  });
}

function performWatchGlassAction(wgObj, id, dropColor) {
  const s = currentSalt;
  const st = wgObj.state;
  const fx = wgObj.fx;
  if (id === "pt_wire" || id === "ash_paper") {
    if (!st.hasDrySalt && st.reagents.length === 0) {
      showObs("⚠️ <strong>Watch glass is empty</strong> — add Dry Salt + conc. HCl first!");
      return;
    }
    st.dippedTool = id;
    if (fx) fx.ripples.push({ x: 62, y: 49, rx: 4, ry: 1.5, alpha: 0.8, color: { r: 2, g: 132, b: 199 } });
    showObs(id === "pt_wire"
      ? "🔥 <strong>Flame wire dipped in watch glass paste</strong> → Drag Flame Wire onto the Bunsen Burner!"
      : "📄 <strong>Ash paper soaked on watch glass</strong> → Drag Ash Paper onto the Bunsen Burner!");
    return;
  }
  if (id === "dry_salt") {
    st.hasDrySalt = true;
    if (fx) {
      const col = s.cation === "Cu" ? { r: 56, g: 189, b: 248 } : { r: 248, g: 250, b: 252 };
      for (let i = 0; i < 14; i++) {
        fx.drops.push({ x: 50 + Math.random() * 24, y: 4 + Math.random() * 14, vy: 1.8 + Math.random() * 1.4, r: 1.8, color: col, isGrain: true });
      }
    }
    showObs("🧂 <strong>Dry salt placed on Watch Glass</strong> — add conc. HCl to make a paste for Flame Test!");
    return;
  }

  st.reagents.push(id);
  const dc = parseColor(dropColor || "#38bdf8");
  if (fx) {
    for (let i = 0; i < 3; i++) {
      fx.drops.push({ x: 62 + (Math.random() - 0.5) * 8, y: 4 - i * 10, vy: 2.2 + i * 0.3, r: 2.8, color: dc, isGrain: false });
    }
  }

  if (id === "conc_hcl" || id === "dil_hcl") {
    st.liquidColor = "rgba(186, 230, 253, 0.56)";
    if (s.anion === "CO3") {
      st.bubbles = true;
      showObs("🫧 <strong>Brisk CO₂ effervescence on Watch Glass!</strong> → Presence of CO₃²⁻.");
      addLog("Watch Glass + dil. HCl", "Brisk effervescence of CO₂", "Presence of CO₃²⁻");
    } else {
      showObs("🧪 <strong>Salt + conc. HCl paste prepared on Watch Glass</strong> → Dip Flame Wire (or Glass Rod) and hold in Bunsen flame!");
    }
  } else if (id === "dil_h2so4") {
    st.liquidColor = "rgba(186, 230, 253, 0.56)";
    if (s.anion === "CH3COO") {
      st.vapour = true;
      showObs("👃 <strong>Vinegar smell from Watch Glass!</strong> → Presence of CH₃COO⁻.");
      addLog("Watch Glass + dil. H₂SO₄", "Vinegar smell", "Presence of CH₃COO⁻");
    } else if (s.anion === "CO3") {
      st.bubbles = true;
      showObs("🫧 <strong>Effervescence on Watch Glass!</strong> → Presence of CO₃²⁻.");
    } else {
      showObs("💧 Reagent added to Watch Glass.");
    }
  } else if (id === "fecl3" && (s.anion === "CH3COO" || s.org === "OH")) {
    st.liquidColor = s.org === "OH" ? "rgba(124, 58, 237, 0.85)" : "rgba(153, 27, 27, 0.85)";
    showObs(s.org === "OH" ? "🟣 <strong>Violet colouration on Watch Glass!</strong> → Phenol" : "🔴 <strong>Reddish brown colouration on Watch Glass!</strong> → Acetate");
  } else if (id === "ki" && s.cation === "Pb") {
    st.liquidColor = "rgba(253, 224, 71, 0.45)";
    st.pptColor = "#eab308";
    showObs("🟡 <strong>Golden yellow PbI₂ precipitate on Watch Glass!</strong> → Presence of Pb²⁺.");
  } else if (id === "k2cro4" && (s.cation === "Pb" || s.cation === "Ba")) {
    st.liquidColor = "rgba(250, 204, 21, 0.55)";
    st.pptColor = "#facc15";
    showObs("🟡 <strong>Yellow chromate precipitate on Watch Glass!</strong>");
  } else {
    st.liquidColor = "rgba(186, 230, 253, 0.5)";
    showObs("🧪 Added reagent to Watch Glass.");
  }
}

function performBurnerAction(id, bObj, forceLoaded = false) {
  if (!bObj.on) toggleBurnerObj(bObj);
  bObj.activeTool = id;
  const tool = bObj.el.querySelector(".burner-tool");
  const tip = bObj.el.querySelector(".bt-tip-loop, .bt-tip-paper");
  const flame = bObj.el.querySelector(".flame-outer");
  tool.classList.remove("hidden");
  tip.style.boxShadow = "";

  const sourceTube = forceLoaded ? { state: {} } : findLoadedTubeForBurner(id, bObj);
  if (!sourceTube) {
    if (id === "pt_wire") {
      tip.className = "bt-tip-loop";
      tip.style.background = "";
      bObj.fx.outer = "rgba(14, 165, 233, 0.82)";
      bObj.fx.inner = "rgba(2, 132, 199, 0.95)";
      bObj.fx.sparkColor = null;
      showObs("🔥 <strong>Clean platinum wire</strong> (no salt on loop) — dip Flame Wire in a Test Tube with salt, or place the burner near the tube!");
    } else if (id === "ash_paper") {
      tip.className = "bt-tip-paper";
      tip.style.background = "#475569";
      bObj.fx.outer = "rgba(245, 158, 11, 0.92)";
      bObj.fx.inner = "rgba(234, 88, 12, 0.95)";
      bObj.fx.sparkColor = "#fdba74";
      showObs("📄 <strong>Plain filter paper burned</strong> (no salt on paper) — soak Ash Paper in a Test Tube with salt, or place the burner near the tube!");
    }
    return;
  }

  const s = currentSalt;
  if (id === "pt_wire") {
    sourceTube.state.dippedTool = null;
    tip.className = "bt-tip-loop";
    tip.style.background = "";
    if (s.cation === "Ba") {
      bObj.fx.outer = "rgba(34, 197, 94, 0.92)"; bObj.fx.inner = "rgba(22, 163, 74, 0.95)"; bObj.fx.sparkColor = "#86efac";
      flame.style.background = "radial-gradient(ellipse at 50% 80%, #22c55e 0%, #16a34a 60%, transparent 100%)";
      showObs("🟢 <strong>Grassy green flame</strong> → Presence of Ba²⁺ confirmed.");
      addLog("Flame Test", "Grassy green colouration", "Ba²⁺ confirmed");
    } else if (s.cation === "Ca") {
      bObj.fx.outer = "rgba(239, 68, 68, 0.94)"; bObj.fx.inner = "rgba(185, 28, 28, 0.95)"; bObj.fx.sparkColor = "#fca5a5";
      flame.style.background = "radial-gradient(ellipse at 50% 80%, #ef4444 0%, #b91c1c 60%, transparent 100%)";
      showObs("🔴 <strong>Brick red flame</strong> → Presence of Ca²⁺ confirmed.");
      addLog("Flame Test", "Brick red colouration", "Ca²⁺ confirmed");
    } else if (s.cation === "Cu") {
      bObj.fx.outer = "rgba(20, 184, 166, 0.94)"; bObj.fx.inner = "rgba(2, 132, 199, 0.95)"; bObj.fx.sparkColor = "#5eead4";
      flame.style.background = "radial-gradient(ellipse at 50% 80%, #14b8a6 0%, #0284c7 60%, transparent 100%)";
      showObs("🔵 <strong>Bluish-green flame</strong> → Presence of Cu²⁺ confirmed.");
      addLog("Flame Test", "Bluish-green flame", "Cu²⁺ confirmed");
    } else if (s.cation === "Pb") {
      bObj.fx.outer = "rgba(147, 197, 253, 0.9)"; bObj.fx.inner = "rgba(96, 165, 250, 0.95)"; bObj.fx.sparkColor = "#dbeafe";
      flame.style.background = "radial-gradient(ellipse at 50% 80%, #93c5fd 0%, #60a5fa 60%, transparent 100%)";
      showObs("🩵 <strong>Pale bluish-white flame</strong> → Presence of Pb²⁺ indicated.");
      addLog("Flame Test", "Pale bluish-white flame", "Pb²⁺ indicated");
    } else {
      bObj.fx.outer = "rgba(14, 165, 233, 0.82)"; bObj.fx.inner = "rgba(2, 132, 199, 0.95)"; bObj.fx.sparkColor = null;
      flame.style.background = "radial-gradient(ellipse at 50% 80%, rgba(14, 165, 233, 0.75) 0%, transparent 100%)";
      showObs("🕯️ No characteristic persistent flame colouration.");
      addLog("Flame Test", "No characteristic flame colour", "Absence of Ba²⁺, Ca²⁺, Cu²⁺");
    }
  } else if (id === "ash_paper") {
    sourceTube.state.dippedTool = null;
    tip.className = "bt-tip-paper";
    bObj.fx.outer = "rgba(245, 158, 11, 0.92)"; bObj.fx.inner = "rgba(234, 88, 12, 0.95)"; bObj.fx.sparkColor = "#fdba74";
    flame.style.background = "radial-gradient(ellipse at 50% 80%, #f59e0b 0%, #ea580c 60%, transparent 100%)";
    const exp = "Ash Test (conc. HNO₃ + Co(NO₃)₂)";
    if (s.cation === "Al") {
      tip.style.background = "#2563eb";
      tip.style.boxShadow = "0 0 10px rgba(37, 99, 235, 0.85)";
      showObs("🔵 <strong>Blue tinted ash</strong> → Presence of Aluminium (Al³⁺) confirmed.");
      addLog(exp, "Blue tinted ash", "Al³⁺ confirmed");
    } else if (s.cation === "Zn") {
      tip.style.background = "#16a34a";
      tip.style.boxShadow = "0 0 10px rgba(22, 163, 74, 0.85)";
      showObs("🟢 <strong>Green tinted ash</strong> → Presence of Zinc (Zn²⁺) confirmed.");
      addLog(exp, "Green tinted ash", "Zn²⁺ confirmed");
    } else if (s.cation === "Mg") {
      tip.style.background = "#ec4899";
      tip.style.boxShadow = "0 0 10px rgba(236, 72, 153, 0.85)";
      showObs("🌸 <strong>Pink tinted ash</strong> → Presence of Magnesium (Mg²⁺) confirmed.");
      addLog(exp, "Pink tinted ash", "Mg²⁺ confirmed");
    } else {
      tip.style.background = "#334155";
      showObs("📄 Charred grey/black ash — no characteristic tinted ash.");
      addLog(exp, "No characteristic tinted ash", "Al³⁺, Zn²⁺, Mg²⁺ absent");
    }
  }
}

function performTubeAction(tubeObj, id, dropColor) {
  const st = tubeObj.state;

  if (id === "dry_salt") {
    st.hasDrySalt = true;
    animateDropper(tubeObj, "#cbd5e1");
    evaluateTube(tubeObj);
    return;
  }
  if (id === "salt_sol") {
    st.hasSolution = true;
    st.volume = Math.max(st.volume, 28);
    animateDropper(tubeObj, "#38bdf8");
    evaluateTube(tubeObj);
    return;
  }
  if (id === "heat") {
    st.temp = Math.max(st.temp, 65);
    st.wasBoiled = true;
    st.wasCooledAfterBoil = false;
    shakeTubeEl(tubeObj.el.querySelector(".test-tube"));
    evaluateTube(tubeObj);
    return;
  }
  if (id === "cool") {
    st.temp = 15;
    if (st.wasBoiled) st.wasCooledAfterBoil = true;
    evaluateTube(tubeObj);
    return;
  }
  if (id === "paper_ball") { st.hasPaperBall = true; evaluateTube(tubeObj); return; }
  if (id === "rod_nh4oh" || id === "rod_hcl") { st.heldRod = id; evaluateTube(tubeObj); return; }
  if (id === "lime_water") { st.hasLimeWater = true; evaluateTube(tubeObj); return; }
  if (id === "h2s_gas") { st.passedH2S = true; evaluateTube(tubeObj); return; }
  if (id === "smell_waft") { st.smelled = true; evaluateTube(tubeObj); return; }
  if (id === "pt_wire" || id === "ash_paper") {
    if (!st.hasDrySalt && !st.hasSolution && st.reagents.length === 0) {
      showObs("⚠️ <strong>Test tube is empty</strong> — add Dry Salt or Salt Solution first before dipping!");
      return;
    }
    st.dippedTool = id;
    shakeTubeEl(tubeObj.el.querySelector(".test-tube"));
    showObs(id === "pt_wire"
      ? "🔥 <strong>Platinum wire dipped in salt</strong> → Drag Flame Wire (or this tube) onto the Bunsen Burner!"
      : "📄 <strong>Filter paper soaked in solution</strong> → Drag Ash Paper (or this tube) onto the Bunsen Burner to ignite!");
    return;
  }

  if (!st.hasDrySalt && !st.hasSolution) {
    if (id === "conc_h2so4" || id === "dil_h2so4") st.hasDrySalt = true;
    else { st.hasSolution = true; st.volume = 24; }
  }
  st.reagents.push(id);
  st.volume = Math.min(76, Math.max(32, st.volume + 11));
  animateDropper(tubeObj, dropColor || "#0284c7");
  evaluateTube(tubeObj);
}

function animateDropper(tubeObj, color) {
  const d = tubeObj.el.querySelector(".pour-dropper");
  tubeObj.el.querySelector(".pd-drop").style.background = color;
  d.classList.remove("hidden");
  clearTimeout(tubeObj._pdTimer);
  tubeObj._pdTimer = setTimeout(() => d.classList.add("hidden"), 700);
  if (tubeObj.fx) {
    const col = parseColor(color);
    for (let i = 0; i < 3; i++) {
      tubeObj.fx.drops.push({
        x: 72 + (Math.random() - 0.5) * 6,
        y: 44 - i * 16,
        vy: 3.2 + i * 0.4,
        color: col
      });
    }
    tubeObj.fx.waveAmp = Math.min(8, tubeObj.fx.waveAmp + 4.5);
  }
}

function shakeTubeEl(el) {
  el.classList.remove("shaking");
  void el.offsetWidth;
  el.classList.add("shaking");
  const anchor = el.closest(".tube-anchor");
  const tObj = benchTubes.find((t) => t.el === anchor);
  if (tObj && tObj.fx) {
    tObj.fx.waveAmp = Math.min(9, tObj.fx.waveAmp + 6);
    tObj.fx.ppts.forEach((p) => {
      p.vy -= Math.random() * 2.5 + 1.2;
      p.vx += (Math.random() - 0.5) * 2.2;
    });
  }
}

function isTubeOverBurner(tubeObj) {
  const tr = tubeObj.el.querySelector(".test-tube").getBoundingClientRect();
  const cx = tr.left + tr.width / 2;
  const by = tr.bottom;
  return benchBurners.find((b) => {
    if (!b.on) return false;
    const br = b.el.getBoundingClientRect();
    return cx >= br.left - 30 && cx <= br.right + 30 && by >= br.top - 25 && by <= br.bottom + 25;
  });
}

function isTubeOverBath(tubeObj) {
  const tr = tubeObj.el.querySelector(".test-tube").getBoundingClientRect();
  const cx = tr.left + tr.width / 2;
  const by = tr.bottom;
  return benchBaths.find((bath) => {
    const br = bath.el.getBoundingClientRect();
    return cx >= br.left - 20 && cx <= br.right + 20 && by >= br.top - 20 && by <= br.bottom + 20;
  });
}

function updateTubeThermalDOM(tubeObj) {
  const st = tubeObj.state;
  const tag = tubeObj.el.querySelector(".tube-temp-tag");
  if (!tag) return;
  const rounded = Math.round(st.temp);
  if (Math.abs(rounded - 25) <= 2) {
    tag.classList.add("hidden");
    tag.className = "tube-temp-tag hidden";
  } else if (rounded > 27) {
    tag.textContent = `🔥 ${rounded}°C`;
    tag.className = "tube-temp-tag hot";
  } else {
    tag.textContent = `❄️ ${rounded}°C`;
    tag.className = "tube-temp-tag cold";
  }
}

function runThermalPhysics() {
  benchTubes.forEach((tubeObj) => {
    const st = tubeObj.state;
    const overBurner = isTubeOverBurner(tubeObj);
    const overBath = isTubeOverBath(tubeObj);
    let changed = false;
    let shouldLog = false;

    if (overBurner) {
      const prevTemp = st.temp;
      st.temp = Math.min(130, st.temp + 8);
      if (st.temp !== prevTemp) changed = true;

      if (st.volume > 0) {
        if (st.temp >= 80 && !st.wasBoiled) {
          st.wasBoiled = true;
          st.wasCooledAfterBoil = false;
          changed = true;
          if (st.lastThermalEvent !== "boiled") {
            st.lastThermalEvent = "boiled";
            shouldLog = true;
          }
        }
        if (st.temp >= 90) {
          st.volume = Math.max(0, +(st.volume - 2.4).toFixed(1));
          changed = true;
          if (st.volume <= 0) {
            st.volume = 0;
            st.hasSolution = false;
            st.hasDrySalt = true;
            st.evaporatedDry = true;
            showObs("💨 <strong>Liquid evaporated to dryness</strong> → Solid residue remains at the bottom.");
            addLog("Evaporation on Bunsen burner", "Liquid boiled off completely", "Dry solid residue remains");
          }
        }
      } else if (st.hasDrySalt && prevTemp < 100 && st.temp >= 100) {
        shouldLog = true;
      }
    } else if (overBath) {
      const prevTemp = st.temp;
      st.temp = Math.max(15, st.temp - 14);
      if (st.temp !== prevTemp) changed = true;
      if (st.wasBoiled && st.temp <= 30 && !st.wasCooledAfterBoil) {
        st.wasCooledAfterBoil = true;
        changed = true;
        shouldLog = true;
      }
    } else if (Math.abs(st.temp - 25) > 0.5) {
      st.temp = st.temp > 25 ? Math.max(25, st.temp - 1.5) : Math.min(25, st.temp + 1);
      changed = true;
    }

    if (changed) {
      evaluateTube(tubeObj, !shouldLog);
    }
  });
}

function evaluateOrganicTube(s, st, rSet) {
  let liquidColor = "rgba(186, 230, 253, 0.42)";
  let pptColor = null, pptStyle = "", bubbles = false, silverMirror = false, smell = st.smelled;
  let exp = null, obs = null, inf = null;
  const g = s.org;

  if (st.smelled && st.reagents.length === 0) {
    if (g === "OH") { exp = "Smell of substance"; obs = "Carbolic smell."; inf = "Phenols have carbolic smell"; }
    else if (g === "NH2") { exp = "Smell of substance"; obs = "Fishy, ammoniacal smell."; inf = "Amines have fishy, ammoniacal smell"; }
    else if (g === "COOH") { exp = "Smell of substance"; obs = "Mild pungent/vinegar-like smell."; inf = "Carboxylic acid indicated"; }
    else { exp = "Smell of substance"; obs = "Characteristic organic odour."; inf = "Check functional group tests"; }
  }

  if (rSet.has("nahco3")) {
    if (g === "COOH") {
      bubbles = true;
      exp = "Substance + sat. NaHCO₃"; obs = "Substance dissolves with brisk effervescence of CO₂."; inf = "Presence of carboxylic acid (-COOH)";
    } else {
      exp = "Substance + sat. NaHCO₃"; obs = "No characteristic reaction (no effervescence)."; inf = "Absence of carboxylic acid";
    }
  }

  if (rSet.has("ethanol") || (rSet.has("conc_h2so4") && g === "COOH")) {
    if (rSet.has("ethanol") && rSet.has("conc_h2so4")) {
      if (g === "COOH" && (st.wasBoiled || st.temp > 50)) {
        smell = true;
        exp = "Esterification (Ethanol + conc. H₂SO₄ + warm)"; obs = "Pleasant fruity smell of ester!"; inf = "Presence of carboxylic acid confirmed";
      } else if (g === "COOH") {
        exp = "Substance + Ethanol + conc. H₂SO₄"; obs = "Warm on burner & pour into cold water for fruity ester smell."; inf = "Ready to warm for Esterification";
      } else {
        exp = "Esterification Test"; obs = "No pleasant fruity smell."; inf = "Absence of carboxylic acid";
      }
    } else if (rSet.has("ethanol")) {
      exp = "Substance + Ethyl alcohol"; obs = "Clear solution (add conc. H₂SO₄ & warm for Esterification)."; inf = "Ethanol added";
    }
  }

  if (rSet.has("naoh") && !rSet.has("nano2") && !rSet.has("beta_naphthol") && !rSet.has("dil_hcl")) {
    if (g === "COOH" || g === "OH") {
      exp = "Substance + NaOH soln"; obs = "Substance dissolves in NaOH (add dil./conc. HCl to reprecipitate)."; inf = "Presence of carboxylic acid or phenol";
    } else {
      pptColor = "#f8fafc";
      exp = "Substance + NaOH soln"; obs = "The substance is insoluble."; inf = "Absence of carboxylic acid or phenol";
    }
  }

  if ((rSet.has("dil_hcl") || rSet.has("conc_hcl")) && !rSet.has("nano2") && !rSet.has("beta_naphthol") && !rSet.has("aniline")) {
    if (rSet.has("naoh") && (g === "COOH" || g === "OH")) {
      pptColor = "#ffffff";
      exp = "NaOH soln + excess HCl"; obs = "Substance dissolves in NaOH and reappears on adding HCl."; inf = g === "COOH" ? "Carboxylic acid indicated" : "Phenol indicated";
    } else if (g === "NH2") {
      if (rSet.has("naoh")) {
        pptColor = "#fef9c3";
        exp = "dil. HCl + NaOH"; obs = "Dissolves in dil. HCl and gets reprecipitated on adding NaOH."; inf = "Presence of amine (-NH₂)";
      } else {
        pptColor = null;
        exp = "Substance + dil. HCl"; obs = "Substance dissolves in dil. HCl (add NaOH to regenerate amine)."; inf = "Presence of amine (-NH₂)";
      }
    } else {
      pptColor = "#f8fafc";
      exp = "Substance + dil. HCl"; obs = "The substance is insoluble."; inf = "Absence of amine";
    }
  }

  if (rSet.has("fecl3")) {
    if (g === "OH") {
      liquidColor = "rgba(124, 58, 237, 0.85)";
      exp = "Substance + neutral FeCl₃"; obs = "Formation of violet colouration (iron complex)."; inf = "Presence of phenol (Ar-OH)";
    } else {
      liquidColor = "rgba(250, 204, 21, 0.48)";
      exp = "Substance + neutral FeCl₃"; obs = "No violet colouration."; inf = "Absence of phenol";
    }
  }

  if (rSet.has("bromine_water")) {
    if (g === "OH") {
      pptColor = "#ffffff"; liquidColor = "rgba(254, 240, 138, 0.4)";
      exp = "Substance + Bromine water"; obs = "White precipitate formed (2,4,6-tribromophenol)."; inf = "Presence of phenol confirmed";
    } else {
      liquidColor = "rgba(234, 88, 12, 0.55)";
      exp = "Substance + Bromine water"; obs = "No white precipitate."; inf = "Absence of phenol";
    }
  }

  if (rSet.has("nano2") || rSet.has("aniline") || rSet.has("beta_naphthol")) {
    if (g === "OH" && rSet.has("nano2") && rSet.has("naoh")) {
      liquidColor = "rgba(220, 38, 38, 0.86)";
      exp = "Dye Test (Aniline + HCl + NaNO₂ + NaOH)"; obs = "A red coloured azo dye is formed."; inf = "Presence of phenol confirmed";
    } else if (g === "NH2" && rSet.has("nano2") && rSet.has("beta_naphthol")) {
      liquidColor = "rgba(220, 38, 38, 0.9)";
      exp = "Azo Dye Test (dil. HCl + NaNO₂ + β-naphthol)"; obs = "A bright red azo dye is formed."; inf = "Aromatic primary amine confirmed";
    } else if (rSet.has("nano2")) {
      liquidColor = "rgba(254, 249, 195, 0.55)";
      exp = "Diazotisation (dil. HCl + NaNO₂)"; obs = g === "NH2" ? "Diazonium salt formed (cool & add alkaline β-naphthol for red dye)." : "Cold diazonium mixture (add NaOH + phenol/aniline for dye test).";
      inf = "Intermediate diazonium step";
    } else {
      exp = "Dye Test reagent added"; obs = "Combine dil. HCl + NaNO₂ (cold) + β-naphthol/NaOH for azo dye."; inf = "Dye test in progress";
    }
  }

  if (rSet.has("chcl3") || rSet.has("alc_koh")) {
    if (rSet.has("chcl3") && rSet.has("alc_koh")) {
      if (g === "NH2") {
        smell = true;
        exp = "Carbylamine Test (CHCl₃ + alc. KOH + warm)"; obs = "Unpleasant foul smell of isocyanide obtained!"; inf = "Presence of amine confirmed";
      } else {
        exp = "Carbylamine Test"; obs = "No unpleasant foul smell."; inf = "Absence of primary amine";
      }
    } else {
      exp = rSet.has("chcl3") ? "Added CHCl₃" : "Added alc. KOH";
      obs = "Add both CHCl₃ and alc. KOH & warm for Carbylamine test."; inf = "Carbylamine test in progress";
    }
  }

  if (rSet.has("borsche")) {
    if (g === "CHO" || g === "CO") {
      pptColor = "#f97316"; liquidColor = "rgba(251, 146, 60, 0.48)";
      exp = "Substance + Borsche's reagent"; obs = "Formation of yellow/orange precipitate (2,4-DNP)."; inf = "Presence of aldehyde or ketone";
    } else {
      liquidColor = "rgba(251, 146, 60, 0.35)";
      exp = "Substance + Borsche's reagent"; obs = "No yellow/orange precipitate."; inf = "Absence of aldehyde & ketone";
    }
  }

  if (rSet.has("schiff")) {
    if (g === "CHO") {
      liquidColor = "rgba(236, 72, 153, 0.82)";
      exp = "Substance + Schiff's reagent"; obs = "Development of pink colour."; inf = "Presence of aldehyde (-CHO)";
    } else {
      exp = "Substance + Schiff's reagent"; obs = "No pink colour developed."; inf = g === "CO" ? "Ketone (absence of aldehyde)" : "Absence of aldehyde";
    }
  }

  if (rSet.has("tollens")) {
    if (g === "CHO") {
      if (st.wasBoiled || st.temp > 50) {
        silverMirror = true; pptColor = "#334155";
        exp = "Tollen's Test (warmed)"; obs = "Bright silver mirror on sides of test tube (metallic Ag)!"; inf = "Presence of aldehyde confirmed";
      } else {
        exp = "Substance + Tollen's reagent"; obs = "Warm gently on burner to develop silver mirror."; inf = "Ready to warm for Tollen's test";
      }
    } else {
      exp = "Tollen's Test (warmed)"; obs = "No precipitate or silver mirror."; inf = g === "CO" ? "Presence of ketone (>CO)" : "Absence of aldehyde";
    }
  }

  if (rSet.has("fehlings")) {
    liquidColor = "rgba(37, 99, 235, 0.82)";
    if (g === "CHO") {
      if (st.wasBoiled || st.temp > 50) {
        pptColor = "#dc2626"; liquidColor = "rgba(56, 189, 248, 0.35)";
        exp = "Fehling's Test (Fehling's A & B + warm)"; obs = "Brick-red precipitate (Cu₂O) formed!"; inf = "Presence of aldehyde confirmed";
      } else {
        exp = "Substance + Fehling's A & B"; obs = "Deep blue solution — warm on burner to test."; inf = "Ready to warm for Fehling's test";
      }
    } else {
      exp = "Fehling's Test (Fehling's A & B + warm)"; obs = "No red precipitate (remains blue)."; inf = g === "CO" ? "Presence of ketone confirmed" : "Absence of aldehyde";
    }
  }

  return { liquidColor, pptColor, pptStyle, bubbles, silverMirror, smell, exp, obs, inf };
}

function evaluateTube(tubeObj, isReset = false) {
  const s = currentSalt;
  const st = tubeObj.state;
  const rSet = new Set(st.reagents);
  const count = (id) => st.reagents.filter((x) => x === id).length;

  let liquidHeight = st.volume;
  let liquidColor = s.cation === "Cu" ? "rgba(56, 189, 248, 0.55)" : "rgba(186, 230, 253, 0.42)";
  let pptColor = st.hasDrySalt && st.reagents.length === 0 ? "#ffffff" : null;
  let pptStyle = "";
  let bubbles = false, spangles = false, brownRing = false, silverMirror = false, vapourBg = null, rodFumes = false, limeMilky = false, smell = st.smelled;
  let exp = null, obs = null, inf = null;

  if (s.kind === "organic") {
    const orgRes = evaluateOrganicTube(s, st, rSet);
    liquidColor = orgRes.liquidColor;
    pptColor = orgRes.pptColor;
    pptStyle = orgRes.pptStyle;
    bubbles = orgRes.bubbles;
    silverMirror = orgRes.silverMirror;
    smell = orgRes.smell;
    exp = orgRes.exp;
    obs = orgRes.obs;
    inf = orgRes.inf;
  } else {

  if (rSet.has("dil_hcl") && !rSet.has("bacl2") && !st.passedH2S) {
    if (s.anion === "CO3") {
      bubbles = true; pptColor = null;
      if (st.hasLimeWater) limeMilky = true;
      exp = "Salt + dil. HCl"; obs = "Brisk effervescence of colourless gas turning lime water milky."; inf = "Presence of CO₃²⁻";
    } else if (s.cation === "Pb") {
      if (st.temp > 60) {
        pptColor = null;
        exp = "Heated PbCl₂ + dil. HCl"; obs = "White precipitate dissolved in hot solution."; inf = "Pb²⁺ indicated";
      } else {
        pptColor = "#ffffff";
        exp = "Salt soln + dil. HCl"; obs = "White precipitate (PbCl₂)."; inf = "Presence of Group I (Pb²⁺)";
      }
    } else {
      exp = "Salt + dil. HCl"; obs = "No characteristic reaction."; inf = "Absence of CO₃²⁻ & Pb²⁺";
    }
  }

  if (rSet.has("bacl2")) {
    if (s.anion === "CO3") {
      if (rSet.has("dil_hcl")) {
        pptColor = null; bubbles = true;
        if (st.hasLimeWater) limeMilky = true;
        exp = "Salt soln + BaCl₂ + dil. HCl"; obs = "White ppt dissolves in dil. HCl with CO₂ effervescence."; inf = "Carbonate confirmed";
      } else {
        pptColor = "#ffffff"; exp = "Salt soln + BaCl₂"; obs = "White precipitate formed."; inf = "CO₃²⁻ or SO₄²⁻ indicated";
      }
    } else if (s.anion === "SO4") {
      pptColor = "#ffffff";
      exp = rSet.has("dil_hcl") ? "Salt soln + BaCl₂ + dil. HCl" : "Salt soln + BaCl₂";
      obs = rSet.has("dil_hcl") ? "White precipitate insoluble in dil. HCl." : "White precipitate formed.";
      inf = "Presence of SO₄²⁻";
    } else {
      exp = "Salt soln + BaCl₂"; obs = "No precipitate."; inf = "Absence of SO₄²⁻";
    }
  }

  if (rSet.has("dil_h2so4") && !rSet.has("bacl2")) {
    if (s.anion === "CH3COO") {
      smell = true;
      exp = "Salt + dil. H₂SO₄"; obs = "Vinegar smell."; inf = "Presence of CH₃COO⁻";
    } else if (s.anion === "CO3") {
      bubbles = true;
      if (st.hasLimeWater) limeMilky = true;
      exp = "Salt + dil. H₂SO₄"; obs = "Brisk effervescence of CO₂ gas."; inf = "Presence of CO₃²⁻";
    } else if (s.cation === "Ba" || s.cation === "Pb") {
      pptColor = "#ffffff";
      exp = "Salt soln + dil. H₂SO₄"; obs = "White insoluble sulphate precipitate formed.";
      inf = s.cation === "Ba" ? "Presence of Ba²⁺" : "Presence of Pb²⁺";
    } else {
      smell = true;
      exp = "Salt + dil. H₂SO₄"; obs = "No vinegar smell or precipitate."; inf = "Absence of CH₃COO⁻";
    }
  }

  if (rSet.has("fecl3")) {
    if (s.anion === "CH3COO") {
      liquidColor = "rgba(153, 27, 27, 0.85)";
      exp = "Salt soln + neutral FeCl₃"; obs = "Reddish brown colouration."; inf = "Acetate confirmed";
    } else {
      liquidColor = "rgba(250, 204, 21, 0.45)";
      exp = "Salt soln + neutral FeCl₃"; obs = "No reddish brown colouration."; inf = "Absence of acetate";
    }
  }

  if (rSet.has("conc_h2so4") && !rSet.has("feso4")) {
    if (s.anion === "Cl") {
      vapourBg = "linear-gradient(180deg, rgba(148,163,184,0.45) 0%, transparent 100%)";
      if (st.heldRod === "rod_nh4oh") {
        rodFumes = true;
        exp = "Salt + conc. H₂SO₄ + NH₄OH rod"; obs = "Dense white fumes with NH₄OH rod."; inf = "Presence of Cl⁻";
      } else {
        exp = "Salt + conc. H₂SO₄"; obs = "Colourless fuming gas evolved."; inf = "Cl⁻ indicated";
      }
    } else if (s.anion === "NO3" && (st.hasPaperBall || st.wasBoiled)) {
      liquidColor = "rgba(180, 83, 9, 0.45)";
      vapourBg = "linear-gradient(180deg, rgba(180, 83, 9, 0.85) 0%, rgba(154, 52, 18, 0.55) 70%, transparent 100%)";
      exp = "Paper ball test (conc. H₂SO₄ + heat)"; obs = "Reddish brown vapours (NO₂) evolved."; inf = "Presence of NO₃⁻";
    } else if (s.anion === "NO3") {
      vapourBg = "linear-gradient(180deg, rgba(180, 83, 9, 0.35) 0%, transparent 100%)";
      exp = "Salt + conc. H₂SO₄"; obs = "Light brown acid fumes (add paper ball & heat for dense NO₂)."; inf = "NO₃⁻ indicated";
    } else if (s.anion === "CO3") {
      bubbles = true;
      exp = "Salt + conc. H₂SO₄"; obs = "Brisk effervescence of CO₂ gas."; inf = "Presence of CO₃²⁻";
    } else if (s.anion === "CH3COO") {
      smell = true;
      exp = "Salt + conc. H₂SO₄"; obs = "Pungent vinegar-like smell of acetic acid."; inf = "Presence of CH₃COO⁻";
    } else {
      exp = "Salt + conc. H₂SO₄"; obs = "No characteristic reaction."; inf = "Absence of Cl⁻ & NO₃⁻";
    }
  }

  if (rSet.has("dil_hno3") && !rSet.has("agno3")) {
    if (s.anion === "CO3") {
      bubbles = true;
      if (st.hasLimeWater) limeMilky = true;
      exp = "Salt soln + dil. HNO₃"; obs = "Brisk effervescence of CO₂ gas."; inf = "Presence of CO₃²⁻";
    } else {
      exp = "Salt soln + dil. HNO₃"; obs = "Clear acidified solution (ready for AgNO₃ test)."; inf = "Medium acidified";
    }
  }

  if (rSet.has("agno3")) {
    if (s.anion === "Cl") {
      if (rSet.has("nh4oh")) {
        pptColor = null; exp = "AgCl ppt + NH₄OH"; obs = "White curdy ppt soluble in NH₄OH."; inf = "Chloride confirmed";
      } else {
        pptColor = "#ffffff"; pptStyle = "curdy";
        exp = rSet.has("dil_hno3") ? "Salt soln + dil. HNO₃ + AgNO₃" : "Salt soln + AgNO₃";
        obs = "White curdy precipitate formed."; inf = "Chloride confirmed";
      }
    } else if (s.anion === "CO3" && !rSet.has("dil_hno3")) {
      pptColor = "#fef08a";
      exp = "Salt soln + AgNO₃"; obs = "Pale yellow precipitate (Ag₂CO₃) formed."; inf = "CO₃²⁻ indicated (add dil. HNO₃)";
    } else {
      exp = "Salt soln + AgNO₃"; obs = "No white curdy precipitate."; inf = "Absence of Cl⁻";
    }
  }

  if (rSet.has("feso4")) {
    liquidColor = "rgba(134, 239, 172, 0.45)";
    if (rSet.has("conc_h2so4")) {
      if (s.anion === "NO3") {
        brownRing = true; exp = "Brown Ring Test"; obs = "Brown ring formed at the junction."; inf = "Nitrate confirmed";
      } else {
        exp = "Brown Ring Test"; obs = "No brown ring formed."; inf = "Absence of NO₃⁻";
      }
    } else {
      exp = "Salt soln + freshly prepared FeSO₄"; obs = "Pale green solution formed (add conc. H₂SO₄ for Brown Ring)."; inf = "Ready for Brown Ring test";
    }
  }

  if (rSet.has("ch3cooh") && !rSet.has("k2cro4") && !rSet.has("lead_acetate")) {
    if (s.anion === "CO3") {
      bubbles = true;
      exp = "Salt soln + CH₃COOH"; obs = "Effervescence of CO₂ gas."; inf = "CO₃²⁻ indicated";
    } else {
      exp = "Salt soln + CH₃COOH"; obs = "Clear acidified solution (add K₂CrO₄ or Lead Acetate)."; inf = "Acidified with acetic acid";
    }
  }

  if (rSet.has("lead_acetate")) {
    if (s.anion === "SO4") {
      if (rSet.has("amm_acetate")) {
        pptColor = null; exp = "PbSO₄ ppt + Amm. Acetate"; obs = "White ppt soluble in ammonium acetate."; inf = "Sulphate confirmed";
      } else {
        pptColor = "#ffffff"; exp = "Salt soln + Lead acetate"; obs = "White precipitate formed."; inf = "Sulphate confirmed";
      }
    } else if (s.anion === "Cl") {
      pptColor = "#ffffff";
      exp = "Salt soln + Lead acetate"; obs = "White precipitate (PbCl₂) formed."; inf = "Cl⁻ indicated";
    } else {
      exp = "Salt soln + Lead acetate"; obs = "No white precipitate."; inf = "Absence of SO₄²⁻";
    }
  }

  if (rSet.has("amm_acetate") && !rSet.has("lead_acetate")) {
    exp = "Salt soln + Ammonium acetate"; obs = "Clear solution."; inf = "Ammonium acetate added";
  }

  if (rSet.has("na2co3")) {
    pptColor = s.cGroup === 0 ? null : (s.cation === "Cu" ? "#38bdf8" : "#ffffff");
    exp = "Salt soln + Na₂CO₃";
    obs = s.cGroup === 0 ? "No precipitate." : "A precipitate is formed.";
    inf = s.cGroup === 0 ? "Presence of zero group (NH₄⁺)" : "Absence of zero group";
  }

  if (rSet.has("naoh") && s.cation === "NH4") {
    vapourBg = "linear-gradient(180deg, rgba(148,163,184,0.4) 0%, transparent 100%)";
    if (st.heldRod === "rod_hcl") {
      rodFumes = true; exp = "Salt + NaOH + heat + conc. HCl rod"; obs = "Dense white fumes with conc. HCl rod."; inf = "Presence of NH₄⁺";
    } else {
      exp = "Salt + NaOH + heat"; obs = "Colourless pungent NH₃ gas evolved."; inf = "NH₄⁺ indicated";
    }
  }

  if (rSet.has("nessler")) {
    if (s.cation === "NH4") {
      liquidColor = "rgba(180, 83, 9, 0.45)"; pptColor = "#7c2d12";
      exp = "Salt soln + Nessler's"; obs = "Reddish brown precipitate formed."; inf = "Ammonium confirmed";
    } else {
      exp = "Salt soln + Nessler's"; obs = "No reddish brown precipitate."; inf = "Absence of NH₄⁺";
    }
  }

  if (rSet.has("ki")) {
    if (s.cation === "Pb") {
      if (st.wasCooledAfterBoil) {
        pptColor = "#facc15"; spangles = true; liquidColor = "rgba(253, 224, 71, 0.35)";
        exp = "PbI₂ cooled in cold water"; obs = "Crystallised as golden spangles on cooling!"; inf = "Pb²⁺ confirmed";
      } else if (st.temp > 50) {
        pptColor = null; liquidColor = "rgba(253, 224, 71, 0.45)";
        exp = "Heated PbI₂ ppt"; obs = "Golden yellow ppt dissolved in hot water."; inf = "Pb²⁺ indicated";
      } else {
        pptColor = "#facc15"; liquidColor = "rgba(253, 224, 71, 0.3)";
        exp = "Salt soln + KI"; obs = "Golden yellow precipitate formed."; inf = "Presence of Pb²⁺";
      }
    } else if (s.cation === "Cu") {
      pptColor = "#ffffff"; liquidColor = "rgba(146, 64, 14, 0.72)";
      exp = "Cu²⁺ soln + KI"; obs = "White CuI precipitate in brown iodine solution."; inf = "Presence of Cu²⁺";
    } else {
      exp = "Salt soln + KI"; obs = "No golden yellow precipitate."; inf = "Absence of Pb²⁺";
    }
  }

  if (rSet.has("k2cro4")) {
    liquidColor = "rgba(250, 204, 21, 0.55)";
    if (s.cation === "Pb") { pptColor = "#eab308"; exp = "Salt soln + CH₃COOH + K₂CrO₄"; obs = "Yellow precipitate."; inf = "Lead confirmed"; }
    else if (s.cation === "Ba") { pptColor = "#fde047"; exp = "Salt soln + CH₃COOH + K₂CrO₄"; obs = "Yellow precipitate."; inf = "Presence of Ba²⁺"; }
    else if (s.cation === "Ca") { pptColor = null; exp = "Salt soln + CH₃COOH + K₂CrO₄"; obs = "Yellow colouration (no ppt)."; inf = "Presence of Ca²⁺"; }
    else { exp = "Salt soln + K₂CrO₄"; obs = "No yellow precipitate."; inf = "Absence of Pb²⁺ & Ba²⁺"; }
  }

  if (rSet.has("dil_hcl") && st.passedH2S && !rSet.has("nh4oh")) {
    bubbles = true;
    pptColor = (s.cGroup === 2 || s.cGroup === 1) ? "#0f172a" : null;
    exp = "Salt soln + dil. HCl + H₂S"; obs = pptColor ? "Black precipitate." : "No precipitate.";
    inf = s.cGroup === 2 ? "Presence of Group II (Cu²⁺)" : "Absence of Group II";
  } else if (st.passedH2S && !rSet.has("dil_hcl") && !(rSet.has("nh4cl") && rSet.has("nh4oh"))) {
    bubbles = true;
    if (s.cGroup === 2 || s.cGroup === 1) {
      pptColor = "#0f172a";
      exp = "Salt soln + H₂S gas"; obs = "Black sulphide precipitate formed."; inf = "Group I/II cation indicated";
    } else if (s.cGroup === 4) {
      pptColor = "#ffffff";
      exp = "Salt soln + H₂S gas"; obs = "White sulphide precipitate (ZnS)."; inf = "Zn²⁺ indicated";
    } else {
      exp = "Salt soln + H₂S gas"; obs = "Rotten egg smell, no precipitate."; inf = "No sulphide precipitate";
    }
  }

  if (rSet.has("nh4cl") && !rSet.has("nh4oh")) {
    if (s.cation === "Pb") {
      pptColor = "#ffffff";
      exp = "Salt soln + NH₄Cl"; obs = "White precipitate (PbCl₂) formed."; inf = "Pb²⁺ indicated";
    } else {
      exp = "Salt soln + NH₄Cl"; obs = "Clear solution (add NH₄OH for Group III–VI)."; inf = "NH₄Cl buffer added";
    }
  }

  if (rSet.has("nh4oh") && !rSet.has("nh4cl") && !rSet.has("agno3") && !rSet.has("amm_oxalate")) {
    if (s.cation === "Cu") {
      if (count("nh4oh") >= 2) {
        pptColor = null; liquidColor = "rgba(29, 78, 216, 0.85)";
        exp = "Cu²⁺ soln + excess NH₄OH"; obs = "Deep azure blue solution [Cu(NH₃)₄]²⁺."; inf = "Copper (Cu²⁺) confirmed";
      } else {
        pptColor = "#60a5fa"; liquidColor = "rgba(56, 189, 248, 0.55)";
        exp = "Salt soln + NH₄OH"; obs = "Pale blue precipitate formed."; inf = "Cu²⁺ indicated";
      }
    } else if (s.cation === "Al" || s.cation === "Zn" || s.cation === "Pb" || s.cation === "Mg") {
      pptColor = "#ffffff"; pptStyle = s.cation === "Al" ? "gelatinous" : "";
      exp = "Salt soln + NH₄OH"; obs = "White hydroxide precipitate formed."; inf = `${s.cation} cation indicated`;
    } else {
      exp = "Salt soln + NH₄OH"; obs = "No precipitate formed."; inf = "Absence of Cu²⁺, Al³⁺, Pb²⁺";
    }
  }

  if (rSet.has("nh4cl") && rSet.has("nh4oh")) {
    if (rSet.has("na2hpo4")) {
      pptColor = s.cGroup === 6 ? "#ffffff" : null; pptStyle = s.cGroup === 6 ? "crystalline" : "";
      exp = "NH₄Cl + NH₄OH + Na₂HPO₄"; obs = s.cGroup === 6 ? "White crystalline precipitate." : "No precipitate.";
      inf = s.cGroup === 6 ? "Presence of Group VI (Mg²⁺)" : "Absence of Group VI";
    } else if (rSet.has("amm_carbonate")) {
      pptColor = s.cGroup === 5 ? "#ffffff" : null;
      exp = "NH₄Cl + NH₄OH + (NH₄)₂CO₃"; obs = s.cGroup === 5 ? "A white precipitate." : "No precipitate.";
      inf = s.cGroup === 5 ? "Presence of Group V (Ba²⁺/Ca²⁺)" : "Absence of Group V";
    } else if (st.passedH2S) {
      bubbles = true; pptColor = s.cGroup === 4 ? "#ffffff" : null;
      exp = "NH₄Cl + NH₄OH + H₂S"; obs = s.cGroup === 4 ? "White precipitate." : "No precipitate.";
      inf = s.cGroup === 4 ? "Presence of Group IV (Zn²⁺)" : "Absence of Group IV";
    } else {
      pptColor = s.cGroup === 3 ? "#ffffff" : null; pptStyle = s.cGroup === 3 ? "gelatinous" : "";
      exp = "NH₄Cl + excess NH₄OH"; obs = s.cGroup === 3 ? "White gelatinous precipitate." : "No precipitate.";
      inf = s.cGroup === 3 ? "Presence of Group III (Al³⁺)" : "Absence of Group III";
    }
  } else {
    if (rSet.has("amm_carbonate")) {
      pptColor = s.cGroup === 0 ? null : "#ffffff";
      exp = "Salt soln + (NH₄)₂CO₃"; obs = pptColor ? "White carbonate precipitate." : "No precipitate.";
      inf = pptColor ? "Carbonate-forming cation present" : "Zero group (NH₄⁺) indicated";
    }
    if (rSet.has("na2hpo4")) {
      pptColor = (s.cGroup === 6 || s.cGroup === 5 || s.cation === "Al" || s.cation === "Zn" || s.cation === "Pb") ? "#ffffff" : null;
      exp = "Salt soln + Na₂HPO₄"; obs = pptColor ? "White phosphate precipitate." : "No precipitate.";
      inf = "Add NH₄Cl + NH₄OH first for Group VI Mg²⁺";
    }
  }

  if (rSet.has("naoh") && s.cation !== "NH4" && !rSet.has("magneson")) {
    if (s.cation === "Al" || s.cation === "Zn" || s.cation === "Pb") {
      if (count("naoh") >= 2) {
        pptColor = null; exp = "Added excess NaOH"; obs = "White precipitate dissolved in excess NaOH.";
        inf = s.cation === "Al" ? "Presence of Al³⁺" : (s.cation === "Zn" ? "Presence of Zn²⁺" : "Presence of Pb²⁺");
      } else {
        pptColor = "#ffffff"; pptStyle = s.cation === "Al" ? "gelatinous" : "";
        exp = "Added NaOH dropwise"; obs = "White precipitate formed.";
        inf = `${s.cation} indicated`;
      }
    } else if (s.cation === "Cu") {
      pptColor = "#3b82f6"; liquidColor = "rgba(56, 189, 248, 0.5)";
      exp = "Salt soln + NaOH"; obs = "Pale blue Cu(OH)₂ precipitate (insoluble in excess)."; inf = "Presence of Cu²⁺";
    } else if (s.cation === "Mg" || s.cation === "Ca" || s.cation === "Ba") {
      pptColor = "#ffffff";
      exp = "Salt soln + NaOH"; obs = "White hydroxide precipitate (insoluble in excess)."; inf = `${s.cation}²⁺ indicated`;
    } else {
      exp = "Salt soln + NaOH"; obs = "No precipitate or ammonia gas."; inf = "Absence of NH₄⁺, Al³⁺, Zn²⁺, Cu²⁺";
    }
  }

  if (rSet.has("amm_oxalate")) {
    pptColor = s.cation === "Ca" ? "#ffffff" : null;
    exp = "NH₄OH + Ammonium oxalate"; obs = s.cation === "Ca" ? "White precipitate." : "No white precipitate.";
    inf = s.cation === "Ca" ? "Presence of Ca²⁺" : "Absence of Ca²⁺";
  }

  if (rSet.has("magneson")) {
    if (s.cation === "Mg") {
      if (rSet.has("naoh")) {
        pptColor = "#3b82f6"; liquidColor = "rgba(29, 78, 216, 0.85)";
        exp = "Magneson + excess NaOH"; obs = "Lake blue ppt soluble in excess NaOH to deep blue solution."; inf = "Presence of Mg²⁺";
      } else {
        pptColor = "#60a5fa"; liquidColor = "rgba(59, 130, 246, 0.45)";
        exp = "Salt soln + Magneson"; obs = "Lake blue precipitate."; inf = "Mg²⁺ indicated";
      }
    } else {
      exp = "Salt soln + Magneson"; obs = "No lake blue precipitate."; inf = "Absence of Mg²⁺";
    }
  }

  if (rSet.has("cobalt_nitrate")) {
    liquidColor = "rgba(236, 72, 153, 0.45)";
    if (!exp) {
      exp = "Salt soln + Co(NO₃)₂"; obs = "Pink solution (use Ash Test on filter paper + burner for characteristic colour)."; inf = "Co(NO₃)₂ added";
    }
  }

  if (!isReset && !exp) {
    if (st.hasDrySalt && st.reagents.length === 0 && st.temp > 50) {
      exp = "Dry Heating Test";
      obs = s.cation === "Cu" ? "Blue salt turns white on strong heating." : (s.cation === "NH4" ? "White sublimate on cooler parts of tube." : "Crackling / slight colour change on heating.");
      inf = "Dry heating observed";
    } else if (st.hasWater && st.reagents.length === 0) {
      exp = "Dissolved salt in water";
      obs = s.cation === "Cu" ? "Clear blue aqueous solution formed." : "Clear colourless aqueous solution formed.";
      inf = "Original Solution (O.S.) prepared";
    } else if (st.reagents.length > 0) {
      exp = "Mixed reagents";
      obs = "Clear homogeneous mixture (no precipitate or gas evolved).";
      inf = "No visible reaction";
    }
  }
  } // end inorganic salt branch

  // Apply to this tube's DOM
  const hasLiquid = st.volume > 0;
  if (st.evaporatedDry && !hasLiquid && !pptColor) {
    pptColor = (s.cation === "Cu" && st.temp > 95) ? "#e2e8f0" : (s.cation === "Cu" ? "#38bdf8" : "#ffffff");
  }

  const liqEl = tubeObj.el.querySelector(".tube-liquid");
  liqEl.style.height = `${liquidHeight}%`;
  liqEl.style.background = liquidColor;
  if (!isReset && hasLiquid) {
    liqEl.classList.remove("swirling");
    void liqEl.offsetWidth;
    liqEl.classList.add("swirling");
  } else if (!hasLiquid) {
    liqEl.classList.remove("swirling");
  }

  const pptEl = tubeObj.el.querySelector(".tube-ppt");
  pptEl.className = "tube-ppt";
  if (pptColor) {
    pptEl.classList.remove("hidden");
    pptEl.style.backgroundColor = pptColor;
    if (pptStyle) pptEl.classList.add(`ppt-${pptStyle}`);
  } else pptEl.classList.add("hidden");

  tubeObj.el.querySelector(".tube-bubbles").classList.toggle("hidden", !bubbles && !(st.temp >= 85 && hasLiquid));
  const steamEl = tubeObj.el.querySelector(".tube-steam");
  if (steamEl) steamEl.classList.toggle("hidden", !(st.temp >= 72 && hasLiquid));
  tubeObj.el.querySelector(".tube-spangles").classList.toggle("hidden", !spangles);
  tubeObj.el.querySelector(".tube-paper-ball").classList.toggle("hidden", !st.hasPaperBall);
  tubeObj.el.querySelector(".tube-brown-ring").classList.toggle("hidden", !brownRing);
  tubeObj.el.querySelector(".tube-top-layer").classList.toggle("hidden", !brownRing);
  tubeObj.el.querySelector(".mouth-smell").classList.toggle("hidden", !smell);

  const vap = tubeObj.el.querySelector(".tube-vapours");
  if (vapourBg) { vap.style.background = vapourBg; vap.classList.add("show"); }
  else vap.classList.remove("show");

  const rod = tubeObj.el.querySelector(".mouth-rod");
  if (st.heldRod) {
    rod.classList.remove("hidden");
    rod.querySelector(".mr-stick").dataset.label = st.heldRod === "rod_nh4oh" ? "NH₄OH" : "conc. HCl";
    tubeObj.el.querySelector(".mr-fumes").classList.toggle("hidden", !rodFumes);
    if (!isReset && !exp) {
      exp = st.heldRod === "rod_nh4oh" ? "Held NH₄OH glass rod" : "Held conc. HCl glass rod";
      obs = "No dense white fumes formed.";
      inf = st.heldRod === "rod_nh4oh" ? "No HCl gas detected" : "No NH₃ gas detected";
    }
  } else rod.classList.add("hidden");

  tubeObj.el.querySelector(".h2s-pipe").classList.toggle("hidden", !st.passedH2S);
  tubeObj.el.querySelector(".lime-setup").classList.toggle("hidden", !st.hasLimeWater);
  tubeObj.el.querySelector(".lime-liquid").classList.toggle("milky", limeMilky);
  updateTubeThermalDOM(tubeObj);

  if (tubeObj.fx) {
    const fx = tubeObj.fx;
    fx.targetHeight = liquidHeight;
    fx.targetColor = parseColor(liquidColor);
    const dryCol = (st.hasDrySalt && st.reagents.length === 0)
      ? ((s.cation === "Cu" && st.temp <= 95) ? "#38bdf8" : "#f1f5f9")
      : pptColor;
    fx.pptColor = dryCol ? parseColor(dryCol) : null;
    fx.pptStyle = pptStyle || (st.hasDrySalt && st.reagents.length === 0 ? "crystalline" : "");
    fx.spangles = spangles;
    fx.brownRing = brownRing;
    fx.silverMirror = silverMirror;
    fx.hasPaperBall = st.hasPaperBall;
    fx.bubbles = bubbles || (st.temp >= 85 && hasLiquid);
    fx.steam = st.temp >= 72 && hasLiquid;
    fx.rodFumes = rodFumes;
    fx.temp = st.temp;
    fx.vapourType = vapourBg ? (vapourBg.includes("180, 83, 9") ? "brown" : "faint") : null;
    if (!isReset && hasLiquid) {
      fx.plumes.push({
        x: 72 + (Math.random() - 0.5) * 14,
        y: 290 - (liquidHeight / 100) * 195 + 14,
        vx: (Math.random() - 0.5) * 0.7,
        vy: 0.7 + Math.random() * 0.5,
        r: 6,
        alpha: 0.65,
        color: parseColor(liquidColor)
      });
    }
  }

  if (!isReset && exp && obs && inf) {
    showObs(`⚗️ <strong>${obs}</strong> → <span style="color:#0284c7;font-weight:600">${inf}</span>`);
    addLog(exp, obs, inf);
  }
}

function showObs(html) {
  obsBar.innerHTML = html;
  obsBar.classList.remove("hidden");
}

function addLog(exp, obs, inf) {
  const last = logs[logs.length - 1];
  if (last && last.exp === exp && last.obs === obs) return;
  logs.push({ exp, obs, inf });
  renderLog();
}

function renderLog() {
  logCount.textContent = logs.length;
  if (logs.length === 0) {
    logBody.innerHTML = `<tr class="empty-row"><td colspan="3">No experiments recorded yet.</td></tr>`;
    return;
  }
  logBody.innerHTML = logs.map((r) => `<tr><td>${r.exp}</td><td>${r.obs}</td><td><strong>${r.inf}</strong></td></tr>`).join("");
}

function clearBench(clearLog) {
  benchTubes.forEach((t) => t.el.remove());
  benchBurners.forEach((b) => b.el.remove());
  benchBaths.forEach((b) => b.el.remove());
  benchWatchGlasses.forEach((w) => w.el.remove());
  benchRods.forEach((r) => r.el.remove());
  benchTubes = [];
  benchBurners = [];
  benchBaths = [];
  benchWatchGlasses = [];
  benchRods = [];
  activeTubeUid = null;
  obsBar.classList.add("hidden");
  if (clearLog) {
    logs = [];
    renderLog();
  }
}

function renderRecordBook() {
  const body = document.getElementById("recordBookBody");
  if (!body) return;

  if (mysteryMode) {
    body.innerHTML = `
      <tr class="section-row"><td colspan="3">SYSTEMATIC SCHEME FOR UNKNOWN SALT (MYSTERY MODE)</td></tr>
      <tr class="section-row"><td colspan="3">ANALYSIS OF ANIONS (PRELIMINARY &amp; CONFIRMATORY)</td></tr>
      <tr><td>1. Dry Salt + dil. HCl (+ Lime Water)</td><td>Brisk effervescence turning lime water milky</td><td>Carbonate (CO₃²⁻) → Confirm: BaCl₂ + dil. HCl</td></tr>
      <tr><td>2. Dry Salt + dil. H₂SO₄ (Smell)</td><td>Vinegar smell</td><td>Acetate (CH₃COO⁻) → Confirm: Neutral FeCl₃ (reddish brown)</td></tr>
      <tr><td>3. Dry Salt + conc. H₂SO₄ + NH₄OH Rod</td><td>Colourless fuming gas; dense white fumes with rod</td><td>Chloride (Cl⁻) → Confirm: dil. HNO₃ + AgNO₃ (curdy white ppt soluble in NH₄OH)</td></tr>
      <tr><td>4. Dry Salt + conc. H₂SO₄ + Paper Ball + Heat</td><td>Reddish brown vapours (NO₂)</td><td>Nitrate (NO₃⁻) → Confirm: Brown Ring Test (FeSO₄ + conc. H₂SO₄)</td></tr>
      <tr><td>5. Salt Soln + BaCl₂ + excess dil. HCl</td><td>White ppt insoluble in dil. HCl</td><td>Sulphate (SO₄²⁻) → Confirm: CH₃COOH + Lead Acetate (white ppt soluble in NH₄OAc)</td></tr>
      <tr class="section-row"><td colspan="3">ANALYSIS OF CATIONS (GROUP SEPARATION)</td></tr>
      <tr><td>0. Salt Soln + Na₂CO₃</td><td>No precipitate</td><td>Zero Group (NH₄⁺) → Boil with NaOH + HCl rod; Nessler's reagent (reddish brown ppt)</td></tr>
      <tr><td>1. Salt Soln + dil. HCl</td><td>White precipitate</td><td>Group I (Pb²⁺) → KI (golden spangles on heat &amp; cool); K₂CrO₄ (yellow ppt)</td></tr>
      <tr><td>2. Salt Soln + dil. HCl + H₂S Gas</td><td>Black precipitate</td><td>Group II (Cu²⁺) → Bluish-green flame test</td></tr>
      <tr><td>3. Salt Soln + NH₄Cl + excess NH₄OH</td><td>White gelatinous precipitate</td><td>Group III (Al³⁺) → NaOH (soluble in excess); Ash Test (Blue ash)</td></tr>
      <tr><td>4. Salt Soln + NH₄Cl + NH₄OH + H₂S Gas</td><td>White precipitate</td><td>Group IV (Zn²⁺) → NaOH (soluble in excess); Ash Test (Green ash)</td></tr>
      <tr><td>5. Salt Soln + NH₄Cl + NH₄OH + (NH₄)₂CO₃</td><td>White precipitate</td><td>Group V (Ba²⁺ / Ca²⁺) → K₂CrO₄ (Ba²⁺ yellow ppt); Flame: Ba²⁺ grassy green, Ca²⁺ brick red</td></tr>
      <tr><td>6. Salt Soln + NH₄Cl + NH₄OH + Na₂HPO₄</td><td>White crystalline precipitate</td><td>Group VI (Mg²⁺) → Magneson + NaOH (deep blue); Ash Test (Pink ash)</td></tr>
    `;
    return;
  }

  const s = currentSalt;
  if (s.kind === "organic") {
    const orgRows = [];
    orgRows.push(`<tr class="section-row"><td colspan="3">${s.id}. ${s.name.toUpperCase()} (${s.formula}) — ORGANIC FUNCTIONAL GROUP</td></tr>`);
    if (s.org === "COOH") {
      orgRows.push(`<tr><td>1. Substance + sat. NaHCO₃ soln</td><td>Brisk effervescence (CO₂)</td><td><strong>Presence of carboxylic acid</strong></td></tr>`);
      orgRows.push(`<tr><td>2. Esterification: Substance + Ethanol + conc. H₂SO₄ + Heat</td><td>Pleasant fruity smell</td><td><strong>Carboxylic acid confirmed</strong></td></tr>`);
      orgRows.push(`<tr class="result-row"><td colspan="3">RESULT: The given organic substance contains carboxylic acid (-COOH) functional group.</td></tr>`);
    } else if (s.org === "OH") {
      orgRows.push(`<tr><td>1. Substance + sat. NaHCO₃ soln</td><td>No characteristic reaction</td><td>Absence of carboxylic acid</td></tr>`);
      orgRows.push(`<tr><td>2. Substance + NaOH, then HCl</td><td>Dissolves in NaOH and reappears on adding HCl</td><td>Presence of phenol</td></tr>`);
      orgRows.push(`<tr><td>3. Substance + neutral FeCl₃ soln</td><td>Formation of violet colouration</td><td><strong>Presence of phenol</strong></td></tr>`);
      orgRows.push(`<tr><td>4. Confirmatory: Substance + Bromine water</td><td>White precipitate (2,4,6-tribromophenol)</td><td><strong>Phenol confirmed</strong></td></tr>`);
      orgRows.push(`<tr><td>5. Dye Test: Aniline + dil. HCl + NaNO₂ (cold) + NaOH</td><td>Red coloured azo dye</td><td><strong>Phenol confirmed</strong></td></tr>`);
      orgRows.push(`<tr class="result-row"><td colspan="3">RESULT: The given organic substance contains phenolic (-OH) functional group.</td></tr>`);
    } else if (s.org === "NH2") {
      orgRows.push(`<tr><td>1. Substance + sat. NaHCO₃ / NaOH</td><td>Insoluble</td><td>Absence of carboxylic acid &amp; phenol</td></tr>`);
      orgRows.push(`<tr><td>2. Substance + dil. HCl, then NaOH</td><td>Dissolves in dil. HCl; reprecipitates on adding NaOH</td><td><strong>Presence of amine</strong></td></tr>`);
      orgRows.push(`<tr><td>3. Carbylamine Test: CHCl₃ + alc. KOH + Heat</td><td>Unpleasant foul smell</td><td><strong>Amine confirmed</strong></td></tr>`);
      orgRows.push(`<tr><td>4. Azo Dye Test: dil. HCl + NaNO₂ (cold) + β-naphthol</td><td>Bright red azo dye formed</td><td><strong>Aromatic primary amine confirmed</strong></td></tr>`);
      orgRows.push(`<tr class="result-row"><td colspan="3">RESULT: The given organic substance contains amino (-NH₂) functional group.</td></tr>`);
    } else if (s.org === "CHO") {
      orgRows.push(`<tr><td>1. Substance + Borsche's reagent</td><td>Formation of yellow/orange ppt</td><td>Presence of aldehyde or ketone</td></tr>`);
      orgRows.push(`<tr><td>2. Substance + Schiff's reagent</td><td>Development of pink colour</td><td><strong>Presence of aldehyde</strong></td></tr>`);
      orgRows.push(`<tr><td>3. Tollen's Test: Substance + Tollen's + Heat</td><td>Bright silver mirror on sides of tube</td><td><strong>Aldehyde confirmed</strong></td></tr>`);
      orgRows.push(`<tr><td>4. Fehling's Test: Substance + Fehling's A &amp; B + Heat</td><td>Brick-red precipitate (Cu₂O)</td><td><strong>Aldehyde confirmed</strong></td></tr>`);
      orgRows.push(`<tr class="result-row"><td colspan="3">RESULT: The given organic substance contains aldehydic (-CHO) functional group.</td></tr>`);
    } else if (s.org === "CO") {
      orgRows.push(`<tr><td>1. Substance + Borsche's reagent</td><td>Formation of yellow/orange ppt</td><td>Presence of aldehyde or ketone</td></tr>`);
      orgRows.push(`<tr><td>2. Substance + Schiff's reagent</td><td>No pink colour</td><td>Absence of aldehyde</td></tr>`);
      orgRows.push(`<tr><td>3. Tollen's Test / Fehling's Test + Heat</td><td>No silver mirror / No red precipitate</td><td><strong>Ketone confirmed</strong></td></tr>`);
      orgRows.push(`<tr class="result-row"><td colspan="3">RESULT: The given organic substance contains ketonic (&gt;CO) functional group.</td></tr>`);
    }
    body.innerHTML = orgRows.join("");
    return;
  }

  const rows = [];
  rows.push(`<tr class="section-row"><td colspan="3">${s.id}. ${s.name.toUpperCase()} (${s.formula})</td></tr>`);
  rows.push(`<tr class="section-row"><td colspan="3">ANALYSIS OF ANIONS</td></tr>`);

  const prelims = [
    { a: "CO3", exp: "1. Dry Salt + dil. HCl (+ Lime Water)", pos: "Brisk effervescence turning lime water milky.", neg: "No characteristic reaction", pInf: "Presence of carbonate (CO₃²⁻)", nInf: "Absence of carbonate", cTitle: "Confirmatory Test for Carbonate", cExp: "1. Salt soln + BaCl₂, then dil. HCl", cObs: "White ppt formed which dissolves in dil. HCl with CO₂ evolution.", cInf: "Presence of carbonate confirmed." },
    { a: "CH3COO", exp: "2. Dry Salt + dil. H₂SO₄ (Smell)", pos: "Vinegar smell", neg: "No vinegar smell", pInf: "Presence of acetate (CH₃COO⁻)", nInf: "Absence of acetate", cTitle: "Confirmatory Test for Acetate", cExp: "1. Salt soln + neutral FeCl₃", cObs: "A reddish brown colouration.", cInf: "Presence of acetate confirmed." },
    { a: "Cl", exp: "3. Dry Salt + conc. H₂SO₄ + NH₄OH Rod", pos: "Colourless fuming gas; dense white fumes with NH₄OH rod.", neg: "No characteristic reaction", pInf: "Presence of chloride (Cl⁻)", nInf: "Absence of chloride", cTitle: "Confirmatory Test for Chloride", cExp: "1. Salt soln + dil. HNO₃ + AgNO₃, then NH₄OH", cObs: "White curdy ppt formed, readily soluble in NH₄OH.", cInf: "Presence of chloride confirmed." },
    { a: "NO3", exp: "4. Dry Salt + conc. H₂SO₄ + Paper Ball + Heat", pos: "Reddish brown vapours are evolved.", neg: "No characteristic reaction", pInf: "Presence of nitrate (NO₃⁻)", nInf: "Absence of nitrate", cTitle: "Confirmatory Test for Nitrate (Brown Ring Test)", cExp: "1. Salt soln + fresh FeSO₄ + conc. H₂SO₄", cObs: "A brown ring is formed at the junction of the two liquids.", cInf: "Presence of nitrate confirmed." },
    { a: "SO4", exp: "5. Salt soln + BaCl₂ + excess dil. HCl", pos: "White ppt insoluble in excess dil. HCl.", neg: "No precipitate", pInf: "Presence of sulphate (SO₄²⁻)", nInf: "Absence of sulphate", cTitle: "Confirmatory Test for Sulphate", cExp: "1. Salt soln + CH₃COOH + Lead acetate, then NH₄OAc", cObs: "White ppt formed, soluble in ammonium acetate.", cInf: "Presence of sulphate confirmed." }
  ];

  for (const p of prelims) {
    if (s.anion === p.a) {
      rows.push(`<tr><td>${p.exp}</td><td>${p.pos}</td><td><strong>${p.pInf}</strong></td></tr>`);
      rows.push(`<tr class="section-row"><td colspan="3">${p.cTitle}</td></tr>`);
      rows.push(`<tr><td>${p.cExp}</td><td>${p.cObs}</td><td><strong>${p.cInf}</strong></td></tr>`);
      break;
    } else {
      rows.push(`<tr><td>${p.exp}</td><td>${p.neg}</td><td>${p.nInf}</td></tr>`);
    }
  }

  rows.push(`<tr class="section-row"><td colspan="3">ANALYSIS OF CATIONS</td></tr>`);
  const grps = [
    { g: 0, exp: "1. Salt soln + Na₂CO₃", pos: "No precipitate", neg: "A precipitate is formed", pInf: "Presence of zero group (NH₄⁺)", nInf: "Absence of zero group" },
    { g: 1, exp: "2. Salt soln + dil. HCl", pos: "White precipitate.", neg: "No precipitate", pInf: "Presence of Group I (Pb²⁺)", nInf: "Absence of Group I" },
    { g: 2, exp: "3. Salt soln + dil. HCl + H₂S Gas", pos: "Black precipitate.", neg: "No precipitate", pInf: "Presence of Group II (Cu²⁺)", nInf: "Absence of Group II" },
    { g: 3, exp: "4. Salt soln + NH₄Cl + excess NH₄OH", pos: "White gelatinous precipitate", neg: "No precipitate", pInf: "Presence of Group III (Al³⁺)", nInf: "Absence of Group III" },
    { g: 4, exp: "5. Salt soln + NH₄Cl + NH₄OH + H₂S Gas", pos: "White precipitate.", neg: "No precipitate", pInf: "Presence of Group IV (Zn²⁺)", nInf: "Absence of Group IV" },
    { g: 5, exp: "6. Salt soln + NH₄Cl + NH₄OH + (NH₄)₂CO₃", pos: "A white precipitate", neg: "No precipitate", pInf: "Presence of Group V (Ba²⁺/Ca²⁺)", nInf: "Absence of Group V" },
    { g: 6, exp: "7. Salt soln + NH₄Cl + NH₄OH + Na₂HPO₄", pos: "White crystalline precipitate.", neg: "No precipitate", pInf: "Presence of Group VI (Mg²⁺)", nInf: "Absence of Group VI" }
  ];

  for (const g of grps) {
    if (s.cGroup === g.g) {
      rows.push(`<tr><td>${g.exp}</td><td>${g.pos}</td><td><strong>${g.pInf}</strong></td></tr>`);
      break;
    } else {
      rows.push(`<tr><td>${g.exp}</td><td>${g.neg}</td><td>${g.nInf}</td></tr>`);
    }
  }

  if (s.cation === "NH4") {
    rows.push(`<tr class="section-row"><td colspan="3">Analysis of Zero Group (NH₄⁺)</td></tr>`);
    rows.push(`<tr><td>1. Dry Salt + NaOH + Heat + conc. HCl Rod</td><td>Pungent gas; dense white fumes with conc. HCl rod.</td><td><strong>Presence of NH₄⁺</strong></td></tr>`);
    rows.push(`<tr><td>2. Salt soln + Nessler's reagent</td><td>A reddish brown precipitate is formed.</td><td><strong>NH₄⁺ confirmed.</strong></td></tr>`);
  } else if (s.cation === "Pb") {
    rows.push(`<tr class="section-row"><td colspan="3">Analysis of First Group (Pb²⁺)</td></tr>`);
    rows.push(`<tr><td>1. Salt soln + KI + Heat (Burner) + Cool (Bath)</td><td>Golden yellow ppt dissolves in hot water, golden spangles on cooling.</td><td><strong>Presence of Pb²⁺</strong></td></tr>`);
    rows.push(`<tr><td>2. Salt soln + CH₃COOH + K₂CrO₄</td><td>Yellow precipitate is formed.</td><td><strong>Pb²⁺ confirmed.</strong></td></tr>`);
  } else if (s.cation === "Al") {
    rows.push(`<tr class="section-row"><td colspan="3">Analysis of Third Group (Al³⁺)</td></tr>`);
    rows.push(`<tr><td>1. Salt soln + NaOH (drops, then excess)</td><td>White gelatinous ppt soluble in excess NaOH.</td><td><strong>Presence of Al³⁺</strong></td></tr>`);
    rows.push(`<tr><td>2. Ash Test (conc. HNO₃ + Co(NO₃)₂ + Ash Paper)</td><td>Blue tinted ash</td><td><strong>Al³⁺ confirmed.</strong></td></tr>`);
  } else if (s.cation === "Zn") {
    rows.push(`<tr class="section-row"><td colspan="3">Analysis of Fourth Group (Zn²⁺)</td></tr>`);
    rows.push(`<tr><td>1. Salt soln + NaOH (drops, then excess)</td><td>White ppt soluble in excess NaOH.</td><td><strong>Presence of Zn²⁺</strong></td></tr>`);
    rows.push(`<tr><td>2. Ash Test (conc. HNO₃ + Co(NO₃)₂ + Ash Paper)</td><td>Green tinted ash</td><td><strong>Zn²⁺ confirmed.</strong></td></tr>`);
  } else if (s.cation === "Ba") {
    rows.push(`<tr class="section-row"><td colspan="3">Analysis of Fifth Group (Ba²⁺)</td></tr>`);
    rows.push(`<tr><td>1. Salt soln + CH₃COOH + K₂CrO₄</td><td>An yellow ppt</td><td><strong>Presence of Ba²⁺</strong></td></tr>`);
    rows.push(`<tr><td>2. Flame Test (Flame Wire on Burner)</td><td>Grassy green colouration to the flame.</td><td><strong>Ba²⁺ confirmed.</strong></td></tr>`);
  } else if (s.cation === "Ca") {
    rows.push(`<tr class="section-row"><td colspan="3">Analysis of Fifth Group (Ca²⁺)</td></tr>`);
    rows.push(`<tr><td>1. Salt soln + CH₃COOH + K₂CrO₄</td><td>Yellow colouration (no ppt)</td><td><strong>Presence of Ca²⁺</strong></td></tr>`);
    rows.push(`<tr><td>2. Salt soln + NH₄OH + Amm. Oxalate</td><td>A white ppt</td><td><strong>Presence of Ca²⁺</strong></td></tr>`);
    rows.push(`<tr><td>3. Flame Test (Flame Wire on Burner)</td><td>Brick red colouration to the flame.</td><td><strong>Ca²⁺ confirmed.</strong></td></tr>`);
  } else if (s.cation === "Mg") {
    rows.push(`<tr class="section-row"><td colspan="3">Analysis of Group VI (Mg²⁺)</td></tr>`);
    rows.push(`<tr><td>1. Salt soln + Magneson + excess NaOH</td><td>Lake blue ppt soluble in excess NaOH to deep blue solution.</td><td><strong>Presence of Mg²⁺</strong></td></tr>`);
    rows.push(`<tr><td>2. Ash Test (conc. HNO₃ + Co(NO₃)₂ + Ash Paper)</td><td>Pink tinted ash</td><td><strong>Mg²⁺ confirmed.</strong></td></tr>`);
  }

  rows.push(`<tr class="result-row"><td colspan="3">RESULT: The given salt is ${s.name} (${s.formula}).</td></tr>`);
  body.innerHTML = rows.join("");
}

// =========================================================================
// REAL-TIME 60FPS FLUID, SMOKE, PRECIPITATE & FLAME PHYSICS ENGINE
// =========================================================================
function createTubeFX() {
  return {
    currHeight: 0,
    targetHeight: 0,
    currColor: { r: 186, g: 230, b: 253, a: 0.42 },
    targetColor: { r: 186, g: 230, b: 253, a: 0.42 },
    waveAmp: 0,
    wavePhase: 0,
    pptColor: null,
    pptStyle: "",
    spangles: false,
    brownRing: false,
    hasPaperBall: false,
    bubbles: false,
    steam: false,
    rodFumes: false,
    vapourType: null,
    temp: 25,
    drops: [],
    plumes: [],
    ppts: [],
    bubbleList: [],
    smokeList: []
  };
}

function parseColor(str) {
  if (!str) return { r: 255, g: 255, b: 255, a: 1 };
  if (str.startsWith("#")) {
    let h = str.slice(1);
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };
  return { r: 186, g: 230, b: 253, a: 0.45 };
}

function tubeInnerFloorY(x) {
  // Tube inner box: x in [39..105], y in [84..287], rounded bottom radius = 33 around cx = 72
  const dx = Math.abs(x - 72);
  const r = 33;
  if (dx >= r) return 254;
  return 254 + Math.sqrt(Math.max(0, r * r - dx * dx));
}

function renderAllPhysics() {
  benchTubes.forEach(renderTubeFX);
  benchBurners.forEach(renderBurnerFX);
  benchWatchGlasses.forEach(renderWatchGlassFX);
  requestAnimationFrame(renderAllPhysics);
}

function createWatchGlassFX(withRinse = false) {
  return {
    drops: [],
    ripples: [],
    bubbles: [],
    vapours: [],
    rinseAlpha: withRinse ? 0.85 : 0
  };
}

function renderWatchGlassFX(wgObj) {
  const canvas = wgObj.canvas;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const st = wgObj.state;
  const fx = wgObj.fx || (wgObj.fx = createWatchGlassFX(false));
  ctx.save();
  ctx.setTransform(2, 0, 0, 2, 0, 0); // 124x64 logical
  ctx.clearRect(0, 0, 124, 64);

  // Liquid pool with specular highlight
  if (st.liquidColor) {
    const lc = parseColor(st.liquidColor);
    const lg = ctx.createRadialGradient(62, 48, 4, 62, 50, 44);
    lg.addColorStop(0, `rgba(${lc.r}, ${lc.g}, ${lc.b}, ${Math.min(1, lc.a + 0.15)})`);
    lg.addColorStop(1, `rgba(${lc.r}, ${lc.g}, ${lc.b}, ${lc.a * 0.65})`);
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.ellipse(62, 50, 44, 9.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(62, 47, 30, 3.2, 0, Math.PI * 0.1, Math.PI * 0.9);
    ctx.stroke();
  }

  // 3D crystalline salt mound / wet paste / precipitate
  if (st.hasDrySalt || st.pptColor) {
    const col = st.pptColor
      ? parseColor(st.pptColor)
      : (currentSalt.cation === "Cu" ? { r: 56, g: 189, b: 248, a: 1 } : { r: 248, g: 250, b: 252, a: 1 });
    const isPaste = st.reagents.length > 0;
    const grains = [
      [-14, 1, 2.2], [-9, -1, 2.6], [-4, -3, 3.0], [1, -4, 3.2], [6, -2, 2.8], [12, 0, 2.4], [16, 2, 2.0],
      [-11, 3, 2.5], [-6, 2, 2.8], [0, 1, 3.1], [5, 2, 2.7], [10, 3, 2.4], [-2, -1, 2.9], [3, 0, 2.8]
    ];
    grains.forEach(([ox, oy, r]) => {
      ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${isPaste ? 0.85 : 0.96})`;
      ctx.beginPath();
      ctx.arc(62 + ox, 51 + oy, isPaste ? r * 1.15 : r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
      ctx.lineWidth = 0.6;
      ctx.stroke();
    });
  }

  // Expanding splash ripples
  for (let i = fx.ripples.length - 1; i >= 0; i--) {
    const rp = fx.ripples[i];
    rp.rx += 1.4;
    rp.ry += 0.35;
    rp.alpha -= 0.035;
    if (rp.alpha <= 0) { fx.ripples.splice(i, 1); continue; }
    ctx.strokeStyle = `rgba(${rp.color.r}, ${rp.color.g}, ${rp.color.b}, ${rp.alpha})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(rp.x, rp.y, rp.rx, rp.ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Falling drops & salt crystals
  for (let i = fx.drops.length - 1; i >= 0; i--) {
    const d = fx.drops[i];
    d.y += d.vy;
    d.vy += 0.22;
    if (d.y >= 49) {
      if (!d.isGrain) {
        fx.ripples.push({ x: d.x, y: 49, rx: 3, ry: 1.2, alpha: 0.85, color: d.color });
      }
      fx.drops.splice(i, 1);
      continue;
    }
    ctx.fillStyle = `rgba(${d.color.r}, ${d.color.g}, ${d.color.b}, 0.95)`;
    ctx.beginPath();
    if (d.isGrain) ctx.rect(d.x - d.r / 2, d.y - d.r / 2, d.r, d.r);
    else ctx.ellipse(d.x, d.y, d.r * 0.75, d.r, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Vigorous CO2 effervescence bubbles
  if (st.bubbles && fx.bubbles.length < 22 && Math.random() < 0.65) {
    fx.bubbles.push({
      x: 34 + Math.random() * 56,
      y: 52,
      vy: 0.9 + Math.random() * 1.1,
      r: 1.2 + Math.random() * 1.8,
      alpha: 0.95
    });
  }
  for (let i = fx.bubbles.length - 1; i >= 0; i--) {
    const b = fx.bubbles[i];
    b.y -= b.vy;
    b.alpha -= 0.032;
    if (b.alpha <= 0 || b.y < 14) { fx.bubbles.splice(i, 1); continue; }
    ctx.strokeStyle = `rgba(255, 255, 255, ${b.alpha})`;
    ctx.fillStyle = `rgba(224, 242, 254, ${b.alpha * 0.5})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Vinegar / acid aroma wisps
  if (st.vapour && fx.vapours.length < 16 && Math.random() < 0.35) {
    fx.vapours.push({ x: 48 + Math.random() * 28, y: 46, vx: (Math.random() - 0.5) * 0.35, vy: -0.65, r: 4, life: 0, max: 42 });
  }
  for (let i = fx.vapours.length - 1; i >= 0; i--) {
    const v = fx.vapours[i];
    v.life++;
    v.x += v.vx + Math.sin(v.life * 0.15) * 0.25;
    v.y += v.vy;
    v.r += 0.18;
    const a = (1 - v.life / v.max) * 0.35;
    if (v.life >= v.max) { fx.vapours.splice(i, 1); continue; }
    ctx.fillStyle = `rgba(203, 213, 225, ${a})`;
    ctx.beginPath();
    ctx.arc(v.x, v.y, v.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Water rinse flush animation
  if (fx.rinseAlpha > 0.02) {
    ctx.fillStyle = `rgba(56, 189, 248, ${fx.rinseAlpha * 0.5})`;
    ctx.beginPath();
    ctx.ellipse(62, 50, 46, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    fx.rinseAlpha *= 0.9;
  }

  ctx.restore();
}

function renderTubeFX(tubeObj) {
  const canvas = tubeObj.canvas;
  const fx = tubeObj.fx;
  if (!canvas || !fx) return;
  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.setTransform(2, 0, 0, 2, 0, 0); // 144x290 logical space
  ctx.clearRect(0, 0, 144, 290);

  // Smoothly interpolate height, colour, and wave decay
  fx.currHeight += (fx.targetHeight - fx.currHeight) * 0.14;
  fx.currColor.r += (fx.targetColor.r - fx.currColor.r) * 0.1;
  fx.currColor.g += (fx.targetColor.g - fx.currColor.g) * 0.1;
  fx.currColor.b += (fx.targetColor.b - fx.currColor.b) * 0.1;
  fx.currColor.a += (fx.targetColor.a - fx.currColor.a) * 0.1;
  fx.wavePhase += 0.22;
  fx.waveAmp *= 0.94;

  const liqH = (fx.currHeight / 100) * 198;
  const surfaceY = 286 - liqH;

  // Clip to inside of test tube for liquid, plumes, precipitates, brown ring, bubbles
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(39, 84);
  ctx.lineTo(105, 84);
  ctx.lineTo(105, 254);
  ctx.arc(72, 254, 33, 0, Math.PI, false);
  ctx.closePath();
  ctx.clip();

  // Warm glass glow when heated
  if (fx.temp > 65) {
    const heatAlpha = Math.min(0.45, (fx.temp - 65) / 140);
    const hg = ctx.createRadialGradient(72, 286, 4, 72, 280, 42);
    hg.addColorStop(0, `rgba(249, 115, 22, ${heatAlpha})`);
    hg.addColorStop(1, "rgba(249, 115, 22, 0)");
    ctx.fillStyle = hg;
    ctx.fillRect(36, 220, 72, 70);
  }

  // Liquid body with sloshing meniscus
  if (liqH > 1) {
    ctx.beginPath();
    ctx.moveTo(38, 290);
    ctx.lineTo(38, surfaceY);
    for (let x = 38; x <= 106; x += 4) {
      const wave = Math.sin(fx.wavePhase + x * 0.14) * fx.waveAmp;
      const meniscus = Math.pow((x - 72) / 34, 2) * -2.2;
      ctx.lineTo(x, surfaceY + wave + meniscus);
    }
    ctx.lineTo(106, 290);
    ctx.closePath();

    const grad = ctx.createLinearGradient(39, surfaceY, 105, 286);
    const { r, g, b, a } = fx.currColor;
    grad.addColorStop(0, `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${Math.min(1, a * 0.85)})`);
    grad.addColorStop(1, `rgba(${Math.max(0, Math.round(r - 18))}, ${Math.max(0, Math.round(g - 18))}, ${Math.max(0, Math.round(b - 10))}, ${Math.min(1, a + 0.12)})`);
    ctx.fillStyle = grad;
    ctx.fill();

    // Specular meniscus rim
    ctx.beginPath();
    for (let x = 39; x <= 105; x += 4) {
      const wave = Math.sin(fx.wavePhase + x * 0.14) * fx.waveAmp;
      const meniscus = Math.pow((x - 72) / 34, 2) * -2.2;
      if (x === 39) ctx.moveTo(x, surfaceY + wave + meniscus);
      else ctx.lineTo(x, surfaceY + wave + meniscus);
    }
    ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Brown Ring two-layer interface
    if (fx.brownRing) {
      const ringY = surfaceY + Math.min(26, liqH * 0.35);
      const rg = ctx.createLinearGradient(0, ringY - 5, 0, ringY + 5);
      rg.addColorStop(0, "rgba(120, 53, 15, 0)");
      rg.addColorStop(0.5, "rgba(92, 34, 9, 0.92)");
      rg.addColorStop(1, "rgba(120, 53, 15, 0)");
      ctx.fillStyle = rg;
      ctx.fillRect(39, ringY - 5, 66, 10);
    }

    // Metallic Silver Mirror (Tollen's test positive for Aldehyde)
    if (fx.silverMirror) {
      const mg = ctx.createLinearGradient(39, surfaceY, 105, surfaceY);
      mg.addColorStop(0, "rgba(226, 232, 240, 0.95)");
      mg.addColorStop(0.28, "rgba(148, 163, 184, 0.72)");
      mg.addColorStop(0.5, "rgba(255, 255, 255, 0.96)");
      mg.addColorStop(0.75, "rgba(100, 116, 139, 0.75)");
      mg.addColorStop(1, "rgba(226, 232, 240, 0.95)");
      ctx.fillStyle = mg;
      ctx.fillRect(39, surfaceY, 66, liqH + 6);
    }
  }

  // Diffusing colour plumes
  for (let i = fx.plumes.length - 1; i >= 0; i--) {
    const pl = fx.plumes[i];
    pl.x += pl.vx;
    pl.y += pl.vy;
    pl.r += 0.45;
    pl.alpha -= 0.015;
    if (pl.alpha <= 0 || pl.y > 286) { fx.plumes.splice(i, 1); continue; }
    const pg = ctx.createRadialGradient(pl.x, pl.y, 1, pl.x, pl.y, pl.r);
    pg.addColorStop(0, `rgba(${pl.color.r}, ${pl.color.g}, ${pl.color.b}, ${pl.alpha})`);
    pg.addColorStop(1, `rgba(${pl.color.r}, ${pl.color.g}, ${pl.color.b}, 0)`);
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(pl.x, pl.y, pl.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Paper ball
  if (fx.hasPaperBall) {
    ctx.fillStyle = "#57534e";
    ctx.beginPath();
    ctx.arc(72, Math.max(surfaceY + 12, 245), 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.arc(70, Math.max(surfaceY + 10, 243), 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Precipitate particles (nucleate & settle on curved bottom)
  const targetCount = fx.pptColor ? (fx.spangles ? 55 : 68) : 0;
  while (fx.ppts.length < targetCount) {
    const px = 44 + Math.random() * 56;
    const py = liqH > 12 ? surfaceY + 6 + Math.random() * Math.max(8, liqH - 16) : 275 + Math.random() * 8;
    fx.ppts.push({
      x: px, y: py,
      vx: (Math.random() - 0.5) * 0.4,
      vy: fx.spangles ? 0.15 + Math.random() * 0.25 : 0.35 + Math.random() * 0.55,
      size: fx.pptStyle === "gelatinous" ? 3.5 + Math.random() * 3.5 : (fx.spangles ? 2.4 + Math.random() * 1.8 : 1.8 + Math.random() * 2.2),
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.08,
      alpha: 0.1,
      twinkle: Math.random() * Math.PI * 2
    });
  }
  for (let i = fx.ppts.length - 1; i >= 0; i--) {
    const p = fx.ppts[i];
    if (!fx.pptColor) {
      p.alpha -= 0.06;
      if (p.alpha <= 0) { fx.ppts.splice(i, 1); continue; }
    } else {
      p.alpha = Math.min(fx.pptStyle === "gelatinous" ? 0.55 : 0.92, p.alpha + 0.05);
    }
    const floorY = tubeInnerFloorY(p.x) - p.size * 0.6;
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.95;
    if (p.x < 43) { p.x = 43; p.vx *= -0.5; }
    if (p.x > 101) { p.x = 101; p.vx *= -0.5; }
    if (p.y < surfaceY + 3 && liqH > 8) p.y = surfaceY + 3;
    if (p.y >= floorY) {
      p.y = floorY;
      p.vy = 0;
      p.x += (72 - p.x) * 0.004; // slide gently toward center bottom
    } else {
      p.vy = Math.min(1.4, p.vy + (fx.spangles ? 0.015 : 0.04));
      if (fx.spangles) { p.x += Math.sin(fx.wavePhase * 0.4 + p.twinkle) * 0.18; p.angle += p.spin; }
    }

    const pc = fx.pptColor || { r: 255, g: 255, b: 255 };
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    if (fx.spangles) {
      const shine = 0.55 + 0.45 * Math.sin(fx.wavePhase * 0.7 + p.twinkle);
      ctx.fillStyle = `rgba(${pc.r}, ${pc.g}, ${pc.b}, ${p.alpha * shine})`;
      ctx.fillRect(-p.size, -p.size * 0.45, p.size * 2, p.size * 0.9);
    } else {
      ctx.fillStyle = `rgba(${pc.r}, ${pc.g}, ${pc.b}, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Rising effervescence & boiling bubbles
  if (fx.bubbles && liqH > 8 && fx.bubbleList.length < 28 && Math.random() < 0.55) {
    fx.bubbleList.push({
      x: 48 + Math.random() * 48,
      y: 280 - Math.random() * 14,
      vy: 1.1 + Math.random() * 1.4,
      r: 1.3 + Math.random() * 2.1,
      wobble: Math.random() * Math.PI * 2
    });
  }
  for (let i = fx.bubbleList.length - 1; i >= 0; i--) {
    const b = fx.bubbleList[i];
    b.y -= b.vy;
    b.x += Math.sin(fx.wavePhase + b.wobble) * 0.35;
    if (b.y <= surfaceY + 2) { fx.bubbleList.splice(i, 1); continue; }
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore(); // End inner-tube clip!

  // Falling reagent drops (above and entering tube)
  for (let i = fx.drops.length - 1; i >= 0; i--) {
    const d = fx.drops[i];
    d.y += d.vy;
    d.vy += 0.28;
    if (d.y >= surfaceY) {
      fx.waveAmp = Math.min(8, fx.waveAmp + 2.2);
      fx.plumes.push({ x: d.x, y: surfaceY + 8, vx: (Math.random() - 0.5) * 0.8, vy: 0.9, r: 5, alpha: 0.75, color: d.color });
      fx.drops.splice(i, 1);
      continue;
    }
    ctx.fillStyle = `rgba(${d.color.r}, ${d.color.g}, ${d.color.b}, 0.92)`;
    ctx.beginPath();
    ctx.ellipse(d.x, d.y, 3.2, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Volumetric rising smoke, vapours, steam & NH4Cl rod fumes
  const maxSmoke = fx.rodFumes ? 72 : 45;
  const spawnChance = fx.rodFumes ? 0.85 : 0.45;
  if ((fx.vapourType || fx.steam || fx.rodFumes) && fx.smokeList.length < maxSmoke && Math.random() < spawnChance) {
    let col = { r: 226, g: 232, b: 240 };
    let maxAlpha = 0.36;
    let startY = 82;
    let startX = 72 + (Math.random() - 0.5) * 20;
    if (fx.vapourType === "brown") {
      col = { r: 180, g: 83, b: 9 };
      maxAlpha = 0.62;
      startY = Math.max(95, surfaceY - 12);
    } else if (fx.rodFumes) {
      col = { r: 248, g: 250, b: 252 };
      maxAlpha = 0.88;
      startY = 66 + (Math.random() - 0.5) * 10;
      startX = 64 + (Math.random() - 0.5) * 16;
    } else if (fx.steam) {
      col = { r: 226, g: 232, b: 240 };
      maxAlpha = 0.34;
      startY = Math.max(85, surfaceY - 8);
    }
    fx.smokeList.push({
      x: startX,
      y: startY,
      vx: (Math.random() - 0.5) * (fx.rodFumes ? 0.75 : 0.45),
      vy: -(0.7 + Math.random() * 0.65),
      r: fx.rodFumes ? 11 + Math.random() * 7 : 6 + Math.random() * 4,
      alpha: 0.08,
      maxAlpha,
      color: col,
      life: 0,
      maxLife: 65 + Math.random() * 35
    });
  }
  for (let i = fx.smokeList.length - 1; i >= 0; i--) {
    const sm = fx.smokeList[i];
    sm.life++;
    sm.x += sm.vx + Math.sin(fx.wavePhase * 0.3 + sm.life * 0.08) * 0.28;
    sm.y += sm.vy;
    sm.r += 0.24;
    const t = sm.life / sm.maxLife;
    sm.alpha = t < 0.25 ? (t / 0.25) * sm.maxAlpha : (1 - (t - 0.25) / 0.75) * sm.maxAlpha;
    if (sm.life >= sm.maxLife || sm.y < 4) { fx.smokeList.splice(i, 1); continue; }
    const sg = ctx.createRadialGradient(sm.x, sm.y, 1, sm.x, sm.y, sm.r);
    sg.addColorStop(0, `rgba(${sm.color.r}, ${sm.color.g}, ${sm.color.b}, ${sm.alpha})`);
    sg.addColorStop(1, `rgba(${sm.color.r}, ${sm.color.g}, ${sm.color.b}, 0)`);
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(sm.x, sm.y, sm.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function renderBurnerFX(bObj) {
  const canvas = bObj.canvas;
  const fx = bObj.fx;
  if (!canvas || !fx) return;
  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.setTransform(2, 0, 0, 2, 0, 0); // 120x130 logical space
  ctx.clearRect(0, 0, 120, 130);
  if (!bObj.on) { ctx.restore(); return; }

  const t = performance.now() * 0.008;
  const sway = Math.sin(t * 1.4) * 2.5 + Math.cos(t * 2.7) * 1.2;
  const hFlicker = Math.sin(t * 2.3) * 4;

  // Outer roaring flame cone
  ctx.beginPath();
  ctx.moveTo(46, 124);
  ctx.quadraticCurveTo(32, 72, 60 + sway, 22 + hFlicker);
  ctx.quadraticCurveTo(88, 72, 74, 124);
  ctx.closePath();
  const og = ctx.createRadialGradient(60, 102, 4, 60, 82, 64);
  og.addColorStop(0, fx.outer);
  og.addColorStop(0.65, fx.outer.replace(/[\d.]+\)$/, "0.38)"));
  og.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = og;
  ctx.fill();

  // Inner bright blue/spectral core
  ctx.beginPath();
  ctx.moveTo(52, 124);
  ctx.quadraticCurveTo(47, 94, 60 + sway * 0.5, 68 + hFlicker * 0.5);
  ctx.quadraticCurveTo(73, 94, 68, 124);
  ctx.closePath();
  const ig = ctx.createLinearGradient(60, 68, 60, 124);
  ig.addColorStop(0, "rgba(255, 255, 255, 0.7)");
  ig.addColorStop(0.4, fx.inner);
  ig.addColorStop(1, fx.inner);
  ctx.fillStyle = ig;
  ctx.fill();

  // Spectral sparks / embers
  if (fx.sparkColor && fx.sparks.length < 18 && Math.random() < 0.35) {
    fx.sparks.push({ x: 60 + (Math.random() - 0.5) * 14, y: 88, vx: (Math.random() - 0.5) * 0.7, vy: -(1.2 + Math.random() * 1.2), life: 0, max: 28 + Math.random() * 18 });
  }
  for (let i = fx.sparks.length - 1; i >= 0; i--) {
    const sp = fx.sparks[i];
    sp.life++;
    sp.x += sp.vx;
    sp.y += sp.vy;
    if (sp.life >= sp.max) { fx.sparks.splice(i, 1); continue; }
    ctx.globalAlpha = 1 - sp.life / sp.max;
    ctx.fillStyle = fx.sparkColor || "#fbbf24";
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

document.addEventListener("DOMContentLoaded", init);
