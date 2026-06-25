/**
 * Tenant Middleware — extracts tenant_id from JWT and attaches to request
 */
export function tenantMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const jwt = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
      req.tenantId = jwt.tenant_id;
      req.userRole = jwt.role;
      req.userId = jwt.sub;
    } catch {
      // Token parsing failed, continue without tenant context
    }
  }

  // For routes that need tenant context, check if it's available
  if (req.path !== '/health' && !req.tenantId && req.method !== 'POST' && req.path !== '/api/auth/login') {
    // Some routes don't need tenant context (auth, webhooks)
  }

  next();
}