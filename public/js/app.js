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

async function fetchGuardians() {
  try {
    const res = await fetch('/api/guardians');
    const data = await res.json();
    state.guardians = data;
    renderGuardians();
  } catch (err) {
    console.error('Failed to load guardians', err);
  }
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

  // Refresh maps if opening map screens
  if (screenId === 's03') {
    setTimeout(renderTripMap, 150);
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
      showToast('Emergency SOS dispatched to Amma, Rekha & Sanjay!');
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

  listContainer.innerHTML = state.guardians.map(g => `
    <div class="contact-item-card">
      <div class="contact-left">
        <div class="contact-avatar" style="background: ${g.avatarBg};">${g.avatar}</div>
        <div>
          <div class="contact-name-title">${g.name}</div>
          <div class="contact-subtitle">${g.subtitle}</div>
        </div>
      </div>
      <div>
        <span class="status-chip-badge ${g.mode === 'Delayed' ? 'delayed' : ''}">${g.mode === 'Delayed' ? 'Delayed' : 'On'}</span>
      </div>
    </div>
  `).join('');
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
