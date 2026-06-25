import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase } from './utils/db.js';
import { authRouter } from './routes/auth.js';
import { tenantsRouter } from './routes/tenants.js';
import { contactsRouter } from './routes/contacts.js';
import { contentRouter } from './routes/content.js';
import { campaignsRouter } from './routes/campaigns.js';
import { webhookRouter } from './routes/webhooks.js';
import { errorHandler } from './middleware/errorHandler.js';
import { tenantMiddleware } from './middleware/tenant.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const API_PORT = process.env.API_PORT || 8000;
const PUBLIC_PORT = 3000; // Public-facing port
const isDev = process.env.NODE_ENV !== 'production';

// Initialize database
const db = initDatabase();
app.locals.db = db;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    db: db.open ? 'connected' : 'disconnected',
  });
});

// API Routes (before static serving)
app.use('/api/auth', authRouter);
app.use('/api/tenants', tenantMiddleware, tenantsRouter);
app.use('/api/contacts', tenantMiddleware, contactsRouter);
app.use('/api/content', tenantMiddleware, contentRouter);
app.use('/api/campaigns', tenantMiddleware, campaignsRouter);
app.use('/api/webhooks', webhookRouter);

// Serve built frontend from port 3000
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // SPA fallback — serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/health')) {
      res.sendFile(path.join(frontendDist, 'index.html'));
    }
  });
  console.log(`✓ Serving frontend from ${frontendDist}`);
} else {
  console.log('⚠ Frontend dist not found. Run: cd frontend && npm run build');
  // Fallback message for when frontend isn't built
  app.get('/', (req, res) => {
    res.json({
      message: 'D1 Growth Suite API',
      status: 'Frontend not built yet. Run: cd frontend && npm run build',
      api: `http://localhost:${API_PORT}/api`,
    });
  });
}

// Error handling
app.use(errorHandler);

// Start on port 3000 (public) and API port (private)
app.listen(PUBLIC_PORT, '0.0.0.0', () => {
  console.log(`🌐 D1 Growth Suite — Public UI on http://0.0.0.0:${PUBLIC_PORT}`);
  console.log(`🔌 API available on http://0.0.0.0:${PUBLIC_PORT}/api`);
  console.log(`📡 Internal API port: ${API_PORT}`);
});

// Also listen on API port for internal/development use
app.listen(API_PORT, '127.0.0.1', () => {
  console.log(`🔧 Internal API on http://127.0.0.1:${API_PORT}`);
});

export default app;