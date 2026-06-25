import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const webhookRouter = Router();

/**
 * POST /api/webhooks/whatsapp
 * Receive incoming WhatsApp messages from Meta Cloud API
 */
webhookRouter.post('/whatsapp', (req, res) => {
  const db = req.app.locals.db;
  const body = req.body;

  // Meta webhook verification
  if (body.entry && body.entry[0]?.changes?.[0]?.value?.messages) {
    const message = body.entry[0].changes[0].value.messages[0];
    const metadata = body.entry[0].changes[0].value.metadata;

    // Extract lead info
    const fromNumber = message.from;
    const text = message.text?.body || '';
    const waConversationId = body.entry[0].changes[0].value.conversations?.[0]?.id;

    // Find or create lead
    let lead = db.prepare('SELECT * FROM leads WHERE phone = ? AND tenant_id IS NOT NULL ORDER BY created_at DESC LIMIT 1').get(fromNumber);

    // Find tenant by phone number ID mapping
    const tenant = db.prepare('SELECT * FROM tenants WHERE settings LIKE ?').get(`%"wa_phone_id":"${metadata.phone_number_id}"%`);

    if (!lead && tenant) {
      const leadId = uuidv4();
      db.prepare(`
        INSERT INTO leads (id, tenant_id, phone, name, source, status)
        VALUES (?, ?, ?, ?, 'whatsapp', 'new')
      `).run(leadId, tenant.id, fromNumber, fromNumber);

      lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
    }

    // Create/find conversation
    let conversation = lead ? db.prepare(
      'SELECT * FROM whatsapp_conversations WHERE lead_id = ? AND status IN (\'active\', \'qualifying\') LIMIT 1'
    ).get(lead.id) : null;

    if (!conversation && lead) {
      const convId = uuidv4();
      db.prepare(`
        INSERT INTO whatsapp_conversations (id, tenant_id, lead_id, wa_conversation_id, status)
        VALUES (?, ?, ?, ?, 'active')
      `).run(convId, lead.tenant_id, lead.id, waConversationId || null);

      conversation = db.prepare('SELECT * FROM whatsapp_conversations WHERE id = ?').get(convId);
    }

    // Save the message
    if (conversation) {
      const msgId = uuidv4();
      db.prepare(`
        INSERT INTO messages (id, conversation_id, direction, sender, content, message_type)
        VALUES (?, ?, 'inbound', ?, ?, 'text')
      `).run(msgId, conversation.id, fromNumber, text);

      // Update conversation timestamp
      db.prepare('UPDATE whatsapp_conversations SET last_message_at = datetime("now") WHERE id = ?').run(conversation.id);

      // Update lead
      db.prepare('UPDATE leads SET updated_at = datetime("now") WHERE id = ?').run(lead.id);
    }
  }

  // Meta requires 200 OK quickly
  res.sendStatus(200);
});

/**
 * GET /api/webhooks/whatsapp
 * WhatsApp webhook verification (Meta's verify token challenge)
 */
webhookRouter.get('/whatsapp', (req, res) => {
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'd1growth-verify';

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[Webhook] WhatsApp verified');
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

/**
 * POST /api/webhooks/gohighlevel
 * Receive webhooks from GoHighLevel
 */
webhookRouter.post('/gohighlevel', (req, res) => {
  const db = req.app.locals.db;
  const event = req.body;

  console.log('[Webhook] GoHighLevel event:', event.type || 'unknown');

  // Handle contact created event
  if (event.type === 'ContactCreate' && event.locationId) {
    const tenant = db.prepare('SELECT * FROM tenants WHERE ghl_location_id = ?').get(event.locationId);

    if (tenant) {
      const exists = db.prepare('SELECT id FROM leads WHERE ghl_contact_id = ? AND tenant_id = ?').get(event.id, tenant.id);

      if (!exists) {
        const leadId = uuidv4();
        db.prepare(`
          INSERT INTO leads (id, tenant_id, ghl_contact_id, name, email, phone, source)
          VALUES (?, ?, ?, ?, ?, ?, 'manual')
        `).run(
          leadId,
          tenant.id,
          event.id,
          event.contactName || null,
          event.email || null,
          event.phone || null
        );
      }
    }
  }

  // Handle opportunity/status change
  if (event.type === 'OpportunityStatusChange' && event.locationId) {
    const tenant = db.prepare('SELECT * FROM tenants WHERE ghl_location_id = ?').get(event.locationId);

    if (tenant) {
      const contact = db.prepare('SELECT * FROM leads WHERE ghl_contact_id = ? AND tenant_id = ?').get(event.contactId, tenant.id);
      if (contact) {
        const statusMap = {
          'new': 'new',
          'contacted': 'contacted',
          'qualified': 'qualified',
          'won': 'converted',
          'lost': 'lost',
        };
        const mappedStatus = statusMap[event.status] || contact.status;
        db.prepare('UPDATE leads SET status = ?, updated_at = datetime("now") WHERE id = ?').run(mappedStatus, contact.id);
      }
    }
  }

  res.sendStatus(200);
});