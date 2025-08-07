// SQLite DB schema for pharmacy inventory app
// Run this script to initialize the database
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./pharmacy.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    pharmacy_code TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ndc TEXT NOT NULL,
    drug_name TEXT NOT NULL,
    quantity_ordered INTEGER NOT NULL,
    quantity_disposed INTEGER DEFAULT 0,
    dosage TEXT,
    manufacturer TEXT,
    wholesaler TEXT NOT NULL,
    upload_timestamp TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS disposition (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_id INTEGER NOT NULL,
    quantity_disposed INTEGER NOT NULL,
    wholesaler TEXT,
    FOREIGN KEY(inventory_id) REFERENCES inventory(id)
  )`);

  console.log('Database initialized.');
  db.close();
});
