// backend/config/db.js
// Configures and establishes the connection to the MySQL database using Sequelize ORM.
// Used in: backend/server.js and database model setups.

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'crm_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    // The migration runner executes multi-statement .sql files; the rest of the
    // app uses parameterized Sequelize queries, so this is safe.
    // Must live under dialectOptions: Sequelize only forwards driver options
    // from there (a top-level `multipleStatements` key is silently dropped).
    dialectOptions: {
      multipleStatements: true,
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      underscored: true,
      timestamps: true,
    },
  }
);

// Verifies database connectivity
async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
}

module.exports = { sequelize, connectDB };
