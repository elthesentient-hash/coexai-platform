const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/coexai',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://coexai-platform-git-main-coexais-projects.vercel.app'],
  credentials: true
}));
app.use(express.json());

// JWT Authentication Middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    
    // Get user from database
    const result = await pool.query(
      'SELECT id, email, full_name, plan, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, plan) 
       VALUES ($1, $2, $3, 'starter') 
       RETURNING id, email, full_name, plan, created_at`,
      [email.toLowerCase(), hashedPassword, fullName || null]
    );

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        plan: user.plan,
        createdAt: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Get user
    const result = await pool.query(
      'SELECT id, email, password_hash, full_name, plan, created_at FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        plan: user.plan,
        createdAt: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  res.json({ user: req.user });
});

// Update profile
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { fullName, plan } = req.body;
    const userId = req.user.id;

    const result = await pool.query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name),
           plan = COALESCE($2, plan),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, email, full_name, plan, created_at`,
      [fullName, plan, userId]
    );

    res.json({
      message: 'Profile updated',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Update failed' });
  }
});

// Join waitlist
app.post('/api/waitlist', async (req, res) => {
  try {
    const { email, source = 'website' } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    // Check if already on waitlist
    const existing = await pool.query(
      'SELECT id FROM waitlist WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      return res.json({ message: 'Already on waitlist', alreadyRegistered: true });
    }

    // Add to waitlist
    await pool.query(
      'INSERT INTO waitlist (email, source) VALUES ($1, $2)',
      [email.toLowerCase(), source]
    );

    res.status(201).json({ message: 'Added to waitlist' });
  } catch (error) {
    console.error('Waitlist error:', error);
    res.status(500).json({ error: 'Failed to join waitlist' });
  }
});

// Get waitlist count (admin only)
app.get('/api/admin/waitlist', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM waitlist'
    );
    
    const recent = await pool.query(
      `SELECT email, source, created_at 
       FROM waitlist 
       ORDER BY created_at DESC 
       LIMIT 10`
    );

    res.json({
      totalCount: parseInt(result.rows[0].count),
      recent: recent.rows
    });
  } catch (error) {
    console.error('Admin error:', error);
    res.status(500).json({ error: 'Failed to fetch waitlist' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CoExAI API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
