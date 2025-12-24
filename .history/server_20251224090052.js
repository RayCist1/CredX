const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'credx_secret_key_change_in_production';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('.'));

// Route for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialize SQLite database
const dbPath = path.join(__dirname, 'credx.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Error creating users table:', err);
  });

  // Cards table
  db.run(`CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    card_number TEXT NOT NULL,
    card_name TEXT NOT NULL,
    card_month TEXT NOT NULL,
    card_year TEXT NOT NULL,
    card_bg TEXT,
    card_type TEXT DEFAULT 'visa',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) console.error('Error creating cards table:', err);
  });

  // Wallet balance table
  db.run(`CREATE TABLE IF NOT EXISTS wallet_balance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    balance REAL DEFAULT 5254.50,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) console.error('Error creating wallet_balance table:', err);
  });

  // Transactions table
  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    purpose TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    status TEXT DEFAULT 'Done' CHECK(status IN ('Done', 'Pending')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) console.error('Error creating transactions table:', err);
  });

  // Wallet stats table
  db.run(`CREATE TABLE IF NOT EXISTS wallet_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    income REAL DEFAULT 2430,
    spent REAL DEFAULT 1120,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) console.error('Error creating wallet_stats table:', err);
  });

  // Insert default user if not exists
  db.get('SELECT * FROM users WHERE username = ?', ['CredX'], (err, row) => {
    if (!row) {
      const hashedPassword = bcrypt.hashSync('credxteam', 10);
      db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', 
        ['CredX', 'credxteam@gmail.com', hashedPassword], (err) => {
          if (err) console.error('Error inserting default user:', err);
          else console.log('Default user created');
        });
    }
  });
}

// JWT Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// ==================== AUTHENTICATION ROUTES ====================

// Register new user
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Validate email format
  if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid Gmail address' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint')) {
            return res.status(409).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        const userId = this.lastID;
        const token = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '7d' });

        // Initialize wallet balance and stats for new user
        db.run('INSERT INTO wallet_balance (user_id, balance) VALUES (?, ?)', [userId, 5254.50]);
        db.run('INSERT INTO wallet_stats (user_id, income, spent) VALUES (?, ?, ?)', [userId, 2430, 1120]);

        res.json({
          success: true,
          token,
          user: { id: userId, username, email }
        });
      });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    try {
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        success: true,
        token,
        user: { id: user.id, username: user.username, email: user.email }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
});

// Verify token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

// ==================== CARD ROUTES ====================

// Get user's card
app.get('/api/cards', authenticateToken, (req, res) => {
  db.get('SELECT * FROM cards WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
    [req.user.id],
    (err, card) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!card) {
        return res.json({ success: true, card: null });
      }
      // Mask card number
      const maskedNumber = card.card_number.replace(/\d(?=\d{4})/g, '*');
      res.json({
        success: true,
        card: {
          ...card,
          card_number: maskedNumber
        }
      });
    });
});

// Create/Update card
app.post('/api/cards', authenticateToken, (req, res) => {
  const { cardNumber, cardName, cardMonth, cardYear, cardBg, cardType } = req.body;

  if (!cardNumber || !cardName || !cardMonth || !cardYear) {
    return res.status(400).json({ error: 'All card fields are required' });
  }

  // Check if user already has a card
  db.get('SELECT id FROM cards WHERE user_id = ?', [req.user.id], (err, existingCard) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (existingCard) {
      // Update existing card
      db.run(`UPDATE cards SET 
        card_number = ?, card_name = ?, card_month = ?, card_year = ?, 
        card_bg = ?, card_type = ?
        WHERE user_id = ?`,
        [cardNumber, cardName, cardMonth, cardYear, cardBg || null, cardType || 'visa', req.user.id],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.json({ success: true, message: 'Card updated successfully' });
        });
    } else {
      // Create new card
      db.run(`INSERT INTO cards (user_id, card_number, card_name, card_month, card_year, card_bg, card_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, cardNumber, cardName, cardMonth, cardYear, cardBg || null, cardType || 'visa'],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.json({ success: true, message: 'Card created successfully' });
        });
    }
  });
});

// Delete card
app.delete('/api/cards', authenticateToken, (req, res) => {
  db.run('DELETE FROM cards WHERE user_id = ?', [req.user.id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true, message: 'Card deleted successfully' });
  });
});

// ==================== WALLET ROUTES ====================

// Get wallet balance
app.get('/api/wallet/balance', authenticateToken, (req, res) => {
  db.get('SELECT balance FROM wallet_balance WHERE user_id = ?', [req.user.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    const balance = row ? row.balance : 5254.50;
    res.json({ success: true, balance });
  });
});

// Update wallet balance
app.put('/api/wallet/balance', authenticateToken, (req, res) => {
  const { balance } = req.body;

  if (typeof balance !== 'number') {
    return res.status(400).json({ error: 'Invalid balance value' });
  }

  db.run(`INSERT INTO wallet_balance (user_id, balance) VALUES (?, ?)
    ON CONFLICT(user_id) DO UPDATE SET balance = ?, updated_at = CURRENT_TIMESTAMP`,
    [req.user.id, balance, balance],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true, balance });
    });
});

// Get transactions
app.get('/api/wallet/transactions', authenticateToken, (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const type = req.query.type; // 'income', 'expense', or undefined for all

  let query = 'SELECT * FROM transactions WHERE user_id = ?';
  const params = [req.user.id];

  if (type && (type === 'income' || type === 'expense')) {
    query += ' AND type = ?';
    params.push(type);
  }

  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  db.all(query, params, (err, transactions) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true, transactions });
  });
});

// Add transaction
app.post('/api/wallet/transactions', authenticateToken, (req, res) => {
  const { purpose, amount, type, status } = req.body;

  if (!purpose || typeof amount !== 'number' || !type) {
    return res.status(400).json({ error: 'Invalid transaction data' });
  }

  if (type !== 'income' && type !== 'expense') {
    return res.status(400).json({ error: 'Type must be income or expense' });
  }

  db.run(`INSERT INTO transactions (user_id, purpose, amount, type, status)
    VALUES (?, ?, ?, ?, ?)`,
    [req.user.id, purpose, amount, type, status || 'Done'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Update wallet stats
      if (type === 'income') {
        db.run(`INSERT INTO wallet_stats (user_id, income) VALUES (?, ?)
          ON CONFLICT(user_id) DO UPDATE SET income = income + ?`,
          [req.user.id, amount, amount]);
      } else {
        db.run(`INSERT INTO wallet_stats (user_id, spent) VALUES (?, ?)
          ON CONFLICT(user_id) DO UPDATE SET spent = spent + ABS(?)`,
          [req.user.id, Math.abs(amount), Math.abs(amount)]);
      }

      res.json({
        success: true,
        transaction: {
          id: this.lastID,
          purpose,
          amount,
          type,
          status: status || 'Done'
        }
      });
    });
});

// Get wallet stats
app.get('/api/wallet/stats', authenticateToken, (req, res) => {
  db.get('SELECT income, spent FROM wallet_stats WHERE user_id = ?', [req.user.id], (err, stats) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({
      success: true,
      stats: stats || { income: 2430, spent: 1120 }
    });
  });
});

// ==================== SERVER START ====================

app.listen(PORT, () => {
  console.log(`CredX Backend Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});

