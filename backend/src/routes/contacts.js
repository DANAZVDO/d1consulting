import { Router } from 'express';

export const contactsRouter = Router();

/**
 * GET /api/contacts
 * List contacts for the current tenant
 * Query: ?status=, ?search=, ?page=&limit=
 */
contactsRouter.get('/', (req, res) => {
  const db = req.app.locals.db;
  const tenantId = req.tenantId;
  const { status, search, page = 1, limit = 20 } = req.query;

  if (!tenantId) {
    return res.status(401).json({ error: 'Tenant context required' });
  }

  let query = 'SELECT * FROM leads WHERE tenant_id = ?';
  const params = [tenantId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (search) {
    query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  const contacts = db.prepare(query).all(...params);

  // Count total
  let countQuery = 'SELECT COUNT(*) as total FROM leads WHERE tenant_id = ?';
  const countParams = [tenantId];
  if (status) {
    countQuery += ' AND status = ?';
    countParams.push(status);
  }
  const { total } = db.prepare(countQuery).get(...countParams);

  res.json({
    contacts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

/**
 * GET /api/contacts/:id
 * Get a single contact with full details
 */
contactsRouter.get('/:id', (req, res) => {
  const db = req.app.locals.db;
  const contact = db.prepare('SELECT * FROM leads WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenantId);

  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  res.json({ contact });
});

/**
 * PUT /api/contacts/:id/score
 * Update lead score
 */
contactsRouter.put('/:id/score', (req, res) => {
  const db = req.app.locals.db;
  const { score, status } = req.body;
  const tenantId = req.tenantId;

  const updates = [];
  const params = [];

  if (score !== undefined) {
    updates.push('score = ?');
    params.push(Math.max(0, Math.min(100, score)));
  }
  if (status) {
    updates.push('status = ?');
    params.push(status);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push('updated_at = datetime("now")');
  params.push(req.params.id, tenantId);

  db.prepare(`UPDATE leads SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`).run(...params);

  const contact = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  res.json({ contact });
});