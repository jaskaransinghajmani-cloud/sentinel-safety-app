# 🛡️ Sentinel — Women's Safety & Emergency Response Platform

> A full-stack real-time women's safety ecosystem featuring live trip sharing, discreet 3-second hold SOS, community incident heatmaps, simulated fake calls, and trusted guardian circles.

---

## ✨ Features

- **🚨 3-Second Hold SOS Emergency Dispatch**: Prevents accidental triggers while allowing rapid, single-gesture emergency broadcasting.
- **📍 Live Trip Tracking & Check-in Timers**: Share real-time journey progress with trusted contacts, with automated alerts if you don't arrive by your ETA.
- **🗺️ Interactive Safety Map & Hazard Reports**: Real-time crowd-sourced incident warnings (poor lighting, harassment hotspots, safe havens).
- **📞 Fake Call Simulator**: Escape uncomfortable situations with a realistic simulated incoming phone call complete with voice prompts.
- **👥 Trusted Guardian Circle**: Instant notifications, status updates, and priority emergency calling for your closest contacts.
- **🎨 Multi-Theme Engine**: 5 curated themes (Crimson, Sunset, Emerald, Cyber, Daylight).
- **📱 PWA & Android Ready**: Installable directly on any mobile device as a Progressive Web App or packageable as an APK.

---

## 🚀 Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)

### 2. Run the App
Double-click **`start-all.bat`** or run:
```bash
node server.js
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Test on Mobile Phone
Run the public HTTPS tunnel:
```bash
node tunnel.js
```
Open the generated link on your Android or iOS phone in Chrome/Safari, then tap **"Add to Home screen"** or **"Install App"** to install.

---

## 📁 Project Structure

```
├── public/
│   ├── index.html         # 8 interactive screens & simulator view
│   ├── css/style.css      # Design tokens, theme variables, layout
│   ├── js/app.js          # App state, audio engine, API client
│   ├── manifest.json      # PWA & Android manifest
│   ├── sw.js              # Service Worker for offline support
│   └── assets/            # App icons (192x192 & 512x512)
├── server.js              # Express REST API backend
├── tunnel.js              # LocalTunnel HTTPS bridge for mobile testing
├── test-api.js            # Automated backend API test suite
├── start-all.bat          # 1-click launcher for server + tunnel
└── GET_APK.md             # Guide to packaging as Android APK
```

---

## 📄 License
MIT License
