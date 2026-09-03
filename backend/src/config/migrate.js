/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

const run = async () => {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Running database migration (schema.sql)...');
  try {
    await pool.query(schemaSql);
    console.log('✔ Schema applied successfully.');
  } catch (err) {
    console.error('✘ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

run();
