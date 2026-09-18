const localtunnel = require('localtunnel');

(async () => {
  console.log('Opening secure HTTPS tunnel for Sentinel on port 3000...');
  try {
    const tunnel = await localtunnel({ port: 3000 });
    console.log('===========================================================');
    console.log('🚀 SECURE HTTPS URL FOR YOUR PHONE:');
    console.log(`👉 ${tunnel.url}`);
    console.log('===========================================================');
    console.log('1. Open this URL on your phone in Chrome / Safari.');
    console.log('2. Chrome will show the green SSL padlock and install prompt!');
    console.log('3. Tap "Install App" or "Add to Home Screen".');
    console.log('===========================================================');

    tunnel.on('close', () => {
      console.log('Tunnel closed.');
    });
  } catch (err) {
    console.error('Failed to open tunnel:', err);
  }
})();
