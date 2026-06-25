-- ============================================================
-- D1 Growth Suite - Database Schema
-- Database: SQLite (prototype) / PostgreSQL (production)
-- ============================================================

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- ============================================================
-- TENANTS (sub-account / PME clients)
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    ghl_location_id TEXT,
    ghl_api_key TEXT,
    ghl_refresh_token TEXT,
    plan TEXT DEFAULT 'starter' CHECK(plan IN ('starter', 'pro', 'enterprise')),
    settings TEXT DEFAULT '{}',
    branding TEXT DEFAULT '{}',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- USERS (tenant employees/admins)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    password_hash TEXT,
    name TEXT,
    role TEXT DEFAULT 'viewer' CHECK(role IN ('owner', 'admin', 'editor', 'viewer')),
    is_active INTEGER DEFAULT 1,
    last_login_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(email, tenant_id)
);

-- ============================================================
-- CONTENT TEMPLATES (AI prompt templates)
-- ============================================================
CREATE TABLE IF NOT EXISTS content_templates (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK(platform IN ('instagram', 'facebook', 'linkedin', 'twitter', 'blog', 'email', 'ad')),
    category TEXT NOT NULL CHECK(category IN ('promotional', 'educational', 'engagement', 'sales', 'support')),
    name TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    variables TEXT DEFAULT '[]',
    tone TEXT DEFAULT 'professional' CHECK(tone IN ('professional', 'casual', 'urgent', 'humorous', 'inspirational')),
    max_length INTEGER,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- CONTENT CALENDAR (scheduled posts)
-- ============================================================
CREATE TABLE IF NOT EXISTS content_calendar (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    template_id TEXT REFERENCES content_templates(id) ON DELETE SET NULL,
    scheduled_at TEXT NOT NULL,
    platform TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'ai_generated', 'approved', 'posted', 'failed')),
    ai_content TEXT,
    final_content TEXT,
    media_urls TEXT DEFAULT '[]',
    engagement TEXT DEFAULT '{}',
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- AD CAMPAIGNS
-- ============================================================
CREATE TABLE IF NOT EXISTS ad_campaigns (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK(platform IN ('facebook', 'google', 'linkedin')),
    name TEXT NOT NULL,
    objective TEXT CHECK(objective IN ('awareness', 'traffic', 'conversions', 'leads')),
    budget REAL,
    daily_budget REAL,
    start_date TEXT,
    end_date TEXT,
    target_audience TEXT DEFAULT '{}',
    creative TEXT DEFAULT '{}',
    platform_id TEXT,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'paused', 'completed', 'failed')),
    performance TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- LEADS (cached from GoHighLevel + enrichment)
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    ghl_contact_id TEXT,
    name TEXT,
    email TEXT,
    phone TEXT,
    source TEXT CHECK(source IN ('whatsapp', 'facebook_lead', 'google_ad', 'organic', 'referral', 'manual')),
    score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'new' CHECK(status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
    custom_fields TEXT DEFAULT '{}',
    conversations TEXT DEFAULT '[]',
    ai_summary TEXT,
    assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- WHATSAPP CONVERSATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
    wa_phone_id TEXT,
    wa_conversation_id TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'qualifying', 'qualified', 'closed', 'abandoned')),
    bot_active INTEGER DEFAULT 1,
    last_message_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- MESSAGES (within WhatsApp conversations)
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK(direction IN ('inbound', 'outbound')),
    sender TEXT,
    content TEXT,
    message_type TEXT DEFAULT 'text' CHECK(message_type IN ('text', 'image', 'interactive', 'template')),
    ai_processed INTEGER DEFAULT 0,
    ai_response TEXT,
    metadata TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- BILLING PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS billing_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price_monthly REAL NOT NULL,
    price_yearly REAL,
    max_leads INTEGER DEFAULT -1,
    max_users INTEGER DEFAULT 1,
    features TEXT DEFAULT '[]',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES billing_plans(id),
    status TEXT DEFAULT 'trialing' CHECK(status IN ('active', 'paused', 'canceled', 'trialing')),
    trial_end TEXT,
    current_period_start TEXT,
    current_period_end TEXT,
    stripe_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(tenant_id, score);
CREATE INDEX IF NOT EXISTS idx_content_calendar_tenant ON content_calendar(tenant_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_date ON content_calendar(tenant_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_tenant ON ad_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_tenant ON whatsapp_conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions(tenant_id);

-- ============================================================
-- SEED DATA: Default billing plans
-- ============================================================
INSERT OR IGNORE INTO billing_plans (id, name, price_monthly, max_users, features) VALUES
    ('plan_starter', 'Starter', 97, 3, '["crm", "email_marketing", "whatsapp_bot", "content_calendar"]'),
    ('plan_pro', 'Professional', 197, 10, '["crm", "email_marketing", "whatsapp_bot", "content_calendar", "ad_campaigns", "ai_content", "analytics"]'),
    ('plan_enterprise', 'Enterprise', 497, -1, '["crm", "email_marketing", "whatsapp_bot", "content_calendar", "ad_campaigns", "ai_content", "analytics", "white_label", "api_access", "priority_support"]');

-- ============================================================
-- SEED DATA: System tenant for default templates
-- ============================================================
INSERT OR IGNORE INTO tenants (id, name, slug) VALUES ('__system__', 'System', 'system');

-- ============================================================
-- SEED DATA: Default content templates
-- ============================================================
INSERT OR IGNORE INTO content_templates (id, tenant_id, platform, category, name, prompt_text, variables, tone, max_length) VALUES
    ('tmpl_ig_promo', '__system__', 'instagram', 'promotional', 'IG Promo Post',
     'Create a promotional Instagram post for {business_name}. Key message: {message}. Tone: {tone}. Include 3-5 relevant hashtags.',
     '["business_name", "message"]', 'professional', 2200),
    ('tmpl_fb_edu', '__system__', 'facebook', 'educational', 'FB Educational Post',
     'Create an educational Facebook post for {business_name} about {topic}. Explain why it matters to {audience}. End with a question to drive engagement.',
     '["business_name", "topic", "audience"]', 'casual', 3000),
    ('tmpl_li_sales', '__system__', 'linkedin', 'sales', 'LinkedIn Sales Post',
     'Write a LinkedIn post positioning {business_name} as an expert in {industry}. Discuss {trend} and how our {solution} helps {audience}. Professional tone.',
     '["business_name", "industry", "trend", "solution", "audience"]', 'professional', 3000),
    ('tmpl_ad_facebook', '__system__', 'ad', 'promotional', 'Facebook Ad Copy',
     'Write a Facebook ad: Headline ({headline_max} chars), Primary text ({body_max} chars), CTA: {cta}. Target: {audience}. Offer: {offer}.',
     '["headline_max", "body_max", "cta", "audience", "offer"]', 'urgent', 500);