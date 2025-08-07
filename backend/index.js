// Entry point for backend Express server

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import multer from 'multer';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import xlsx from 'xlsx';
import fs from 'fs';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// SQLite setup
const db = new sqlite3.Database('./pharmacy.db', (err) => {
  if (err) console.error('DB connection error:', err);
  else console.log('Connected to SQLite database.');
});

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Register endpoint
app.post('/api/register', async (req, res) => {
  const { username, password, pharmacy_code } = req.body;
  if (!username || !password || !pharmacy_code) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  db.get('SELECT id FROM users WHERE username = ?', [username], async (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    if (row) return res.status(400).json({ error: 'Username already exists.' });
    const hash = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (username, password, pharmacy_code) VALUES (?, ?, ?)', [username, hash, pharmacy_code], function (err) {
      if (err) return res.status(500).json({ error: 'Registration failed.' });
      res.json({ success: true, username });
    });
  });
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    if (!user) return res.status(400).json({ error: 'Invalid credentials.' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials.' });
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.json({ token, username: user.username });
  });
});

// File upload endpoint
app.post('/api/upload', verifyToken, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
    // Add upload timestamp
    const timestamp = new Date().toISOString();

    // Prepare statements for insert and update
    const insertStmt = db.prepare(
      'INSERT INTO inventory (user_id, ndc, drug_name, quantity_ordered, dosage, manufacturer, wholesaler, upload_timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    
    const updateStmt = db.prepare(
      'UPDATE inventory SET drug_name = ?, quantity_ordered = ?, dosage = ?, manufacturer = ?, upload_timestamp = ? WHERE user_id = ? AND ndc = ? AND wholesaler = ?'
    );

    let updated = 0;
    let inserted = 0;

    for (const row of data) {
      // Check if NDC exists for this user with the same wholesaler
      const existing = await new Promise((resolve) => {
        db.get(
          'SELECT id FROM inventory WHERE user_id = ? AND ndc = ? AND wholesaler = ?',
          [req.user.id, row.NDC, row.Wholesaler],
          (err, row) => resolve(row)
        );
      });

      if (existing) {
        // Update existing record
        updateStmt.run([
          row['Drug Name'],
          row['Quantity Ordered'],
          row['Dosage/Concentration'],
          row.Manufacturer,
          timestamp,
          req.user.id,
          row.NDC,
          row.Wholesaler
        ]);
        updated++;
      } else {
        // Insert new record
        insertStmt.run([
          req.user.id,
          row.NDC,
          row['Drug Name'],
          row['Quantity Ordered'],
          row['Dosage/Concentration'],
          row.Manufacturer,
          row.Wholesaler,
          timestamp
        ]);
        inserted++;
      }
    }
    
    insertStmt.finalize();
    updateStmt.finalize();
    fs.unlinkSync(req.file.path);
    res.json({ 
      success: true, 
      updated,
      inserted,
      timestamp 
    });
  } catch (err) {
    console.error('Upload error:', err);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// Get inventory endpoint
app.get('/api/inventory', verifyToken, (req, res) => {
  db.all('SELECT * FROM inventory WHERE user_id = ?', [req.user.id], (err, rows) => {
    if (err) {
      console.error('Inventory fetch error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Update disposition endpoint
app.post('/api/disposition', verifyToken, (req, res) => {
  const { inventoryId, quantity } = req.body;
  if (!inventoryId || quantity === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // First verify the inventory item exists and belongs to the user
  db.get(
    'SELECT quantity_ordered FROM inventory WHERE id = ? AND user_id = ?',
    [inventoryId, req.user.id],
    (err, row) => {
      if (err) {
        console.error('Disposition verification error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }

      // Only validate for negative quantities
      if (quantity < 0) {
        return res.status(400).json({ error: 'Disposition quantity cannot be negative' });
      }

      // Update the disposition
      db.run(
        'UPDATE inventory SET quantity_disposed = ? WHERE id = ? AND user_id = ?',
        [quantity, inventoryId, req.user.id],
        function(err) {
          if (err) {
            console.error('Disposition update error:', err);
            return res.status(500).json({ error: 'Failed to update disposition' });
          }
          res.json({ 
            success: true,
            inventoryId,
            quantity,
            message: 'Disposition updated successfully'
          });
        }
      );
    }
  );
});

// Get report endpoint
app.get('/api/report', verifyToken, (req, res) => {
  db.all(
    `SELECT 
      id, ndc, drug_name, manufacturer, wholesaler,
      quantity_ordered, quantity_disposed,
      CASE 
        WHEN quantity_disposed > quantity_ordered THEN 'over-disposed'
        ELSE 'normal'
      END as status
    FROM inventory 
    WHERE user_id = ? 
    ORDER BY manufacturer, drug_name`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        console.error('Report generation error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});
