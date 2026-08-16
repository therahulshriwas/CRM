const http = require('http');

const BASE = 'http://localhost:5001/api';

function doRequest(method, path, body, token) {
  const data = body ? JSON.stringify(body) : null;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  return new Promise((resolve, reject) => {
    const req = http.request(`${BASE}${path}`, { method, headers }, (res) => {
      let chunks = '';
      res.on('data', (chunk) => chunks += chunk);
      res.on('end', () => {
        try {
          const parsed = chunks ? JSON.parse(chunks) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: chunks });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  // Login
  let res = await doRequest('POST', '/auth/login', { email: 'agent@crm.com', password: 'agent123' });
  const token = res.data.accessToken;
  console.log('Login status:', res.status);

  console.log('\n=== Rapid fire 25 requests ===');
  for (let i = 1; i <= 25; i++) {
    res = await doRequest('POST', '/ai/assistant', { message: `Test ${i}` }, token);
    console.log(`Request ${i}: status=${res.status}, retry-after=${res.headers['retry-after'] || 'none'}`);
    if (res.status === 429) {
      console.log('Rate limited! Message:', res.data.message);
      break;
    }
  }

  console.log('\n=== Check if limiter is mounted ===');
  // Use a fresh user
  res = await doRequest('POST', '/auth/login', { email: 'lead@crm.com', password: 'lead123' });
  const leadToken = res.data.accessToken;
  console.log('Team lead login:', res.status);

  // Send 5 quick requests
  for (let i = 1; i <= 5; i++) {
    res = await doRequest('POST', '/ai/assistant', { message: `test${i}` }, leadToken);
    console.log(`Lead request ${i}: status=${res.status}`);
  }
  console.log('All requests processed. If rate limiter works, the 21st request from same user should get 429.');
}

main().catch(err => {
  console.error('Error:', err.message);
});
