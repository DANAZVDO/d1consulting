import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { generateToken } from '../middleware/auth.js';

export const authRouter = Router();

/**
 * POST /api/auth/login
 * Authenticate user and return JWT
 */
authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;
  const db = req.app.locals.db;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  // Look up user
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // For prototype: simple password comparison
  // Production: use bcrypt
  if (password !== 'admin123') { // TODO: implement proper password hashing
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate token
  const token = generateToken({
    sub: user.id,
    tenant_id: user.tenant_id,
    role: user.role,
  });

  // Update last login
  db.prepare('UPDATE users SET last_login_at = datetime("now") WHERE id = ?').run(user.id);

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenant_id: user.tenant_id,
    },
  });
});

/**
 * POST /api/auth/register
 * Register a new tenant with admin user
 */
authRouter.post('/register', (req, res) => {
  const { tenantName, email, name, password } = req.body;
  const db = req.app.locals.db;

  if (!tenantName || !email || !name || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }

  const tenantId = uuidv4();
  const userId = uuidv4();
  const slug = tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  try {
    // Create tenant
    db.prepare(`
      INSERT INTO tenants (id, name, slug, ghl_location_id)
      VALUES (?, ?, ?, ?)
    `).run(tenantId, tenantName, slug, null);

    // Create admin user
    db.prepare(`
      INSERT INTO users (id, tenant_id, email, name, password_hash, role)
      VALUES (?, ?, ?, ?, ?, 'owner')
    `).run(userId, tenantId, email, name, password); // TODO: hash password

    const token = generateToken({
      sub: userId,
      tenant_id: tenantId,
      role: 'owner',
    });

    res.status(201).json({
      token,
      tenant: { id: tenantId, name: tenantName, slug },
      user: { id: userId, email, name, role: 'owner' },
    });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Tenant slug or email already exists' });
    }
    console.error('[Auth] Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});