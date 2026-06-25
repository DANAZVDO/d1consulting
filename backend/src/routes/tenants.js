import { Router } from 'express';

export const tenantsRouter = Router();

/**
 * GET /api/tenants
 * List all tenants (admin only)
 */
tenantsRouter.get('/', (req, res) => {
  const db = req.app.locals.db;
  const tenants = db.prepare('SELECT id, name, slug, plan, is_active, created_at FROM tenants').all();
  res.json({ tenants });
});

/**
 * GET /api/tenants/:id
 * Get tenant details
 */
tenantsRouter.get('/:id', (req, res) => {
  const db = req.app.locals.db;
  const tenant = db.prepare('SELECT id, name, slug, plan, settings, branding, is_active, created_at FROM tenants WHERE id = ?').get(req.params.id);

  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  res.json({ tenant });
});

/**
 * PUT /api/tenants/:id
 * Update tenant settings
 */
tenantsRouter.put('/:id', (req, res) => {
  const db = req.app.locals.db;
  const { name, plan, settings, branding } = req.body;

  const updates = [];
  const params = [];

  if (name) { updates.push('name = ?'); params.push(name); }
  if (plan) { updates.push('plan = ?'); params.push(plan); }
  if (settings) { updates.push('settings = ?'); params.push(JSON.stringify(settings)); }
  if (branding) { updates.push('branding = ?'); params.push(JSON.stringify(branding)); }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push('updated_at = datetime("now")');
  params.push(req.params.id);

  db.prepare(`UPDATE tenants SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const tenant = db.prepare('SELECT id, name, slug, plan, is_active FROM tenants WHERE id = ?').get(req.params.id);
  res.json({ tenant });
});

/**
 * DELETE /api/tenants/:id
 * Deactivate a tenant
 */
tenantsRouter.delete('/:id', (req, res) => {
  const db = req.app.locals.db;
  db.prepare('UPDATE tenants SET is_active = 0, updated_at = datetime("now") WHERE id = ?').run(req.params.id);
  res.json({ message: 'Tenant deactivated' });
});