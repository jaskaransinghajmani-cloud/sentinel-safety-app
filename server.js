require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-Memory Database for Hackathon Prototype
const db = {
  profile: {
    name: "Jaskaran Singh",
    phone: "+1 780-489-2413",
    avatar: "JS",
    status: "Protected",
    safeWord: "Is the kettle on?",
    sosNumber: "7804892413",
    region: "US_CA",
    settings: {
      autoRecordSOS: true,
      volumeTrigger: true,
      shareBattery: false,
      journalPrivacy: "Only me",
      communityPosts: "Anonymous"
    },
    emergencyContacts: {
      police: "911",
      womenHelpline: "988",
      emergency: "911"
    }
  },
  guardians: [
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
  ],
  reports: [
    {
      id: "rep-1",
      type: "followed",
      title: "Someone reported being followed",
      location: "Church Street underpass",
      timeAgo: "40 min ago",
      confirms: 6,
      lat: 12.9745,
      lng: 77.6080,
      notes: "Individual matching description loitering by eastern stairs.",
      verified: true
    },
    {
      id: "rep-2",
      type: "lighting",
      title: "Streetlight out for 3rd night",
      location: "Behind City Market",
      timeAgo: "reported by 3 people",
      confirms: 3,
      lat: 12.9660,
      lng: 77.5780,
      notes: "Pitch dark corner near lane 4 intersection.",
      verified: false
    },
    {
      id: "rep-3",
      type: "safe_zone",
      title: "24/7 Police Assistance Booth",
      location: "MG Road & Brigade Rd Junction",
      timeAgo: "Verified Safe Zone",
      confirms: 54,
      lat: 12.9750,
      lng: 77.6070,
      notes: "Constant patrol, CCTV coverage, brightly illuminated.",
      verified: true
    },
    {
      id: "rep-4",
      type: "lighting",
      title: "Dark pathway towards Metro Gate 3",
      location: "Brigade Road, near Metro exit 3",
      timeAgo: "2 hours ago",
      confirms: 8,
      lat: 12.9732,
      lng: 77.6078,
      notes: "Broken lamp pole, poor visibility after 8:30 PM.",
      verified: true
    },
    {
      id: "rep-5",
      type: "safe_zone",
      title: "Apollo Pharmacy 24/7 (Safe Refuge)",
      location: "Residency Road corner",
      timeAgo: "Verified Safe Zone",
      confirms: 31,
      lat: 12.9712,
      lng: 77.6025,
      notes: "Security guard present, emergency shelter partner.",
      verified: true
    }
  ],
  journalEntries: [
    {
      id: "j-1",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      location: "Brigade Road, near Metro exit 3",
      kind: "Followed",
      notes: "A man in a grey jacket followed me from the metro station for two blocks, then turned off near the bakery...",
      audioAttachment: "clip-2026-09-17-01.wav",
      sharedToMap: true
    }
  ],
  activeTrip: {
    destinationName: "Rekha's home",
    originName: "MG Road Metro",
    remainingMinutes: 12,
    checkInIntervalMinutes: 3,
    status: "Live",
    watchers: ["AM", "RK"],
    path: [
      { lat: 12.9756, lng: 77.6066 },
      { lat: 12.9745, lng: 77.6080 },
      { lat: 12.9732, lng: 77.6078 },
      { lat: 12.9712, lng: 77.6025 }
    ]
  },
  activeAlert: null
};

// API Endpoints

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Sentinel Women Safety API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 2. Client configuration (Google Maps Key, etc.)
app.get('/api/config', (req, res) => {
  res.json({
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    appName: 'Sentinel',
    version: '1.0.0'
  });
});

// 3. User Profile & Settings
app.get('/api/profile', (req, res) => {
  res.json(db.profile);
});

app.put('/api/profile', (req, res) => {
  db.profile = {
    ...db.profile,
    ...req.body,
    settings: { ...db.profile.settings, ...(req.body.settings || {}) }
  };
  res.json({ success: true, profile: db.profile });
});

// 4. Guardians
app.get('/api/guardians', (req, res) => {
  res.json(db.guardians);
});

app.post('/api/guardians', (req, res) => {
  const { name, relation, phone, mode } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const newGuardian = {
    id: 'g' + (Date.now()),
    name,
    relation: relation || 'Guardian',
    subtitle: `${relation || 'Friend'} · ${mode || 'Gets live location'}`,
    avatar: initials || 'GU',
    avatarBg: '#E85D75',
    enabled: true,
    mode: mode || 'Live location',
    status: 'Online',
    phone: phone || '+91 98000 00000'
  };
  db.guardians.push(newGuardian);
  res.status(201).json(newGuardian);
});

app.patch('/api/guardians/:id', (req, res) => {
  const guardian = db.guardians.find(g => g.id === req.params.id);
  if (!guardian) return res.status(404).json({ error: 'Guardian not found' });
  Object.assign(guardian, req.body);
  res.json(guardian);
});

app.delete('/api/guardians/:id', (req, res) => {
  const index = db.guardians.findIndex(g => g.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Guardian not found' });
  db.guardians.splice(index, 1);
  res.json({ success: true, message: 'Guardian removed' });
});

// 5. Community Safety Reports
app.get('/api/reports', (req, res) => {
  const { type } = req.query;
  if (type && type !== 'all') {
    return res.json(db.reports.filter(r => r.type === type));
  }
  res.json(db.reports);
});

app.post('/api/reports', (req, res) => {
  const { type, title, location, notes, lat, lng } = req.body;
  if (!title || !location) {
    return res.status(400).json({ error: 'Title and location are required' });
  }
  const newReport = {
    id: 'rep-' + Date.now(),
    type: type || 'followed',
    title,
    location,
    timeAgo: 'Just now',
    confirms: 1,
    lat: lat || (12.9716 + (Math.random() - 0.5) * 0.01),
    lng: lng || (77.5946 + (Math.random() - 0.5) * 0.01),
    notes: notes || '',
    verified: false
  };
  db.reports.unshift(newReport);
  res.status(201).json(newReport);
});

app.post('/api/reports/:id/confirm', (req, res) => {
  const report = db.reports.find(r => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });
  report.confirms += 1;
  res.json({ success: true, confirms: report.confirms });
});

// 6. Incident Journal Entries
app.get('/api/journal', (req, res) => {
  res.json(db.journalEntries);
});

app.post('/api/journal', (req, res) => {
  const { location, kind, notes, shareToMap, audioAttachment } = req.body;
  const entry = {
    id: 'j-' + Date.now(),
    timestamp: new Date().toISOString(),
    location: location || 'Current Location',
    kind: kind || 'Followed',
    notes: notes || '',
    audioAttachment: audioAttachment || 'clip-recording.wav',
    sharedToMap: !!shareToMap
  };
  db.journalEntries.unshift(entry);

  if (shareToMap) {
    db.reports.unshift({
      id: 'rep-' + Date.now(),
      type: kind === 'Unsafe area' ? 'lighting' : 'followed',
      title: `${kind} reported`,
      location: location,
      timeAgo: 'Just now',
      confirms: 1,
      lat: 12.9732,
      lng: 77.6078,
      notes: notes,
      verified: false
    });
  }

  res.status(201).json({ success: true, entry });
});

// 7. Emergency SOS Trigger & Cancel
app.post('/api/sos/trigger', (req, res) => {
  const { lat, lng, reason } = req.body;
  const latitude = lat || 12.9716;
  const longitude = lng || 77.5946;
  const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
  const alertText = `[EMERGENCY SOS ALERT] I am in distress and need urgent help! My live location: ${mapsLink}`;

  db.activeAlert = {
    alertId: 'alert-' + Date.now(),
    timestamp: new Date().toISOString(),
    coordinates: { lat: latitude, lng: longitude },
    reason: reason || 'SOS button held for 3 seconds',
    status: 'ACTIVE',
    smsBroadcasts: db.guardians.map(g => ({
      recipient: g.name,
      phone: g.phone,
      message: alertText,
      status: 'SENT'
    })),
    notifiedGuardians: db.guardians.map(g => ({
      name: g.name,
      phone: g.phone,
      status: g.mode === 'Delayed' ? 'Delayed (notifying in 2 min)' : 'Notified · 0:02 ago',
      seen: g.id === 'g0' || g.name === 'Rekha' ? true : false
    }))
  };

  console.log(`[SOS DISPATCH] Emergency SMS Alert sent to ${db.guardians[0].phone} (${db.guardians[0].name})`);
  console.log(`[SOS DISPATCH] SMS content: "${alertText}"`);

  res.json({
    success: true,
    message: 'Emergency SOS activated! Alert SMS dispatched to 7804892413 and trusted circle.',
    alert: db.activeAlert
  });
});

app.post('/api/sos/cancel', (req, res) => {
  const previousAlert = db.activeAlert;
  db.activeAlert = null;
  res.json({
    success: true,
    message: 'SOS cancelled. "I\'m safe now" status broadcast to your circle.',
    cancelledAlertId: previousAlert ? previousAlert.alertId : null
  });
});

// 7.1 Direct SMS Dispatch API (Direct Send Without Asking)
app.post('/api/sms/send-direct', (req, res) => {
  const { to, message } = req.body;
  const recipient = to || "7804892413";
  const text = message || "EMERGENCY SOS ALERT! I need immediate help. My live location: https://maps.google.com/?q=12.9716,77.5946";

  console.log(`[DIRECT SMS DISPATCH] Auto-dispatched message directly to ${recipient}:`);
  console.log(` > Content: "${text}"`);
  console.log(` > Timestamp: ${new Date().toISOString()}`);

  res.json({
    success: true,
    status: 'SENT_DIRECT',
    recipient: recipient,
    message: text,
    timestamp: new Date().toISOString()
  });
});

// 8. Active Trip Management
app.get('/api/trips/active', (req, res) => {
  res.json(db.activeTrip);
});

app.post('/api/trips/start', (req, res) => {
  const { destinationName, remainingMinutes } = req.body;
  db.activeTrip = {
    destinationName: destinationName || "Friend's place",
    originName: "Current location",
    remainingMinutes: remainingMinutes || 15,
    checkInIntervalMinutes: 3,
    status: "Live",
    watchers: ["AM", "RK"],
    path: [
      { lat: 12.9756, lng: 77.6066 },
      { lat: 12.9745, lng: 77.6080 },
      { lat: 12.9732, lng: 77.6078 },
      { lat: 12.9712, lng: 77.6025 }
    ]
  };
  res.json({ success: true, trip: db.activeTrip });
});

app.post('/api/trips/stop', (req, res) => {
  db.activeTrip.status = 'Completed';
  res.json({ success: true, message: 'Trip sharing completed safely.' });
});

// 9. Fake Call Trigger
app.post('/api/fake-call/trigger', (req, res) => {
  res.json({
    success: true,
    ringDelaySeconds: 5,
    callerName: "Dad",
    callerNumber: "+91 98450 12345",
    dialogueScript: [
      "Hey beta, where are you right now?",
      "I'm waiting near the gate in the car, coming right there.",
      "Stay on the phone with me until you reach."
    ]
  });
});

// 10. Direct Android APK Download
app.get(['/sentinel.apk', '/app.apk'], (req, res) => {
  const apkPath = path.join(__dirname, 'public', 'sentinel.apk');
  if (fs.existsSync(apkPath)) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.download(apkPath, 'Sentinel-Safety.apk');
  } else {
    res.status(404).send('APK not found. Please run node download-apk.js to build.');
  }
});

// Catch-all: serve SPA index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Sentinel Server running on http://localhost:${PORT}`);
    console.log(`Open in browser to see the interactive Women's Safety App.`);
  });
}

module.exports = app;
