/**
 * SENTINEL / BEACON - WOMEN'S SAFETY APP (HACKATHON FULL-STACK)
 * 8 Interactive Screens, Multi-Theme Engine, Google Maps Integration,
 * Audio Synthesis, Fake Call Simulator, and SOS Emergency Dispatch
 */

// Application State
const state = {
  activeScreen: 's02', // Default to Home Dashboard for instant wow factor
  activeTheme: 'crimson',
  activeView: 'simulator', // 'simulator' or 'gallery'
  googleMapsLoaded: false,
  googleMapsKey: '',
  profile: null,
  guardians: [],
  reports: [],
  activeTrip: null,
  activeFilter: 'all',
  sosHoldTimer: null,
  sosHoldProgress: 0,
  countdownTimer: null,
  countdownSeconds: 3,
  autoCallPoliceOnSos: true,
  policeNumber: '100',
  userAlertNumber: '7804892413',
  fakeCallTimer: null,
  audioCtx: null
};

// Map instances
let tripMap = null;
let communityMap = null;
let communityMarkers = [];

// ==========================================
// 1. INITIALIZATION & DATA LOADING
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  setupAudioContext();
  setupThemeEngine();
  setupNavigation();
  setupSosHoldButton();
  setupFakeCall();
  setupReportForm();
  
  // Fetch initial data from backend Express API
  await fetchConfig();
  await fetchProfile();
  await fetchGuardians();
  await fetchReports();
  await fetchActiveTrip();
  
  // Initialize Google Maps or vector map canvas fallback
  initGoogleMapsEngine();
  
  // Register Service Worker for PWA installability on phone
  registerServiceWorker();

  // Render initial screen
  switchScreen('s02');
});

// Register Service Worker & Handle PWA Install Prompt
let deferredInstallPrompt = null;
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('[Sentinel] Service Worker registered with scope:', reg.scope))
      .catch((err) => console.warn('[Sentinel] Service Worker registration failed:', err));
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    console.log('[Sentinel] Captured beforeinstallprompt event');
    showToast('📲 Tap here to install Sentinel as an App on your phone!');
    const toast = document.getElementById('appToast');
    if (toast) {
      toast.style.cursor = 'pointer';
      toast.onclick = () => {
        if (deferredInstallPrompt) {
          deferredInstallPrompt.prompt();
          deferredInstallPrompt.userChoice.then((choice) => {
            console.log('User install choice:', choice.outcome);
            deferredInstallPrompt = null;
          });
        }
      };
    }
  });
}

// Setup Web Audio API Synthesizer (for zero-asset crisp sounds)
function setupAudioContext() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    state.audioCtx = new AudioContext();
  } catch (e) {
    console.warn('Web Audio API not supported', e);
  }
}

// Sound FX generator
function playSound(type) {
  if (!state.audioCtx) return;
  if (state.audioCtx.state === 'suspended') {
    state.audioCtx.resume();
  }
  
  const ctx = state.audioCtx;
  const now = ctx.currentTime;
  
  if (type === 'click') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  } else if (type === 'ringtone') {
    // Simulated dual-tone telephone ring
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(440, now);
    osc2.frequency.setValueAtTime(480, now);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 1.2);
    gain.gain.linearRampToValueAtTime(0, now + 1.5);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.5);
    osc2.stop(now + 1.5);
  } else if (type === 'alert') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.2);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }
}

// ==========================================
// 2. BACKEND API INTERACTIONS
// ==========================================
async function fetchConfig() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    state.googleMapsKey = data.googleMapsApiKey;
  } catch (err) {
    console.warn('Using default client config', err);
  }
}

async function fetchProfile() {
  try {
    const res = await fetch('/api/profile');
    const data = await res.json();
    state.profile = data;
    renderProfile();
  } catch (err) {
    console.error('Failed to load profile', err);
  }
}

const DEFAULT_GUARDIANS = [
  {
    id: "g0",
    name: "You (Emergency Alert)",
    relation: "Primary Contact",
    subtitle: "Receives instant SMS alert & live GPS link",
    avatar: "ME",
    avatarBg: "var(--accent-primary, #E53935)",
    enabled: true,
    mode: "Instant SMS Alert",
    status: "Online",
    phone: "+1 780-489-2413"
  },
  {
    id: "g1",
    name: "Amma",
    relation: "Primary contact",
    subtitle: "Primary contact · calls first",
    avatar: "AM",
    avatarBg: "var(--amber-gold, #F5A64E)",
    enabled: true,
    mode: "Calls first",
    status: "Online",
    phone: "+91 98201 11223"
  },
  {
    id: "g2",
    name: "Rekha",
    relation: "Roommate",
    subtitle: "Roommate · gets live location",
    avatar: "RK",
    avatarBg: "var(--azure-sky, #38BDF8)",
    enabled: true,
    mode: "Live location",
    status: "Online",
    phone: "+91 98202 33445"
  },
  {
    id: "g3",
    name: "Sanjay (brother)",
    relation: "Brother",
    subtitle: "Notified after 2 min unanswered",
    avatar: "SJ",
    avatarBg: "var(--violet-aura, #A855F7)",
    enabled: true,
    mode: "Delayed",
    status: "Delayed (2m)",
    phone: "+91 98203 55667"
  }
];

async function fetchGuardians() {
  // 1. Try loading from localStorage first for instant display and offline persistence
  const saved = localStorage.getItem('sentinel_guardians');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        state.guardians = parsed;
        renderGuardians();
      }
    } catch (e) {
      console.warn('Failed to parse saved guardians from localStorage', e);
    }
  }

  // 2. Try fetching from backend Express API if connected
  try {
    const res = await fetch('/api/guardians');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        state.guardians = data;
        localStorage.setItem('sentinel_guardians', JSON.stringify(data));
      }
    }
  } catch (err) {
    console.warn('Backend guardians endpoint unreachable, using local storage or defaults', err);
    if (!state.guardians || state.guardians.length === 0) {
      state.guardians = [...DEFAULT_GUARDIANS];
      localStorage.setItem('sentinel_guardians', JSON.stringify(DEFAULT_GUARDIANS));
    }
  }

  if (!state.guardians || state.guardians.length === 0) {
    state.guardians = [...DEFAULT_GUARDIANS];
  }

  renderGuardians();
}

async function fetchReports(type = 'all') {
  try {
    const url = type === 'all' ? '/api/reports' : `/api/reports?type=${type}`;
    const res = await fetch(url);
    const data = await res.json();
    state.reports = data;
    renderReports();
    updateMapMarkers();
  } catch (err) {
    console.error('Failed to load reports', err);
  }
}

async function fetchActiveTrip() {
  try {
    const res = await fetch('/api/trips/active');
    const data = await res.json();
    state.activeTrip = data;
    renderTripInfo();
  } catch (err) {
    console.error('Failed to load trip', err);
  }
}

// ==========================================
// 3. THEME ENGINE (Dropdown Menu + 5 Curated Palettes)
// ==========================================
const THEME_PALETTES = [
  { id: 'crimson', name: 'Crimson', fullName: 'Crimson (Signature)', color: '#E53935' },
  { id: 'sunset', name: 'Sunset', fullName: 'Sunset (Amber & Rose)', color: '#F5A64E' },
  { id: 'emerald', name: 'Emerald', fullName: 'Emerald (Mint Teal)', color: '#10E7B2' },
  { id: 'cyber', name: 'Cyber', fullName: 'Cyber (Neon Violet)', color: '#A855F7' },
  { id: 'light', name: 'Daylight', fullName: 'Daylight (Clean Light)', color: '#2563EB' }
];

function setupThemeEngine() {
  const dropdownWrap = document.getElementById('themeDropdownWrap');
  const dropdownBtn = document.getElementById('themeDropdownBtn');
  const menuItems = document.querySelectorAll('.theme-menu-item');

  // Toggle dropdown on button click
  if (dropdownBtn && dropdownWrap) {
    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownWrap.classList.toggle('open');
      playSound('click');
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!dropdownWrap.contains(e.target)) {
        dropdownWrap.classList.remove('open');
      }
    });
  }

  // Handle dropdown menu item selection
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const theme = item.dataset.theme;
      setTheme(theme);
      if (dropdownWrap) dropdownWrap.classList.remove('open');
      playSound('click');
    });
  });
}

function setTheme(themeName) {
  state.activeTheme = themeName;
  document.documentElement.setAttribute('data-theme', themeName);

  const found = THEME_PALETTES.find(t => t.id === themeName) || THEME_PALETTES[0];

  // Update header dropdown label and active dot
  const labelElem = document.getElementById('themeActiveLabel');
  const dotElem = document.getElementById('themeActiveDot');
  if (labelElem) labelElem.textContent = found.name;
  if (dotElem) dotElem.style.background = found.color;

  // Update dropdown menu items active class
  document.querySelectorAll('.theme-menu-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === themeName);
  });

  // Update In-phone Screen 08 settings row
  const settingsText = document.getElementById('settingsThemeText');
  const settingsDot = document.getElementById('settingsThemeDot');
  if (settingsText) settingsText.textContent = found.name;
  if (settingsDot) settingsDot.style.background = found.color;

  // Re-style map layers if active
  applyMapTheme(themeName);
  showToast(`Palette: ${found.fullName}`);
}

// In-phone quick cycle next theme (callable from Profile settings row)
window.cycleNextTheme = function() {
  const currentIndex = THEME_PALETTES.findIndex(t => t.id === state.activeTheme);
  const nextIndex = (currentIndex + 1) % THEME_PALETTES.length;
  const nextTheme = THEME_PALETTES[nextIndex].id;
  setTheme(nextTheme);
  playSound('click');
};

function getThemeName(code) {
  switch (code) {
    case 'crimson': return 'Sentinel Crimson';
    case 'sunset': return 'Beacon Sunset (Amber & Rose)';
    case 'emerald': return 'Emerald Guardian';
    case 'cyber': return 'Cyber Amethyst';
    case 'light': return 'Daylight High-Contrast';
    default: return code;
  }
}

// ==========================================
// 4. SCREEN NAVIGATION & ROUTING
// ==========================================
function setupNavigation() {
  // 3-Dots More Menu (Outer Top Bar)
  const screensDropdownWrap = document.getElementById('screensDropdownWrap');
  const moreScreensBtn = document.getElementById('moreScreensBtn');
  const inPhoneScreensWrap = document.getElementById('inPhoneScreensWrap');
  const inPhoneMoreScreensBtn = document.getElementById('inPhoneMoreScreensBtn');

  if (moreScreensBtn && screensDropdownWrap) {
    moreScreensBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      screensDropdownWrap.classList.toggle('open');
      if (inPhoneScreensWrap) inPhoneScreensWrap.classList.remove('open');
      playSound('click');
    });

    document.addEventListener('click', (e) => {
      if (!screensDropdownWrap.contains(e.target)) {
        screensDropdownWrap.classList.remove('open');
      }
    });
  }

  // In-Phone 3-Dots Menu (Inside Phone Screen)
  if (inPhoneMoreScreensBtn && inPhoneScreensWrap) {
    inPhoneMoreScreensBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      inPhoneScreensWrap.classList.toggle('open');
      if (screensDropdownWrap) screensDropdownWrap.classList.remove('open');
      playSound('click');
    });

    document.addEventListener('click', (e) => {
      if (!inPhoneScreensWrap.contains(e.target)) {
        inPhoneScreensWrap.classList.remove('open');
      }
    });
  }

  // Handle 3-dots dropdown menu item selection (screens 1-8 across both menus)
  const screenMenuItems = document.querySelectorAll('.screen-menu-item');
  screenMenuItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const screenId = btn.dataset.target;
      switchScreen(screenId);
      if (screensDropdownWrap) screensDropdownWrap.classList.remove('open');
      if (inPhoneScreensWrap) inPhoneScreensWrap.classList.remove('open');
      playSound('click');
    });
  });

  // Legacy / external screen tab buttons
  document.querySelectorAll('.screen-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const screenId = btn.dataset.target;
      switchScreen(screenId);
      playSound('click');
    });
  });

  // Phone bottom navigation tabs
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const screenId = btn.dataset.screen;
      switchScreen(screenId);
      playSound('click');
    });
  });

  // Toggle view between Phone Simulator and 8-Screen Gallery
  const viewToggleBtn = document.getElementById('viewToggleBtn');
  if (viewToggleBtn) {
    viewToggleBtn.addEventListener('click', () => {
      toggleViewMode();
    });
  }

  // Quick Action Tiles
  const btnShareTrip = document.getElementById('btnQuickShareTrip');
  if (btnShareTrip) {
    btnShareTrip.addEventListener('click', () => switchScreen('s03'));
  }

  const btnUnusualView = document.getElementById('btnUnusualView');
  if (btnUnusualView) {
    btnUnusualView.addEventListener('click', () => switchScreen('s06'));
  }

  // Welcome Screen actions
  const btnCreateAcc = document.getElementById('btnCreateAcc');
  if (btnCreateAcc) {
    btnCreateAcc.addEventListener('click', () => switchScreen('s02'));
  }
  const btnAlreadyHave = document.getElementById('btnAlreadyHave');
  if (btnAlreadyHave) {
    btnAlreadyHave.addEventListener('click', () => switchScreen('s02'));
  }

  // Report Here button in screen 06
  const btnReportHere = document.getElementById('btnReportHere');
  if (btnReportHere) {
    btnReportHere.addEventListener('click', () => switchScreen('s07'));
  }

  // Unsafe alert button on trip screen
  const btnTripUnsafe = document.getElementById('btnTripUnsafe');
  if (btnTripUnsafe) {
    btnTripUnsafe.addEventListener('click', () => triggerSos());
  }

  // Filter chips in screen 06
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const filter = chip.dataset.filter;
      state.activeFilter = filter;
      fetchReports(filter);
      playSound('click');
    });
  });

  // Category tags in screen 07
  document.querySelectorAll('.category-tag-btn').forEach(tag => {
    tag.addEventListener('click', () => {
      document.querySelectorAll('.category-tag-btn').forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      playSound('click');
    });
  });
}

function switchScreen(screenId) {
  state.activeScreen = screenId;

  // Deactivate all screen views
  document.querySelectorAll('.screen-view').forEach(s => s.classList.remove('active'));
  
  // Activate selected screen
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
  }

  // Update 3-dots dropdown menu active state
  document.querySelectorAll('.screen-menu-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === screenId);
  });

  // Update top tab bar
  document.querySelectorAll('.screen-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === screenId);
  });

  // Update bottom nav bar
  const navMap = {
    's02': 'home',
    's03': 'map',
    's06': 'map',
    's04': 'circle',
    's08': 'profile'
  };
  const activeNav = navMap[screenId] || '';
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.nav === activeNav);
  });

  // Refresh screens
  if (screenId === 's03') {
    setTimeout(renderTripMap, 150);
    renderWatchersRow();
  } else if (screenId === 's04') {
    renderGuardians();
  } else if (screenId === 's05') {
    renderSosGuardiansList();
  } else if (screenId === 's06') {
    setTimeout(renderCommunityMap, 150);
  }
}

function toggleViewMode() {
  const simulatorWrap = document.getElementById('phoneSimulatorWrap');
  const galleryView = document.getElementById('galleryFlowView');
  const viewToggleBtn = document.getElementById('viewToggleBtn');
  
  if (state.activeView === 'simulator') {
    state.activeView = 'gallery';
    simulatorWrap.style.display = 'none';
    galleryView.classList.add('active');
    viewToggleBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="4"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
      Phone Simulator
    `;
    renderGalleryView();
  } else {
    state.activeView = 'simulator';
    simulatorWrap.style.display = 'flex';
    galleryView.classList.remove('active');
    viewToggleBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
      All 8 Screens Flow
    `;
  }
  playSound('click');
}

// ==========================================
// 5. INTERACTIVE 3-SECOND HOLD SOS BUTTON
// ==========================================
function setupSosHoldButton() {
  const sosWrap = document.getElementById('sosButtonWrap');
  const progressCircle = document.getElementById('sosProgressCircle');
  if (!sosWrap || !progressCircle) return;

  const totalLength = 660; // circumference
  let holdStartTime = 0;
  let animFrame = null;

  function startHold(e) {
    e.preventDefault();
    sosWrap.classList.add('holding');
    holdStartTime = Date.now();
    playSound('alert');

    function checkHold() {
      const elapsed = Date.now() - holdStartTime;
      const progress = Math.min(elapsed / 3000, 1);
      const offset = totalLength - (progress * totalLength);
      progressCircle.style.strokeDashoffset = offset;

      if (progress >= 1) {
        // Complete 3-second hold!
        endHold();
        triggerSos();
      } else {
        animFrame = requestAnimationFrame(checkHold);
      }
    }
    animFrame = requestAnimationFrame(checkHold);
  }

  function endHold() {
    sosWrap.classList.remove('holding');
    if (animFrame) cancelAnimationFrame(animFrame);
    progressCircle.style.strokeDashoffset = totalLength;
  }

  sosWrap.addEventListener('mousedown', startHold);
  sosWrap.addEventListener('touchstart', startHold, { passive: false });
  window.addEventListener('mouseup', endHold);
  window.addEventListener('touchend', endHold);
  window.addEventListener('touchcancel', endHold);

  // Screen 05 Cancel button
  const btnCancelSos = document.getElementById('btnCancelSos');
  if (btnCancelSos) {
    btnCancelSos.addEventListener('click', cancelSos);
  }
}

async function triggerSos() {
  playSound('alert');
  switchScreen('s05');

  // Start 3-second abort countdown
  state.countdownSeconds = 3;
  const numElem = document.getElementById('countdownNumber');
  const pillElem = document.getElementById('countdownTopPill');

  if (numElem) numElem.textContent = '3';
  if (pillElem) pillElem.textContent = 'Sending in 3...';

  // Directly send message to 7804892413 immediately without asking
  sendEmergencySms(state.userAlertNumber || '7804892413');

  // Trigger backend API
  try {
    const res = await fetch('/api/sos/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lat: 12.9716,
        lng: 77.5946,
        reason: 'Hold SOS trigger confirmed'
      })
    });
    const result = await res.json();
    console.log('Emergency broadcast initiated:', result);
  } catch (err) {
    console.error('Failed to report SOS to backend', err);
  }

  if (state.countdownTimer) clearInterval(state.countdownTimer);

  state.countdownTimer = setInterval(() => {
    state.countdownSeconds--;
    if (state.countdownSeconds > 0) {
      if (numElem) numElem.textContent = state.countdownSeconds;
      if (pillElem) pillElem.textContent = `Sending in ${state.countdownSeconds}...`;
      playSound('click');
    } else {
      clearInterval(state.countdownTimer);
      if (numElem) numElem.textContent = '!';
      if (pillElem) pillElem.textContent = 'Alert broadcasted!';
      showToast('Emergency SOS & SMS alert dispatched to 780-489-2413 and your circle!');

      // Auto-call police directly if enabled
      if (state.autoCallPoliceOnSos) {
        setTimeout(() => {
          callPoliceDirectly(state.policeNumber || '100');
        }, 500);
      }
    }
  }, 1000);
}

async function cancelSos() {
  if (state.countdownTimer) clearInterval(state.countdownTimer);
  playSound('click');

  try {
    await fetch('/api/sos/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'User confirmed safe' })
    });
  } catch (err) {
    console.error('Failed to cancel SOS on backend', err);
  }

  showToast('SOS Aborted. "I\'m safe now" status sent to circle.');
  switchScreen('s02');
}

// Direct Police Calling Helper
window.callPoliceDirectly = function(number = '100') {
  playSound('alert');
  showToast(`Dialing Police (${number})...`);
  console.log(`[Emergency Dispatch] Direct police call placed to: ${number}`);
  // Short delay to allow alert audio & toast UI to render before browser initiates tel protocol
  setTimeout(() => {
    window.location.href = `tel:${number}`;
  }, 350);
};

// Emergency Direct SMS Dispatch Helper (Zero Prompts / Don't Ask)
window.sendEmergencySms = function(number = '7804892413', lat = 12.9716, lng = 77.5946) {
  const mapLink = `https://maps.google.com/?q=${lat},${lng}`;
  const rawMessage = `EMERGENCY SOS ALERT! I need immediate help. My current location: ${mapLink}`;
  const message = encodeURIComponent(rawMessage);

  // Directly dispatch to backend API without asking
  fetch('/api/sms/send-direct', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: number, message: rawMessage })
  }).catch(e => console.warn('Direct SMS backend dispatch failed', e));

  showToast(`Direct message sent to ${number}!`);
  console.log(`[Direct SMS] Dispatched immediately to ${number} without asking`);

  // Directly launch device SMS composer without asking
  setTimeout(() => {
    window.location.href = `sms:${number}?body=${message}`;
  }, 200);
};

window.toggleAutoCallSetting = function(enabled) {
  state.autoCallPoliceOnSos = !!enabled;
  showToast(state.autoCallPoliceOnSos ? 'Auto-dial Police on SOS: Enabled' : 'Auto-dial Police on SOS: Disabled');
};

// ==========================================
// 6. FAKE CALL SIMULATOR
// ==========================================
let ringAudioInterval = null;
let callTimerInterval = null;
let callSecondsElapsed = 0;

window.triggerFakeCall = function(delayMs = 1200) {
  if (state.fakeCallTimer) clearTimeout(state.fakeCallTimer);

  // Resume AudioContext on user gesture
  if (state.audioCtx && state.audioCtx.state === 'suspended') {
    state.audioCtx.resume();
  }

  if (delayMs <= 0) {
    showIncomingCallNow();
  } else {
    showToast(`📞 Incoming call from Dad in ${Math.round(delayMs / 1000)}s...`);
    playSound('click');
    state.fakeCallTimer = setTimeout(() => {
      showIncomingCallNow();
    }, delayMs);
  }
};

function showIncomingCallNow() {
  const inPhoneScreen = document.getElementById('inPhoneCallScreen');
  const modalOverlay = document.getElementById('fakeCallModal');
  const incomingActions = document.getElementById('phoneIncomingActions');
  const connectedView = document.getElementById('phoneConnectedView');
  const callStatus = document.getElementById('phoneCallStatus');

  // Reset in-phone screen to ringing state
  if (inPhoneScreen) {
    inPhoneScreen.classList.add('active');
    if (incomingActions) incomingActions.style.display = 'flex';
    if (connectedView) connectedView.style.display = 'none';
    if (callStatus) callStatus.textContent = 'Incoming Call...';
  }

  // Also activate modal overlay if on desktop/gallery
  if (modalOverlay && state.activeView === 'gallery') {
    modalOverlay.classList.add('active');
    const dialogueBox = document.getElementById('callDialogueScript');
    if (dialogueBox) dialogueBox.style.display = 'none';
  }

  // Play telephone ring loop
  playSound('ringtone');
  if (ringAudioInterval) clearInterval(ringAudioInterval);
  ringAudioInterval = setInterval(() => {
    const isRingActive = (inPhoneScreen && inPhoneScreen.classList.contains('active')) ||
                         (modalOverlay && modalOverlay.classList.contains('active'));
    if (isRingActive && incomingActions && incomingActions.style.display !== 'none') {
      playSound('ringtone');
    } else {
      clearInterval(ringAudioInterval);
    }
  }, 2500);
}

function answerCall() {
  if (ringAudioInterval) clearInterval(ringAudioInterval);
  playSound('click');

  const incomingActions = document.getElementById('phoneIncomingActions');
  const connectedView = document.getElementById('phoneConnectedView');
  const callStatus = document.getElementById('phoneCallStatus');
  const timerElem = document.getElementById('phoneCallTimer');
  const dialogueBox = document.getElementById('callDialogueScript');

  if (incomingActions) incomingActions.style.display = 'none';
  if (connectedView) connectedView.style.display = 'flex';
  if (callStatus) callStatus.textContent = 'Connected (00:01)';

  if (dialogueBox) {
    dialogueBox.style.display = 'block';
    dialogueBox.innerHTML = `
      <strong>Connected</strong><br>
      <em>"Hey beta, where are you right now? I'm waiting in the car near the gate, stay on the line until you reach."</em>
    `;
  }

  // Native Web Speech Synthesis - speaks aloud through speakers!
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("Hey Priya! Where are you right now? I'm waiting in the car near the main gate. Stay on the line with me until you reach safely.");
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  // Call duration counter
  callSecondsElapsed = 0;
  if (callTimerInterval) clearInterval(callTimerInterval);
  callTimerInterval = setInterval(() => {
    callSecondsElapsed++;
    const mins = String(Math.floor(callSecondsElapsed / 60)).padStart(2, '0');
    const secs = String(callSecondsElapsed % 60).padStart(2, '0');
    if (timerElem) timerElem.textContent = `${mins}:${secs}`;
    if (callStatus) callStatus.textContent = `Connected (${mins}:${secs})`;
  }, 1000);
}

function hangupCall() {
  if (ringAudioInterval) clearInterval(ringAudioInterval);
  if (callTimerInterval) clearInterval(callTimerInterval);
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  playSound('click');

  const inPhoneScreen = document.getElementById('inPhoneCallScreen');
  const modalOverlay = document.getElementById('fakeCallModal');

  if (inPhoneScreen) inPhoneScreen.classList.remove('active');
  if (modalOverlay) modalOverlay.classList.remove('active');

  showToast('Call ended. Walk safely.');
}

function setupFakeCall() {
  const btnQuickFakeCall = document.getElementById('btnQuickFakeCall');
  const btnPhoneDecline = document.getElementById('btnPhoneDecline');
  const btnPhoneAccept = document.getElementById('btnPhoneAccept');
  const btnPhoneEndCall = document.getElementById('btnPhoneEndCall');

  const btnDecline = document.getElementById('btnCallDecline');
  const btnAccept = document.getElementById('btnCallAccept');

  if (btnQuickFakeCall) {
    btnQuickFakeCall.onclick = () => window.triggerFakeCall(1200);
  }

  // In-Phone buttons
  if (btnPhoneDecline) btnPhoneDecline.onclick = hangupCall;
  if (btnPhoneAccept) btnPhoneAccept.onclick = answerCall;
  if (btnPhoneEndCall) btnPhoneEndCall.onclick = hangupCall;

  // Modal buttons
  if (btnDecline) btnDecline.onclick = hangupCall;
  if (btnAccept) btnAccept.onclick = answerCall;
}

// ==========================================
// 7. GOOGLE MAPS ENGINE & THEMED CANVAS FALLBACK
// ==========================================
function initGoogleMapsEngine() {
  // If user provided a real Google Maps Key, dynamically inject script
  if (state.googleMapsKey && state.googleMapsKey !== '') {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${state.googleMapsKey}&callback=onGoogleMapsReady&libraries=places`;
    script.async = true;
    script.defer = true;
    window.onGoogleMapsReady = () => {
      state.googleMapsLoaded = true;
      console.log('Google Maps JavaScript API loaded successfully');
      renderTripMap();
      renderCommunityMap();
    };
    script.onerror = () => {
      console.warn('Google Maps script failed to load. Falling back to vector map engine.');
      initVectorMapFallback();
    };
    document.head.appendChild(script);
  } else {
    // Zero-config interactive vector canvas map fallback
    initVectorMapFallback();
  }
}

function initVectorMapFallback() {
  state.googleMapsLoaded = false;
  console.log('Rendering interactive themed vector safety maps');
  renderTripMap();
  renderCommunityMap();
}

function getMapThemeStyles(theme) {
  // Google Maps JSON styling definitions per theme
  switch (theme) {
    case 'sunset':
      return [
        { elementType: 'geometry', stylers: [{ color: '#1B1428' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#B4A9CC' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#15111F' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2B1F42' }] },
        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#E85D75' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#110D1A' }] }
      ];
    case 'emerald':
      return [
        { elementType: 'geometry', stylers: [{ color: '#091A16' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#6EE7B7' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#12382F' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#040C0A' }] }
      ];
    case 'cyber':
      return [
        { elementType: 'geometry', stylers: [{ color: '#0C081A' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#C084FC' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#261447' }] },
        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#FF007F' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#040209' }] }
      ];
    case 'light':
      return [
        { elementType: 'geometry', stylers: [{ color: '#F1F5F9' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#CBD5E1' }] }
      ];
    default: // crimson
      return [
        { elementType: 'geometry', stylers: [{ color: '#111622' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1E2738' }] },
        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2B374E' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#090D15' }] }
      ];
  }
}

function applyMapTheme(theme) {
  if (state.googleMapsLoaded) {
    const styles = getMapThemeStyles(theme);
    if (tripMap) tripMap.setOptions({ styles });
    if (communityMap) communityMap.setOptions({ styles });
  } else {
    renderTripMap();
    renderCommunityMap();
  }
}

// Render Screen 03 Trip Map
function renderTripMap() {
  const container = document.getElementById('tripMapContainer');
  if (!container) return;

  if (state.googleMapsLoaded && window.google) {
    const center = { lat: 12.9735, lng: 77.6070 };
    tripMap = new google.maps.Map(container, {
      center,
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: true,
      styles: getMapThemeStyles(state.activeTheme)
    });

    // Draw route polyline
    const routeCoords = [
      { lat: 12.9756, lng: 77.6066 },
      { lat: 12.9745, lng: 77.6080 },
      { lat: 12.9732, lng: 77.6078 },
      { lat: 12.9712, lng: 77.6025 }
    ];
    new google.maps.Polyline({
      path: routeCoords,
      geodesic: true,
      strokeColor: state.activeTheme === 'sunset' ? '#F5A64E' : '#38BDF8',
      strokeOpacity: 0.9,
      strokeWeight: 4,
      map: tripMap
    });

    // User live pin
    new google.maps.Marker({
      position: routeCoords[1],
      map: tripMap,
      title: "Priya (Live)",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#EF4444',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2
      }
    });

    // Destination pin
    new google.maps.Marker({
      position: routeCoords[routeCoords.length - 1],
      map: tripMap,
      title: "Rekha's home"
    });
  } else {
    // Rich SVG Vector Map for instant interactive demo
    const colorPrimary = state.activeTheme === 'sunset' ? '#F5A64E' : '#38BDF8';
    const colorBg = state.activeTheme === 'light' ? '#E2E8F0' : '#141A26';
    const colorRoad = state.activeTheme === 'light' ? '#FFFFFF' : '#212A3E';

    container.innerHTML = `
      <div style="width:100%;height:100%;background:${colorBg};position:relative;overflow:hidden;">
        <svg width="100%" height="100%" viewBox="0 0 320 280" preserveAspectRatio="none">
          <!-- Street Grids -->
          <rect width="320" height="280" fill="${colorBg}"/>
          <line x1="0" y1="70" x2="320" y2="70" stroke="${colorRoad}" stroke-width="18"/>
          <line x1="0" y1="180" x2="320" y2="180" stroke="${colorRoad}" stroke-width="14"/>
          <line x1="80" y1="0" x2="80" y2="280" stroke="${colorRoad}" stroke-width="16"/>
          <line x1="220" y1="0" x2="220" y2="280" stroke="${colorRoad}" stroke-width="18"/>
          
          <!-- Cross streets & avenues -->
          <path d="M40 280 L 120 180 L 180 70 L 260 0" stroke="${colorRoad}" stroke-width="10" fill="none"/>
          
          <!-- Live Active Route Polyline -->
          <path d="M70 240 Q 80 180 140 180 T 220 70" fill="none" stroke="${colorPrimary}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M70 240 Q 80 180 140 180 T 220 70" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="6 6"/>
          
          <!-- Destination Pin -->
          <circle cx="220" cy="70" r="9" fill="#10B981"/>
          <circle cx="220" cy="70" r="4" fill="#FFFFFF"/>
          
          <!-- Origin Pin -->
          <circle cx="70" cy="240" r="7" fill="#64748B"/>
          
          <!-- Live User Tracker Pin with Pulsing Beacon -->
          <circle cx="140" cy="180" r="18" fill="rgba(239, 68, 68, 0.3)">
            <animate attributeName="r" values="12;24;12" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.6;0.1;0.6" dur="2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="140" cy="180" r="8" fill="#EF4444" stroke="#FFFFFF" stroke-width="2"/>
        </svg>
        <div style="position:absolute;top:10px;left:12px;background:rgba(0,0,0,0.65);padding:4px 10px;border-radius:12px;font-size:0.7rem;font-weight:700;color:#FFF;backdrop-filter:blur(6px);">
          📍 MG Road ➔ Brigade Gateway
        </div>
        <div style="position:absolute;bottom:10px;right:12px;background:rgba(0,0,0,0.65);padding:4px 8px;border-radius:8px;font-size:0.65rem;color:#86EFAC;">
          GPS Accuracy: ±3m · Live Tracking
        </div>
      </div>
    `;
  }
}

// Render Screen 06 Community Map
function renderCommunityMap() {
  const container = document.getElementById('communityMapContainer');
  if (!container) return;

  if (state.googleMapsLoaded && window.google) {
    const center = { lat: 12.9735, lng: 77.6070 };
    communityMap = new google.maps.Map(container, {
      center,
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: true,
      styles: getMapThemeStyles(state.activeTheme)
    });
    updateMapMarkers();
  } else {
    // Vector Community Safety Map with Pins
    const colorBg = state.activeTheme === 'light' ? '#E2E8F0' : '#111622';
    const colorRoad = state.activeTheme === 'light' ? '#FFFFFF' : '#1C2433';

    let pinsSvg = '';
    state.reports.forEach((rep, idx) => {
      let pinColor = '#EF4444'; // followed
      if (rep.type === 'lighting') pinColor = '#F59E0B';
      if (rep.type === 'safe_zone') pinColor = '#10B981';

      // Spread pins visually across map
      const x = 50 + (idx * 60) % 240;
      const y = 60 + (idx * 45) % 180;

      pinsSvg += `
        <g style="cursor:pointer;" onclick="showToast('${rep.title.replace(/'/g, "\\'")} - ${rep.location.replace(/'/g, "\\'")}')">
          <circle cx="${x}" cy="${y}" r="12" fill="${pinColor}" opacity="0.25"/>
          <circle cx="${x}" cy="${y}" r="7" fill="${pinColor}" stroke="#FFFFFF" stroke-width="1.5"/>
        </g>
      `;
    });

    container.innerHTML = `
      <div style="width:100%;height:100%;background:${colorBg};position:relative;overflow:hidden;">
        <svg width="100%" height="100%" viewBox="0 0 320 240" preserveAspectRatio="none">
          <rect width="320" height="240" fill="${colorBg}"/>
          <line x1="0" y1="60" x2="320" y2="60" stroke="${colorRoad}" stroke-width="14"/>
          <line x1="0" y1="160" x2="320" y2="160" stroke="${colorRoad}" stroke-width="16"/>
          <line x1="90" y1="0" x2="90" y2="240" stroke="${colorRoad}" stroke-width="14"/>
          <line x1="210" y1="0" x2="210" y2="240" stroke="${colorRoad}" stroke-width="18"/>
          
          <!-- User Location -->
          <circle cx="150" cy="110" r="6" fill="#38BDF8" stroke="#FFFFFF" stroke-width="2"/>
          <circle cx="150" cy="110" r="14" fill="rgba(56, 189, 248, 0.2)"/>
          
          <!-- Incident & Safety Pins -->
          ${pinsSvg}
        </svg>
        <div style="position:absolute;top:8px;left:10px;background:rgba(0,0,0,0.65);padding:3px 8px;border-radius:10px;font-size:0.68rem;color:#FFF;">
          ● 5 safety incidents nearby
        </div>
      </div>
    `;
  }
}

function updateMapMarkers() {
  if (!state.googleMapsLoaded || !communityMap || !window.google) return;
  
  // Clear old markers
  communityMarkers.forEach(m => m.setMap(null));
  communityMarkers = [];

  state.reports.forEach(rep => {
    let color = '#EF4444';
    if (rep.type === 'lighting') color = '#F59E0B';
    if (rep.type === 'safe_zone') color = '#10B981';

    const marker = new google.maps.Marker({
      position: { lat: rep.lat, lng: rep.lng },
      map: communityMap,
      title: rep.title,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2
      }
    });

    const info = new google.maps.InfoWindow({
      content: `<div style="color:#000;padding:4px;"><strong>${rep.title}</strong><br><small>${rep.location}</small></div>`
    });
    marker.addListener('click', () => info.open(communityMap, marker));
    communityMarkers.push(marker);
  });
}

// ==========================================
// 8. DATA RENDERING FUNCTIONS
// ==========================================
function renderProfile() {
  if (!state.profile) return;
  const nameElems = document.querySelectorAll('.user-profile-name');
  nameElems.forEach(el => el.textContent = state.profile.name);

  const phoneElems = document.querySelectorAll('.user-profile-phone');
  phoneElems.forEach(el => el.textContent = state.profile.phone);

  const safeWordQuote = document.getElementById('safeWordQuote');
  if (safeWordQuote) safeWordQuote.textContent = `"${state.profile.safeWord}"`;
}

function renderGuardians() {
  const listContainer = document.getElementById('guardianContactsList');
  if (!listContainer) return;

  listContainer.innerHTML = state.guardians.map(g => {
    const isPrimaryUser = g.id === 'g0';
    const cleanPhone = (g.phone || '').replace(/[^\d+]/g, '');
    const badgeText = g.mode === 'Calls first' ? 'Calls 1st' : (g.mode === 'Delayed' ? 'Delayed 2m' : 'Live GPS');
    const badgeClass = g.mode === 'Delayed' ? 'delayed' : '';

    return `
      <div class="contact-item-card" id="guardianCard-${g.id}">
        <div class="contact-left">
          <div class="contact-avatar" style="background: ${g.avatarBg || '#E53935'}; color: #FFF;">${g.avatar || 'GU'}</div>
          <div>
            <div class="contact-name-title">${escapeHtml(g.name)}</div>
            <div class="contact-subtitle">${escapeHtml(g.subtitle || g.relation || 'Circle Member')}</div>
            ${g.phone ? `
              <div class="contact-phone-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <span>${escapeHtml(g.phone)}</span>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="contact-actions-right">
          <span class="status-chip-badge ${badgeClass}">${badgeText}</span>
          ${g.phone ? `
            <a class="btn-contact-action call" href="tel:${cleanPhone}" title="Call ${escapeHtml(g.name)}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </a>
            <a class="btn-contact-action sms" href="sms:${cleanPhone}?body=${encodeURIComponent('Sentinel Safety Alert check-in')}" title="Message ${escapeHtml(g.name)}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </a>
          ` : ''}
          ${!isPrimaryUser ? `
            <button type="button" class="btn-contact-action delete" onclick="deleteGuardian('${g.id}')" title="Remove from Circle">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Also update watchers row on screen 03 if present
  renderWatchersRow();
  // Also update SOS countdown list on screen 05
  renderSosGuardiansList();
}

function renderWatchersRow() {
  const watchersRow = document.querySelector('.watchers-avatars-row');
  if (!watchersRow) return;

  const avatarsHtml = state.guardians.slice(0, 4).map(g => `
    <div class="contact-avatar" style="background: ${g.avatarBg || '#E53935'}; color:#FFF;" title="${escapeHtml(g.name)}">${g.avatar || 'GU'}</div>
  `).join('');

  watchersRow.innerHTML = avatarsHtml + `
    <div class="contact-avatar avatar-add" onclick="switchScreen('s04')" title="Add contact">+</div>
  `;
}

function renderSosGuardiansList() {
  const list = document.querySelector('.sos-dispatched-list');
  if (!list) return;

  list.innerHTML = state.guardians.map((g, idx) => {
    const isMe = g.id === 'g0';
    return `
      <div class="dispatched-item ${isMe ? 'highlight-recipient' : ''}">
        <span>${isMe ? '📱 ' : ''}${escapeHtml(g.name)} ${g.phone ? `(${escapeHtml(g.phone)})` : ''}</span>
        <span class="dispatched-status ${isMe || idx === 1 ? 'seen' : ''}">
          ${isMe ? '● Alert Dispatched' : (idx === 1 ? '● Seen' : 'Notified · 0:02 ago')}
        </span>
      </div>
    `;
  }).join('');
}

// ==========================================
// 8.1 CIRCLE MEMBER MODAL MANAGEMENT
// ==========================================
window.openAddCircleModal = function() {
  const modal = document.getElementById('addCircleModal');
  if (modal) {
    modal.classList.add('active');
    const nameInput = document.getElementById('memberFullName');
    if (nameInput) {
      setTimeout(() => nameInput.focus(), 150);
    }
  }
};

window.closeAddCircleModal = function() {
  const modal = document.getElementById('addCircleModal');
  if (modal) {
    modal.classList.remove('active');
  }
  const form = document.getElementById('addCircleForm');
  if (form) form.reset();
};

window.handleBackdropClick = function(e) {
  if (e.target && e.target.id === 'addCircleModal') {
    closeAddCircleModal();
  }
};

window.handleAddCircleSubmit = async function(e) {
  e.preventDefault();

  const nameInput = document.getElementById('memberFullName');
  const phoneInput = document.getElementById('memberPhoneNumber');
  const relInput = document.getElementById('memberRelationship');
  const modeInput = document.getElementById('memberAlertMode');

  const name = nameInput ? nameInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const relation = relInput ? relInput.value : 'Friend';
  const mode = modeInput ? modeInput.value : 'Live location';

  if (!name || !phone) {
    showToast('Please enter both name and phone number');
    return;
  }

  // Generate 2-letter initials
  const initials = name.split(' ')
    .filter(Boolean)
    .map(p => p[0].toUpperCase())
    .slice(0, 2)
    .join('') || 'GU';

  // Palette colors for avatars
  const avatarColors = [
    '#E53935', '#F5A64E', '#10B981', '#38BDF8', 
    '#A855F7', '#EC4899', '#3B82F6', '#14B8A6'
  ];
  const chosenColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

  const newGuardian = {
    id: 'g' + Date.now(),
    name,
    relation,
    subtitle: `${relation} · ${mode === 'Calls first' ? 'Calls first' : (mode === 'Delayed' ? 'Delayed 2m' : 'Gets live location')}`,
    avatar: initials,
    avatarBg: chosenColor,
    enabled: true,
    mode,
    status: 'Online',
    phone
  };

  // Add to local state
  state.guardians.push(newGuardian);
  localStorage.setItem('sentinel_guardians', JSON.stringify(state.guardians));

  // Sync to Express backend API if active
  fetch('/api/guardians', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      relation,
      phone,
      mode
    })
  }).catch(err => console.warn('Could not sync to backend /api/guardians (using local data)', err));

  // Update UI immediately
  renderGuardians();
  closeAddCircleModal();
  playSound('click');
  showToast(`✅ Added ${name} (${phone}) to your safety circle!`);
};

window.deleteGuardian = async function(id) {
  const g = state.guardians.find(item => item.id === id);
  const name = g ? g.name : 'contact';

  if (!confirm(`Are you sure you want to remove ${name} from your safety circle?`)) {
    return;
  }

  state.guardians = state.guardians.filter(item => item.id !== id);
  localStorage.setItem('sentinel_guardians', JSON.stringify(state.guardians));

  // Sync delete to backend API if active
  fetch(`/api/guardians/${id}`, { method: 'DELETE' })
    .catch(err => console.warn('Could not sync DELETE to backend', err));

  renderGuardians();
  playSound('click');
  showToast(`Removed ${name} from your circle.`);
};

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderReports() {
  const streamContainer = document.getElementById('reportsStreamList');
  if (!streamContainer) return;

  streamContainer.innerHTML = state.reports.map(rep => {
    let colorClass = 'red';
    if (rep.type === 'lighting') colorClass = 'amber';
    if (rep.type === 'safe_zone') colorClass = 'safe';

    return `
      <div class="report-stream-card" onclick="confirmReport('${rep.id}')">
        <div class="report-indicator-strip ${colorClass}"></div>
        <div class="report-card-content">
          <div class="report-card-title">${rep.title}</div>
          <div class="report-card-meta">${rep.location} · ${rep.timeAgo} · ${rep.confirms} confirms</div>
        </div>
      </div>
    `;
  }).join('');
}

async function confirmReport(reportId) {
  try {
    const res = await fetch(`/api/reports/${reportId}/confirm`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      playSound('click');
      showToast(`Report confirmed (${data.confirms} verifications). Thank you!`);
      const rep = state.reports.find(r => r.id === reportId);
      if (rep) rep.confirms = data.confirms;
      renderReports();
    }
  } catch (err) {
    console.error('Error confirming report', err);
  }
}

function renderTripInfo() {
  if (!state.activeTrip) return;
  const tripMin = document.getElementById('tripRemainingMinutes');
  if (tripMin) tripMin.textContent = `${state.activeTrip.remainingMinutes} min remaining`;
}

// Setup Screen 07 Incident Report Form
function setupReportForm() {
  const btnSaveJournal = document.getElementById('btnSaveJournal');
  const btnSaveAndShare = document.getElementById('btnSaveAndShare');

  if (btnSaveJournal) {
    btnSaveJournal.addEventListener('click', () => submitReport(false));
  }
  if (btnSaveAndShare) {
    btnSaveAndShare.addEventListener('click', () => submitReport(true));
  }

  // Audio recording attachment simulator
  const btnAttachAudio = document.getElementById('btnAttachAudio');
  if (btnAttachAudio) {
    btnAttachAudio.addEventListener('click', () => {
      playSound('click');
      showToast('Audio evidence clip attached (0:42 sec recording).');
    });
  }
}

async function submitReport(shareToCommunity) {
  const locationInput = document.getElementById('incidentLocationInput');
  const notesInput = document.getElementById('incidentNotesInput');
  const activeCategory = document.querySelector('.category-tag-btn.active');

  const location = locationInput ? locationInput.value : 'Brigade Road, near Metro exit 3';
  const notes = notesInput ? notesInput.value : '';
  const kind = activeCategory ? activeCategory.textContent.trim() : 'Followed';

  try {
    const res = await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location,
        kind,
        notes,
        shareToMap: shareToCommunity,
        audioAttachment: 'clip-2026-09-17-01.wav'
      })
    });
    const data = await res.json();
    if (data.success) {
      playSound('click');
      if (shareToCommunity) {
        showToast('Saved to journal & shared anonymously to community map!');
        await fetchReports();
        switchScreen('s06');
      } else {
        showToast('Safely encrypted & saved to your private journal.');
        switchScreen('s02');
      }
    }
  } catch (err) {
    console.error('Failed to submit report', err);
    showToast('Failed to save report. Please check server.');
  }
}

// Toast Notifications
function showToast(msg) {
  let toast = document.getElementById('appToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appToast';
    toast.className = 'toast-msg';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
    <span>${msg}</span>
  `;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

// Hackathon Gallery Flow (renders all 8 screens simultaneously in a responsive grid)
function renderGalleryView() {
  const galleryGrid = document.getElementById('galleryScreensGrid');
  if (!galleryGrid) return;
  // Screens 01 to 08 metadata
  const screens = [
    { id: 's01', num: '01', title: 'Welcome & trust framing', desc: 'First impression sets the tone: calm, private, ready.' },
    { id: 's02', num: '02', title: 'Home dashboard', desc: 'One massive SOS button, held not tapped, so it\'s never triggered by accident.' },
    { id: 's03', num: '03', title: 'Live trip sharing', desc: 'Google Maps route with watcher avatars and instant emergency escalation.' },
    { id: 's04', num: '04', title: 'Trusted circle & safe word', desc: 'Guardians ranked by response speed, plus covert safe-word trigger.' },
    { id: 's05', num: '05', title: 'SOS countdown', desc: 'High-visibility emergency abort countdown with real-time guardian receipt check.' },
    { id: 's06', num: '06', title: 'Community safety map', desc: 'Anonymous crowd-sourced hazard pins: poor lighting, followed reports, safe zones.' },
    { id: 's07', num: '07', title: 'Incident report & journal', desc: 'Encrypted private incident logger with optional anonymous map sharing.' },
    { id: 's08', num: '08', title: 'Profile & safety settings', desc: 'Discreet volume-trigger, auto-recording, and emergency speed dial configuration.' }
  ];

  galleryGrid.innerHTML = screens.map(s => {
    const originalScreen = document.getElementById(s.id);
    const content = originalScreen ? originalScreen.innerHTML : '';
    return `
      <div class="gallery-item-card">
        <div class="gallery-header">
          <div class="gallery-screen-num">${s.num}</div>
          <div class="gallery-screen-title">${s.title}</div>
        </div>
        <div class="gallery-phone-frame">
          <div class="phone-screen" style="overflow-y:auto;">
            <div class="phone-status-bar">
              <span>9:41</span>
              <div class="status-right">
                <span>Wi-Fi 82%</span>
                <div class="battery-icon"><div class="battery-level"></div></div>
              </div>
            </div>
            <div style="padding: 12px 14px 18px; flex: 1;">
              ${content}
            </div>
          </div>
        </div>
        <p class="gallery-desc">${s.desc}</p>
      </div>
    `;
  }).join('');
}
