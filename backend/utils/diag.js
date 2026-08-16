// backend/utils/diag.js — verify migrations run cleanly after dialectOptions fix.
const { sequelize } = require('../config/db');
const runMigrations = require('./migrations');

async function main() {
  await sequelize.authenticate();
  console.log('dialectOptions.multipleStatements =', sequelize.config.dialectOptions.multipleStatements);
  try {
    await runMigrations();
    console.log('MIGRATIONS OK');
    const [migs] = await sequelize.query('SELECT name FROM schema_migrations ORDER BY name');
    console.log('APPLIED:', migs.map((m) => m.name).join(', '));
  } catch (e) {
    console.error('MIGRATION FAIL:', e.parent?.message || e.message);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error('FATAL', e.message); process.exit(1); });
