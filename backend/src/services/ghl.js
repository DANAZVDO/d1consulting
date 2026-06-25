/**
 * GoHighLevel API Service
 *
 * Handles communication with the GoHighLevel REST API v3.
 * Base URL: https://services.leadconnectorhq.com/
 */

const GHL_API_BASE = process.env.GHL_API_BASE || 'https://services.leadconnectorhq.com';

/**
 * Make an authenticated request to GoHighLevel API
 */
async function ghlRequest(endpoint, options = {}) {
  const { method = 'GET', body, accessToken } = options;

  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Version': '2021-07-28',
  };

  const response = await fetch(`${GHL_API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GoHighLevel API error (${response.status}): ${error}`);
  }

  return response.json();
}

/**
 * Contacts
 */
export const contacts = {
  list: (accessToken, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return ghlRequest(`/contacts/?${query}`, { accessToken });
  },

  get: (accessToken, contactId) => {
    return ghlRequest(`/contacts/${contactId}`, { accessToken });
  },

  create: (accessToken, contactData) => {
    return ghlRequest('/contacts/', {
      method: 'POST',
      body: contactData,
      accessToken,
    });
  },

  update: (accessToken, contactId, contactData) => {
    return ghlRequest(`/contacts/${contactId}`, {
      method: 'PUT',
      body: contactData,
      accessToken,
    });
  },

  upsert: (accessToken, contactData) => {
    return ghlRequest('/contacts/upsert', {
      method: 'POST',
      body: contactData,
      accessToken,
    });
  },

  getCustomFields: (accessToken, contactId) => {
    return ghlRequest(`/contacts/${contactId}/customFields`, { accessToken });
  },

  updateCustomFields: (accessToken, contactId, fields) => {
    return ghlRequest(`/contacts/${contactId}/customFields`, {
      method: 'PUT',
      body: { customFields: fields },
      accessToken,
    });
  },
};

/**
 * Opportunities (Deals/Pipeline)
 */
export const opportunities = {
  list: (accessToken, pipelineId, params = {}) => {
    const query = new URLSearchParams({ pipelineId, ...params }).toString();
    return ghlRequest(`/opportunities/?${query}`, { accessToken });
  },

  create: (accessToken, opportunityData) => {
    return ghlRequest('/opportunities/', {
      method: 'POST',
      body: opportunityData,
      accessToken,
    });
  },

  update: (accessToken, opportunityId, data) => {
    return ghlRequest(`/opportunities/${opportunityId}`, {
      method: 'PUT',
      body: data,
      accessToken,
    });
  },

  listPipelines: (accessToken) => {
    return ghlRequest('/opportunities/pipelines/', { accessToken });
  },
};

/**
 * Workflows (Automation)
 */
export const workflows = {
  list: (accessToken) => {
    return ghlRequest('/workflows/', { accessToken });
  },

  startForContact: (accessToken, workflowId, contactId) => {
    return ghlRequest(`/workflows/${workflowId}/start`, {
      method: 'POST',
      body: { contactId },
      accessToken,
    });
  },
};

/**
 * Sub-Accounts (Locations / Multi-tenancy)
 */
export const locations = {
  list: (accessToken) => {
    return ghlRequest('/locations/', { accessToken });
  },

  get: (accessToken, locationId) => {
    return ghlRequest(`/locations/${locationId}`, { accessToken });
  },

  create: (accessToken, locationData) => {
    return ghlRequest('/locations/', {
      method: 'POST',
      body: locationData,
      accessToken,
    });
  },
};

/**
 * Conversations (Messaging)
 */
export const conversations = {
  list: (accessToken, locationId) => {
    return ghlRequest(`/conversations/?locationId=${locationId}`, { accessToken });
  },

  getMessages: (accessToken, conversationId) => {
    return ghlRequest(`/conversations/${conversationId}/messages`, { accessToken });
  },

  sendMessage: (accessToken, conversationId, message) => {
    return ghlRequest(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: message,
      accessToken,
    });
  },
};

/**
 * OAuth 2.0 token management
 */
export const oauth = {
  getToken: async (code) => {
    const response = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.GHL_CLIENT_ID,
        client_secret: process.env.GHL_CLIENT_SECRET,
      }),
    });
    return response.json();
  },

  refreshToken: async (refreshToken) => {
    const response = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.GHL_CLIENT_ID,
        client_secret: process.env.GHL_CLIENT_SECRET,
      }),
    });
    return response.json();
  },
};