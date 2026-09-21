const http = require('http');

// Helper to make HTTP requests
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Sentinel Backend REST API Verification ---');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // 1. Health check
  await test('GET /api/health returns 200 OK and status ok', async () => {
    const res = await request('GET', '/api/health');
    if (res.status !== 200 || res.data.status !== 'ok') {
      throw new Error(`Expected status 200 and ok, got ${res.status}: ${JSON.stringify(res.data)}`);
    }
  });

  // 2. Profile
  await test('GET /api/profile returns Jaskaran Singh and safe word', async () => {
    const res = await request('GET', '/api/profile');
    if (res.status !== 200 || res.data.name !== 'Jaskaran Singh' || !res.data.safeWord) {
      throw new Error(`Unexpected profile data: ${JSON.stringify(res.data)}`);
    }
  });

  // 3. Guardians
  await test('GET /api/guardians returns trusted contacts list', async () => {
    const res = await request('GET', '/api/guardians');
    if (res.status !== 200 || !Array.isArray(res.data) || res.data.length < 3) {
      throw new Error(`Expected at least 3 guardians, got: ${JSON.stringify(res.data)}`);
    }
  });

  await test('POST /api/guardians adds a new contact', async () => {
    const res = await request('POST', '/api/guardians', {
      name: 'Dr. Anita',
      relation: 'Mentor',
      phone: '+91 98200 99887',
      mode: 'Live location'
    });
    if (res.status !== 201 || res.data.name !== 'Dr. Anita') {
      throw new Error(`Failed to create guardian: ${JSON.stringify(res.data)}`);
    }
  });

  // 4. Reports
  await test('GET /api/reports returns community hazard reports', async () => {
    const res = await request('GET', '/api/reports');
    if (res.status !== 200 || !Array.isArray(res.data)) {
      throw new Error(`Invalid reports response: ${JSON.stringify(res.data)}`);
    }
  });

  await test('POST /api/reports creates a new community incident report', async () => {
    const res = await request('POST', '/api/reports', {
      type: 'lighting',
      title: 'Broken lamp post behind cafe',
      location: '100ft Road Indiranagar',
      notes: 'Area completely unlit'
    });
    if (res.status !== 201 || !res.data.id) {
      throw new Error(`Failed to add report: ${JSON.stringify(res.data)}`);
    }
  });

  // 5. Emergency SOS
  await test('POST /api/sos/trigger initiates emergency alert broadcast', async () => {
    const res = await request('POST', '/api/sos/trigger', {
      lat: 12.9716,
      lng: 77.5946,
      reason: 'Automated test SOS'
    });
    if (res.status !== 200 || !res.data.success || !res.data.alert) {
      throw new Error(`SOS trigger failed: ${JSON.stringify(res.data)}`);
    }
  });

  await test('POST /api/sos/cancel sends safe status to circle', async () => {
    const res = await request('POST', '/api/sos/cancel', {
      reason: 'User safe confirmed'
    });
    if (res.status !== 200 || !res.data.success) {
      throw new Error(`SOS cancellation failed: ${JSON.stringify(res.data)}`);
    }
  });

  // 6. Fake call trigger
  await test('POST /api/fake-call/trigger schedules call simulation', async () => {
    const res = await request('POST', '/api/fake-call/trigger');
    if (res.status !== 200 || res.data.ringDelaySeconds !== 5) {
      throw new Error(`Fake call API failed: ${JSON.stringify(res.data)}`);
    }
  });

  // 7. Circle Emergency SMS Dispatch
  await test('POST /api/sms/send-circle sends batch emergency SMS to all circle members', async () => {
    const sampleCircle = [
      { id: 'g1', name: 'Amma', phone: '+91 98201 11223' },
      { id: 'g2', name: 'Rekha', phone: '+91 98202 33445' }
    ];
    const res = await request('POST', '/api/sms/send-circle', {
      circle: sampleCircle,
      message: 'EMERGENCY SOS ALERT! Test message',
      lat: 12.9716,
      lng: 77.5946
    });
    if (res.status !== 200 || !res.data.success || res.data.count !== 2) {
      throw new Error(`Circle SMS dispatch failed: ${JSON.stringify(res.data)}`);
    }
  });

  await test('POST /api/sms/send-direct sends emergency SMS to single number', async () => {
    const res = await request('POST', '/api/sms/send-direct', {
      to: '112',
      message: 'Police emergency test dispatch'
    });
    if (res.status !== 200 || !res.data.success || res.data.status !== 'SENT_DIRECT') {
      throw new Error(`Direct SMS dispatch failed: ${JSON.stringify(res.data)}`);
    }
  });

  console.log('----------------------------------------------------');
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('All backend endpoints successfully verified!');
    process.exit(0);
  }
}

// Start temporary server if needed, or connect to already running server
const net = require('net');
const client = new net.Socket();

client.connect(3000, '127.0.0.1', () => {
  client.destroy();
  runTests();
});

client.on('error', () => {
  console.log('Starting internal Express server for testing...');
  const app = require('./server.js');
  const server = app.listen(3000, '127.0.0.1', () => {
    runTests();
  });
});
