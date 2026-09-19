const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('===============================================================');
console.log('       SENTINEL ANDROID APK BUILDER & DOWNLOADER');
console.log('===============================================================');
console.log('1. Connecting to Cloud Android Package Builder...');

const payload = JSON.stringify({
  packageId: 'com.sentinel.safetyapp',
  host: 'https://chatty-taxis-dress.loca.lt',
  name: 'Sentinel Safety',
  launcherName: 'Sentinel',
  themeColor: '#E53935',
  navigationColor: '#080B11',
  backgroundColor: '#080B11',
  startUrl: '/',
  webManifestUrl: 'https://raw.githubusercontent.com/jaskaransinghajmani-cloud/sentinel-safety-app/main/public/manifest.json',
  iconUrl: 'https://raw.githubusercontent.com/jaskaransinghajmani-cloud/sentinel-safety-app/main/public/assets/icon-512.png',
  maskableIconUrl: 'https://raw.githubusercontent.com/jaskaransinghajmani-cloud/sentinel-safety-app/main/public/assets/icon-512.png',
  splashScreenFadeOutDuration: 300,
  signingMode: 'none',
  appVersion: '1.0.0.0',
  appVersionCode: 1,
  display: 'standalone',
  orientation: 'portrait',
  enableNotifications: false,
  enableSiteSettingsShortcut: true,
  fallbackType: 'customtabs',
  features: { locationDelegation: { enabled: true }, playBilling: { enabled: false } },
  includeSourceCode: false
});

const zipPath = path.join(__dirname, 'sentinel-android.zip');
const outputDir = path.join(__dirname, 'sentinel-apk');

const req = https.request('https://pwabuilder-cloudapk.azurewebsites.net/generateAppPackage', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  if (res.statusCode !== 200) {
    let errBody = '';
    res.on('data', c => errBody += c);
    res.on('end', () => {
      console.error(`[ERROR] Builder returned status ${res.statusCode}: ${errBody}`);
      process.exit(1);
    });
    return;
  }

  console.log('2. Downloading Android APK package archive...');
  const fileStream = fs.createWriteStream(zipPath);
  res.pipe(fileStream);

  fileStream.on('finish', () => {
    fileStream.close(() => {
      const stats = fs.statSync(zipPath);
      console.log(`3. Download complete! Package size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

      // Extract using PowerShell Expand-Archive
      console.log('4. Extracting APK files to sentinel-apk folder...');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      try {
        execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${outputDir}' -Force"`, {
          stdio: 'inherit'
        });
        console.log('5. Extraction complete!');
        
        // Locate the APK file
        const findFiles = (dir) => {
          let results = [];
          const list = fs.readdirSync(dir);
          list.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat && stat.isDirectory()) {
              results = results.concat(findFiles(filePath));
            } else if (file.endsWith('.apk') || file.endsWith('.aab')) {
              results.push(filePath);
            }
          });
          return results;
        };

        const binaries = findFiles(outputDir);
        const apkFile = binaries.find(f => f.endsWith('.apk'));
        if (apkFile) {
          const rootApk = path.join(__dirname, 'sentinel.apk');
          fs.copyFileSync(apkFile, rootApk);
          console.log(`👉 Copied to root: ${rootApk}`);
        }

        console.log('===============================================================');
        console.log('SUCCESS! ANDROID APP PACKAGES READY:');
        binaries.forEach(b => {
          const rel = path.relative(__dirname, b);
          const bStat = fs.statSync(b);
          console.log(`👉 ${rel} (${(bStat.size / 1024 / 1024).toFixed(2)} MB)`);
        });
        console.log('===============================================================');
        console.log('To install on your phone:');
        console.log('1. Copy "sentinel.apk" to your Android phone (via USB, Google Drive, or WhatsApp).');
        console.log('2. Tap "sentinel.apk" on your phone to install Sentinel!');
        console.log('===============================================================');
      } catch (extractErr) {
        console.error('Failed to extract zip:', extractErr.message);
      }
    });
  });
});

req.on('error', (err) => {
  console.error('[ERROR] Request failed:', err);
  process.exit(1);
});

req.write(payload);
req.end();
