import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const campaignsRouter = Router();

/**
 * GET /api/campaigns
 * List ad campaigns for the tenant
 */
campaignsRouter.get('/', (req, res) => {
  const db = req.app.locals.db;
  const tenantId = req.tenantId;

  const campaigns = db.prepare(
    'SELECT * FROM ad_campaigns WHERE tenant_id = ? ORDER BY created_at DESC'
  ).all(tenantId);

  res.json({ campaigns });
});

/**
 * POST /api/campaigns
 * Create a new ad campaign
 */
campaignsRouter.post('/', (req, res) => {
  const db = req.app.locals.db;
  const tenantId = req.tenantId;
  const { platform, name, objective, budget, daily_budget, start_date, end_date, target_audience, creative } = req.body;

  const id = uuidv4();
  db.prepare(`
    INSERT INTO ad_campaigns (id, tenant_id, platform, name, objective, budget, daily_budget, start_date, end_date, target_audience, creative)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, tenantId, platform, name, objective || null,
    budget || null, daily_budget || null, start_date || null, end_date || null,
    JSON.stringify(target_audience || {}), JSON.stringify(creative || {})
  );

  const campaign = db.prepare('SELECT * FROM ad_campaigns WHERE id = ?').get(id);
  res.status(201).json({ campaign });
});

/**
 * PUT /api/campaigns/:id
 * Update campaign details
 */
campaignsRouter.put('/:id', (req, res) => {
  const db = req.app.locals.db;
  const { name, objective, budget, daily_budget, status, target_audience, creative } = req.body;

  const updates = [];
  const params = [];

  if (name) { updates.push('name = ?'); params.push(name); }
  if (objective) { updates.push('objective = ?'); params.push(objective); }
  if (budget !== undefined) { updates.push('budget = ?'); params.push(budget); }
  if (daily_budget !== undefined) { updates.push('daily_budget = ?'); params.push(daily_budget); }
  if (status) { updates.push('status = ?'); params.push(status); }
  if (target_audience) { updates.push('target_audience = ?'); params.push(JSON.stringify(target_audience)); }
  if (creative) { updates.push('creative = ?'); params.push(JSON.stringify(creative)); }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push('updated_at = datetime("now")');
  params.push(req.params.id, req.tenantId);

  db.prepare(`UPDATE ad_campaigns SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`).run(...params);

  const campaign = db.prepare('SELECT * FROM ad_campaigns WHERE id = ?').get(req.params.id);
  res.json({ campaign });
});