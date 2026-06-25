import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const contentRouter = Router();

/**
 * GET /api/content/templates
 * List content templates for the tenant
 */
contentRouter.get('/templates', (req, res) => {
  const db = req.app.locals.db;
  const tenantId = req.tenantId;

  const templates = db.prepare(
    'SELECT * FROM content_templates WHERE (tenant_id = ? OR tenant_id = \'__system__\') AND is_active = 1 ORDER BY platform, category'
  ).all(tenantId);

  res.json({ templates });
});

/**
 * POST /api/content/templates
 * Create a new content template
 */
contentRouter.post('/templates', (req, res) => {
  const db = req.app.locals.db;
  const tenantId = req.tenantId;
  const { platform, category, name, prompt_text, variables, tone, max_length } = req.body;

  const id = uuidv4();
  db.prepare(`
    INSERT INTO content_templates (id, tenant_id, platform, category, name, prompt_text, variables, tone, max_length)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, tenantId, platform, category, name, prompt_text, JSON.stringify(variables || []), tone || 'professional', max_length || null);

  const template = db.prepare('SELECT * FROM content_templates WHERE id = ?').get(id);
  res.status(201).json({ template });
});

/**
 * PUT /api/content/templates/:id
 * Update a template
 */
contentRouter.put('/templates/:id', (req, res) => {
  const db = req.app.locals.db;
  const { platform, category, name, prompt_text, tone, max_length, is_active } = req.body;

  const updates = [];
  const params = [];

  if (platform) { updates.push('platform = ?'); params.push(platform); }
  if (category) { updates.push('category = ?'); params.push(category); }
  if (name) { updates.push('name = ?'); params.push(name); }
  if (prompt_text) { updates.push('prompt_text = ?'); params.push(prompt_text); }
  if (tone) { updates.push('tone = ?'); params.push(tone); }
  if (max_length) { updates.push('max_length = ?'); params.push(max_length); }
  if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push('updated_at = datetime("now")');
  params.push(req.params.id, req.tenantId);

  db.prepare(`UPDATE content_templates SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`).run(...params);

  const template = db.prepare('SELECT * FROM content_templates WHERE id = ?').get(req.params.id);
  res.json({ template });
});

/**
 * GET /api/content/calendar
 * List content calendar entries
 * Query: ?status=, ?from=, ?to=
 */
contentRouter.get('/calendar', (req, res) => {
  const db = req.app.locals.db;
  const tenantId = req.tenantId;
  const { status, from, to } = req.query;

  let query = 'SELECT c.*, t.name as template_name, t.platform as template_platform FROM content_calendar c LEFT JOIN content_templates t ON c.template_id = t.id WHERE c.tenant_id = ?';
  const params = [tenantId];

  if (status) {
    query += ' AND c.status = ?';
    params.push(status);
  }
  if (from) {
    query += ' AND c.scheduled_at >= ?';
    params.push(from);
  }
  if (to) {
    query += ' AND c.scheduled_at <= ?';
    params.push(to);
  }

  query += ' ORDER BY c.scheduled_at ASC';

  const entries = db.prepare(query).all(...params);
  res.json({ entries });
});

/**
 * POST /api/content/calendar
 * Schedule a new content entry
 */
contentRouter.post('/calendar', (req, res) => {
  const db = req.app.locals.db;
  const tenantId = req.tenantId;
  const { template_id, scheduled_at, platform } = req.body;

  const id = uuidv4();
  db.prepare(`
    INSERT INTO content_calendar (id, tenant_id, template_id, scheduled_at, platform, status)
    VALUES (?, ?, ?, ?, ?, 'draft')
  `).run(id, tenantId, template_id || null, scheduled_at, platform);

  const entry = db.prepare('SELECT * FROM content_calendar WHERE id = ?').get(id);
  res.status(201).json({ entry });
});

/**
 * PUT /api/content/calendar/:id
 * Update content entry (approve, edit content, etc.)
 */
contentRouter.put('/calendar/:id', (req, res) => {
  const db = req.app.locals.db;
  const { status, final_content, ai_content } = req.body;

  const updates = [];
  const params = [];

  if (status) { updates.push('status = ?'); params.push(status); }
  if (final_content !== undefined) { updates.push('final_content = ?'); params.push(final_content); }
  if (ai_content !== undefined) { updates.push('ai_content = ?'); params.push(ai_content); }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push('updated_at = datetime("now")');
  params.push(req.params.id, req.tenantId);

  db.prepare(`UPDATE content_calendar SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`).run(...params);

  const entry = db.prepare('SELECT * FROM content_calendar WHERE id = ?').get(req.params.id);
  res.json({ entry });
});