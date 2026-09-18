# How to Get the Sentinel Android APK

Your project is built with full Progressive Web App (PWA) and Trusted Web Activity (TWA) support. Follow these steps to get your `.apk` file or install it directly onto your Android phone.

---

## Method 1: Generate an Android `.apk` via PWABuilder (Recommended)

[PWABuilder](https://www.pwabuilder.com/) (created by Microsoft & supported by Google) converts your PWA into a downloadable, installable Android APK (`.apk`) and Google Play package (`.aab`) in under 2 minutes.

### Step 1: Start your local server
Open a terminal in `d:\project` and run:
```bash
npm start
```

### Step 2: Open the secure HTTPS public tunnel
In a second terminal window, run:
```bash
npm run tunnel
```
You will receive a public HTTPS link (e.g. `https://sentinel-demo-xxxx.loca.lt`).

### Step 3: Package into an APK
1. Open **[https://www.pwabuilder.com](https://www.pwabuilder.com)** in your web browser.
2. Enter your public HTTPS tunnel URL into the text box and click **Start**.
3. PWABuilder will validate your PWA (manifest, service worker, and icons are already 100% configured).
4. Click **Package for Store** and select **Android**.
5. Click **Generate Package**.
6. Download the generated `.zip` file — inside you will find your installable **`app-release-unsigned.apk`** (or signed debug APK).
7. Copy the `.apk` file to your phone and tap it to install!

---

## Method 2: Direct Install on Android (Zero Download Needed)

You don't even need to wait for an APK to build if you want to test Sentinel immediately on your phone:

1. Run `npm start` and `npm run tunnel`.
2. Open the generated HTTPS URL on your Android phone using **Google Chrome**.
3. Chrome will automatically recognize Sentinel as an installable app:
   - Tap the **"Add Sentinel to Home screen"** or **"Install App"** prompt at the bottom of the screen.
   - Or tap the 3-dot menu (`⋮`) in Chrome and choose **"Install app"**.
4. The Sentinel app will be added directly to your phone's app drawer and home screen with its custom red shield icon, launch screen, and full-screen display (without any browser address bar).
