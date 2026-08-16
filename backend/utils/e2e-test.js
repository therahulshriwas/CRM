// backend/utils/e2e-test.js — full auth flow verification against a running server.
const BASE = 'http://localhost:5001/api';

function makeClient() {
  let cookie = '';
  return {
    async req(method, path, { body, token } = {}) {
      const headers = { 'Content-Type': 'application/json' };
      if (cookie) headers['Cookie'] = cookie;
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        redirect: 'manual',
      });
      const setCookie = res.headers.get('set-cookie');
      if (setCookie) {
        const c = setCookie.split(';')[0];
        const name = c.split('=')[0];
        if (name === 'refreshToken') {
          const val = c.split('=').slice(1).join('=');
          cookie = `refreshToken=${val}`;
        }
      }
      let data = null;
      try { data = await res.json(); } catch {}
      return { status: res.status, data };
    },
    get cookie() { return cookie; },
    clearCookie() { cookie = ''; },
  };
}

let pass = 0, fail = 0;
function check(label, cond, extra) {
  if (cond) { pass++; console.log(`  PASS  ${label}`); }
  else { fail++; console.log(`  FAIL  ${label}${extra ? `  → ${JSON.stringify(extra)}` : ''}`); }
}

// Dev-mode mail fallback logs the OTP to stdout, which is redirected to the server log file.
// Reads the most recent 6-digit OTP for the given recipient from that log.
function readOtpFromLog(recipient) {
  const logPath = 'C:/Users/Admin/AppData/Local/Temp/opencode/backend-5001.log';
  const fs = require('fs');
  if (!fs.existsSync(logPath)) return null;
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n').reverse();
  for (const line of lines) {
    if (line.includes('To: ' + recipient)) {
      const match = content.slice(content.lastIndexOf('[MAIL DEV MODE] Body:'))
        .match(/reset code is:\s*(\d{6})/);
      return match ? match[1] : null;
    }
  }
  return null;
}

async function main() {
  const suffix = Date.now().toString().slice(-6);
  const email = `e2e${suffix}@test.com`;

  console.log('\n== HEALTH ==');
  const h = await fetch('http://localhost:5001/health');
  check('health 200', h.status === 200);

  console.log('\n== REGISTER ==');
  const c1 = makeClient();
  const reg = await c1.req('POST', '/auth/register', {
    body: { name: 'E2E User', email, password: 'pass1234', phone: '+1000', department: 'Sales', company: 'TestCo' },
  });
  check('register 201', reg.status === 201, reg.data);
  check('register returns accessToken', !!reg.data?.accessToken);
  check('register defaults to agent role', reg.data?.user?.role === 'agent', reg.data?.user?.role);
  check('register phone persisted', reg.data?.user?.phone === '+1000', reg.data?.user?.phone);
  check('register department persisted', reg.data?.user?.department === 'Sales', reg.data?.user?.department);
  check('register company persisted', reg.data?.user?.company === 'TestCo', reg.data?.user?.company);
  check('register does NOT leak password_hash', !reg.data?.user?.password_hash, reg.data?.user);

  const dup = await c1.req('POST', '/auth/register', { body: { name: 'Dup', email, password: 'pass1234' } });
  check('duplicate email → 400', dup.status === 400, dup.data);

  const badRole = await makeClient().req('POST', '/auth/register', { body: { name: 'Bad', email: `bad${suffix}@test.com`, password: 'pass1234', role: 'superadmin' } });
  check('invalid role value → 400', badRole.status === 400, badRole.data);

  const escalate = await makeClient().req('POST', '/auth/register', { body: { name: 'Esc', email: `esc${suffix}@test.com`, password: 'pass1234', role: 'admin' } });
  check('role admin rejected on self-register → 400', escalate.status === 400, escalate.data);

  console.log('\n== LOGIN ==');
  const c2 = makeClient();
  const login = await c2.req('POST', '/auth/login', { body: { email, password: 'pass1234' } });
  check('login 200', login.status === 200, login.data);
  const access1 = login.data?.accessToken;
  check('login accessToken present', !!access1);
  check('login refresh cookie set', c2.cookie.startsWith('refreshToken='), c2.cookie);
  check('login last_login_at set', !!login.data?.user?.last_login_at);

  console.log('\n== ME (profile) ==');
  const me = await c2.req('GET', '/auth/me', { token: access1 });
  check('me 200', me.status === 200, me.data);
  check('me has profile fields', me.data?.user && me.data.user.name && me.data.user.email && me.data.user.role !== undefined, me.data?.user);
  check('me does NOT leak password_hash', me.data?.user?.password_hash === undefined, Object.keys(me.data?.user || {}));

  console.log('\n== REFRESH (rotation) ==');
  const oldCookie = c2.cookie;
  const ref1 = await c2.req('POST', '/auth/refresh');
  check('refresh 200', ref1.status === 200, ref1.data);
  check('refresh new accessToken', !!ref1.data?.accessToken);
  check('refresh rotated cookie (changed)', c2.cookie !== oldCookie, { oldCookie, newCookie: c2.cookie });

  console.log('\n== ROLE-BASED / RBAC ==');
  const agentLeads = await c2.req('GET', '/leads?limit=5', { token: access1 });
  check('agent can list leads', agentLeads.status === 200, agentLeads.data);
  const adminList = await c2.req('GET', '/users/admin', { token: access1 });
  check('agent blocked from admin users (403)', adminList.status === 403, adminList.data);

  console.log('\n== ADMIN (seeded) ==');
  const ca = makeClient();
  const adminLogin = await ca.req('POST', '/auth/login', { body: { email: 'admin@crm.com', password: 'admin123' } });
  check('seeded admin login 200', adminLogin.status === 200, adminLogin.data);
  const adminToken = adminLogin.data?.accessToken;
  const adminUsers = await ca.req('GET', '/users/admin', { token: adminToken });
  check('admin lists users', adminUsers.status === 200 && Array.isArray(adminUsers.data?.users), adminUsers.data);
  check('admin user list no password_hash', adminUsers.data?.users?.every((u) => u.password_hash === undefined), adminUsers.data?.users?.[0] && Object.keys(adminUsers.data.users[0]));

  console.log('\n== PROFILE UPDATE ==');
  const upd = await c2.req('PUT', '/users/me', {
    token: access1,
    body: { name: 'E2E Updated', phone: '+1999', department: 'Support', bio: 'Hello from e2e' },
  });
  check('profile update 200', upd.status === 200, upd.data);
  check('profile update name persisted', upd.data?.user?.name === 'E2E Updated', upd.data?.user?.name);
  check('profile update phone persisted', upd.data?.user?.phone === '+1999', upd.data?.user?.phone);
  check('profile update dept persisted', upd.data?.user?.department === 'Support', upd.data?.user?.department);
  check('profile update bio persisted', upd.data?.user?.bio === 'Hello from e2e', upd.data?.user?.bio);

  console.log('\n== ADMIN: CREATE USER + ROLE ASSIGNMENT + SUSPEND ==');
  const adminCreate = await ca.req('POST', '/users/admin', {
    token: adminToken,
    body: { name: 'Provisioned Manager', email: `mgr${suffix}@test.com`, password: 'mgr1234', role: 'team_lead' },
  });
  check('admin creates team_lead 201', adminCreate.status === 201, adminCreate.data);
  check('created role = team_lead', adminCreate.data?.user?.role === 'team_lead', adminCreate.data?.user?.role);
  const createdId = adminCreate.data?.user?.id;

  const roleChange = await ca.req('PUT', `/users/admin/${createdId}/role`, {
    token: adminToken,
    body: { role: 'agent' },
  });
  check('admin role change 200', roleChange.status === 200, roleChange.data);
  check('role changed to agent', roleChange.data?.user?.role === 'agent', roleChange.data?.user?.role);

  const suspend = await ca.req('PUT', `/users/admin/${createdId}/status`, {
    token: adminToken,
    body: { status: 'suspended' },
  });
  check('admin suspend 200', suspend.status === 200, suspend.data);
  check('status = suspended', suspend.data?.user?.status === 'suspended', suspend.data?.user?.status);

  const suspendedLogin = await makeClient().req('POST', '/auth/login', { body: { email: `mgr${suffix}@test.com`, password: 'mgr1234' } });
  check('suspended user login blocked 403', suspendedLogin.status === 403, suspendedLogin.data);

  const reactivate = await ca.req('PUT', `/users/admin/${createdId}/status`, {
    token: adminToken,
    body: { status: 'active' },
  });
  check('admin reactivate 200', reactivate.status === 200, reactivate.data);

  console.log('\n== CHANGE PASSWORD ==');
  const cpWrong = await c2.req('POST', '/auth/change-password', {
    token: access1,
    body: { currentPassword: 'wrongpass', newPassword: 'Newpass123' },
  });
  check('wrong current password → 400', cpWrong.status === 400, cpWrong.data);

  const cpOk = await c2.req('POST', '/auth/change-password', {
    token: access1,
    body: { currentPassword: 'pass1234', newPassword: 'Newpass123' },
  });
  check('change password 200', cpOk.status === 200, cpOk.data);

  const cpWeak = await c2.req('POST', '/auth/change-password', {
    token: access1,
    body: { currentPassword: 'Newpass123', newPassword: 'short' },
  });
  check('weak new password → 400', cpWeak.status === 400, cpWeak.data);

  const loginOldPass = await makeClient().req('POST', '/auth/login', { body: { email, password: 'pass1234' } });
  check('old password rejected after change (401)', loginOldPass.status === 401, loginOldPass.data);

  const loginNewPass = await makeClient().req('POST', '/auth/login', { body: { email, password: 'Newpass123' } });
  check('new password login 200', loginNewPass.status === 200, loginNewPass.data);

  console.log('\n== FORGOT / RESET PASSWORD ==');
  const forgot = await makeClient().req('POST', '/auth/forgot-password', { body: { email } });
  check('forgot-password generic 200', forgot.status === 200 && forgot.data?.message?.includes('OTP'), forgot.data);
  const forgotMissing = await makeClient().req('POST', '/auth/forgot-password', { body: {} });
  check('forgot-password missing email → 400', forgotMissing.status === 400, forgotMissing.data);

  const otp = readOtpFromLog(email);
  check('OTP captured from dev mail log', !!otp, otp);

  const resetWrong = await makeClient().req('POST', '/auth/reset-password', {
    body: { email, otp: '000000', password: 'Resetpass123' },
  });
  check('wrong OTP → 400', resetWrong.status === 400, resetWrong.data);

  const resetOk = await makeClient().req('POST', '/auth/reset-password', {
    body: { email, otp, password: 'Resetpass123' },
  });
  check('reset-password 200 with valid OTP', resetOk.status === 200, resetOk.data);

  const loginAfterReset = await makeClient().req('POST', '/auth/login', { body: { email, password: 'Resetpass123' } });
  check('login after reset 200', loginAfterReset.status === 200, loginAfterReset.data);
  const loginOldPass2 = await makeClient().req('POST', '/auth/login', { body: { email, password: 'Newpass123' } });
  check('pre-reset password rejected after reset (401)', loginOldPass2.status === 401, loginOldPass2.data);

  console.log('\n== LOGOUT ==');
  const c3 = makeClient();
  await c3.req('POST', '/auth/login', { body: { email, password: 'pass1234' } });
  const out = await c3.req('POST', '/auth/logout');
  check('logout 200', out.status === 200, out.data);
  const refAfterLogout = await c3.req('POST', '/auth/refresh');
  check('refresh after logout → 401', refAfterLogout.status === 401, refAfterLogout.data);

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error('TEST HARNESS ERROR:', e); process.exit(1); });
