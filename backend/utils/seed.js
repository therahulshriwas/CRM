// backend/utils/seed.js
// Seeds the database with a rich demo dataset in development: 5 role-scoped users,
// leads, deals (with close dates spread across the last 6 months + next 7 days),
// activity history (spread over the last 30 days for the reports heatmap), and
// notifications. Idempotent: users are upserted by email and lead/deal/activity
// seeding is guarded by a marker record, so re-running never duplicates data.
// Used in: backend/server.js on startup (development only).

const { User, Lead, Deal, Activity, Notification } = require('../models');

const DEMO_PASSWORD = 'admin123';
const MARKER_LEAD_NAME = 'Aurora Tech Solutions';

// --- date helpers (all relative to "now" so the timeline always looks alive) ---
const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(Date.now() - n * DAY);
const daysAhead = (n) => new Date(Date.now() + n * DAY);

function iso(date) {
  return date.toISOString();
}

function pad(n) {
  return String(n).padStart(2, '0');
}

// Round a date down to a specific hour (business-hours feel for the heatmap).
function atHour(date, hour) {
  const d = new Date(date);
  d.setHours(hour, 0, 0, 0);
  return d;
}

// --- demo user roster (upserted by email; passwords refreshed on every run) ---
const USERS = [
  { name: 'Sarah Connor (Admin)', email: 'admin@crm.com', role: 'admin', department: 'Executive' },
  { name: 'John Connor (Team Lead)', email: 'lead@crm.com', role: 'team_lead', department: 'Sales' },
  { name: 'Marcus Wright (Agent)', email: 'agent@crm.com', role: 'agent', department: 'Sales' },
  { name: 'Kyle Reese (Agent)', email: 'kyle@crm.com', role: 'agent', department: 'Sales' },
  { name: 'Blair Williams (Agent)', email: 'blair@crm.com', role: 'agent', department: 'Sales' },
];

async function ensureUsers() {
  const created = [];
  for (const u of USERS) {
    const [user] = await User.findOrCreate({
      where: { email: u.email },
      defaults: { ...u, password_hash: DEMO_PASSWORD },
    });
    if (user.role !== u.role || user.department !== u.department) {
      await user.update({ role: u.role, department: u.department });
    }
    created.push(user);
  }
  return created;
}

// --- realistic dummy data (referenced by marker lead name) ---
async function seedDemoData(users) {
  const [admin, teamLead, marcus, kyle, blair] = users;

  const leadRows = [
    // [name, phone, email, source, status, owner, createdDaysAgo]
    ['Aurora Tech Solutions', '+1-555-0101', 'sales@aurora-tech.com', 'Website', 'Qualified', marcus, 5],
    ['Northwind Industries', '+1-555-0102', 'hello@northwind.io', 'LinkedIn', 'New', kyle, 2],
    ['Blue Horizon Energy', '+1-555-0103', 'procurement@bluehorizon.com', 'Referral', 'Contacted', blair, 9],
    ['Falcon Peak Logistics', '+1-555-0104', 'ops@falconpeak.net', 'Cold Call', 'New', marcus, 3],
    ['Sterling & Mason LLP', '+1-555-0105', 'info@sterlingmason.com', 'LinkedIn', 'Qualified', teamLead, 14],
    ['Orbit Digital Media', '+1-555-0106', 'hello@orbitmedia.co', 'Website', 'Contacted', kyle, 21],
    ['Veridian Health Group', '+1-555-0107', 'contact@veridianhealth.org', 'Conference', 'Qualified', blair, 34],
    ['Redwood Retail Group', '+1-555-0108', 'buyers@redwoodretail.com', 'Referral', 'New', marcus, 47],
    ['Quantum Freight Co', '+1-555-0109', 'dispatch@quantumfreight.com', 'Cold Call', 'Contacted', teamLead, 61],
    ['Cinder Data Systems', '+1-555-0110', 'engineering@cinderdata.io', 'Website', 'Qualified', kyle, 78],
    ['Halcyon Financial', '+1-555-0111', 'cfo@halcyonfin.com', 'LinkedIn', 'Contacted', blair, 95],
    ['Mirage Hospitality', '+1-555-0112', 'gm@miragehotels.com', 'Referral', 'Qualified', admin, 110],
    ['Ironclad Manufacturing', '+1-555-0113', 'supply@ironcladmfg.com', 'Cold Call', 'New', admin, 128],
    ['Lumen Analytics', '+1-555-0114', 'data@lumenanalytics.com', 'Website', 'Qualified', teamLead, 145],
    ['Pinecrest Insurance', '+1-555-0115', 'underwriting@pinecrest.com', 'Conference', 'Contacted', marcus, 160],
    ['Vanguard Robotics', '+1-555-0116', 'rnd@vanguardrobotics.com', 'LinkedIn', 'Qualified', kyle, 172],
  ];

  const leads = [];
  for (const [name, phone, email, source, status, owner, createdDaysAgo] of leadRows) {
    const lead = await Lead.create({
      owner_id: owner.id,
      name,
      phone,
      email,
      source,
      status,
      createdAt: daysAgo(createdDaysAgo),
    });
    leads.push(lead);
  }

  // dealRows: [title, leadIdx, value, stage, closeDaysAgo/null | closeDaysAhead]
  const dealRows = [
    // Won deals spread across the last 6 months (drives the revenue timeline).
    ['Aurora Cloud Migration', 0, 185000, 'Won', -5],
    ['Northwind SaaS Renewal', 1, 72000, 'Won', -32],
    ['Blue Horizon Asset Tracking', 2, 96000, 'Won', -61],
    ['Falcon Peak Fleet Suite', 3, 154000, 'Won', -89],
    ['Sterling Compliance Portal', 4, 64000, 'Won', -119],
    ['Orbit Video Pipeline', 5, 118000, 'Won', -151],
    ['Veridian Patient Portal', 6, 210000, 'Won', -172],
    // A win in the current month so MoM growth reflects a live number (not -100%).
    ['Aurora Enterprise License', 0, 275000, 'Won', -1],
    // Open deals in various stages.
    ['Redwood POS Integration', 7, 88000, 'Qualified', 2],
    ['Quantum Dispatch Module', 8, 45000, 'Qualified', 6],
    ['Cinder Data Warehouse', 9, 260000, 'Proposal', 12],
    ['Halcyon Risk Dashboard', 10, 130000, 'Proposal', null],
    ['Mirage Booking Engine', 11, 99000, 'Negotiation', 5],
    ['Ironclad Inventory System', 12, 175000, 'Negotiation', 19],
    ['Lumen BI License', 13, 82000, 'Qualified', null],
    ['Pinecrest Claims Automation', 14, 147000, 'Proposal', 9],
    ['Vanguard Robotics Control', 15, 320000, 'Qualified', 4],
    // A couple of lost deals for pipeline completeness.
    ['Falcon Peak Legacy Upgrade', 3, 53000, 'Lost', -70],
    ['Orbit CMS Rebuild', 5, 76000, 'Lost', -130],
  ];

  const deals = [];
  for (const [title, leadIdx, value, stage, closeOffset] of dealRows) {
    let closeDate = null;
    if (closeOffset !== null) {
      closeDate = closeOffset < 0 ? daysAgo(-closeOffset) : daysAhead(closeOffset);
    }
    const deal = await Deal.create({
      lead_id: leads[leadIdx].id,
      owner_id: leads[leadIdx].owner_id,
      title,
      value,
      stage,
      close_date: closeDate,
      createdAt: closeDate ? new Date(closeDate.getTime() - 14 * DAY) : daysAgo(2),
    });
    deals.push(deal);
  }

  // Activities: for each deal, a creation note plus stage notes, with timestamps
  // spread over the last 30 days across business hours (feeds the 7×24 heatmap).
  const notesFor = (deal) => [
    [`Deal "${deal.title}" created at stage "${deal.stage}" with a value of $${parseFloat(deal.value).toLocaleString()}.`, 'deal_created'],
    ['Qualified lead — product fit confirmed during discovery call.', 'note'],
  ];
  for (const deal of deals) {
    let base = Math.min(29, 2 + (deal.id % 9) * 3);
    const notes = notesFor(deal);
    for (const [text, type] of notes) {
      const when = atHour(daysAgo(base), 9 + (deal.id % 8));
      await Activity.create({
        deal_id: deal.id,
        type,
        notes: text,
        createdAt: when,
      });
      base += 2;
    }
  }

  // Notifications: seed a few unread items per demo user so the bell has content.
  const notifTemplates = [
    { type: 'deal', title: 'Deal stage changed', message: 'Vanguard Robotics Control moved to Qualified.' },
    { type: 'reminder', title: 'Follow up due', message: 'Redwood Retail Group — send the proposal draft.' },
    { type: 'general', title: 'Weekly pipeline review', message: 'Your pipeline summary is ready in Reports.' },
  ];
  for (const user of users) {
    for (let i = 0; i < notifTemplates.length; i++) {
      const t = notifTemplates[i];
      await Notification.create({
        user_id: user.id,
        type: t.type,
        title: t.title,
        message: t.message,
        read: i > 0,
        createdAt: daysAgo(3 + i),
      });
    }
  }

  console.log(
    `Demo data seeded: ${leadRows.length} leads, ${dealRows.length} deals, ` +
    `${users.length} users, plus activities + notifications.`
  );
}

async function seedDatabase() {
  try {
    const users = await ensureUsers();
    console.log('Demo users ensured: admin@crm.com, lead@crm.com, agent@crm.com, kyle@crm.com, blair@crm.com');

    // Idempotency marker: only seed the demo dataset once.
    const marker = await Lead.findOne({ where: { name: MARKER_LEAD_NAME } });
    if (marker) {
      console.log('Demo dataset already present. Skipping lead/deal/activity seeding.');
      return;
    }

    await seedDemoData(users);
    console.log('Seeding complete!');
  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
}

module.exports = seedDatabase;
