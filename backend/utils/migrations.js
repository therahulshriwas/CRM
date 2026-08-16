// backend/utils/migrations.js
// Applies checked-in SQL migrations once and records applied filenames.
// Used in: backend/server.js before application models and sockets start.

const fs = require('fs/promises');
const path = require('path');
const { sequelize } = require('../config/db');

async function runMigrations() {
  await sequelize.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name VARCHAR(255) PRIMARY KEY,
    applied_at DATETIME NOT NULL
  )`);

  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();
  const [appliedRows] = await sequelize.query('SELECT name FROM schema_migrations');
  const applied = new Set(appliedRows.map((row) => row.name));

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
    const transaction = await sequelize.transaction();
    try {
      await sequelize.query(sql, { transaction });
      await sequelize.query('INSERT INTO schema_migrations (name, applied_at) VALUES (?, NOW())', {
        replacements: [file],
        transaction,
      });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = runMigrations;
