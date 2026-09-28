const TOKEN_KEY = 'safardesk.token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function requestStatus(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

async function requestText(path) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(path, { headers });
  const text = await response.text();
  if (!response.ok) throw new Error(text.slice(0, 200) || 'Request failed');
  return text;
}

const COLLECTIONS = [
  'leads', 'customers', 'visaCases', 'quotations', 'bookings', 
  'payments', 'tasks', 'packages', 'suppliers', 'supplierLedger',
  'commissions', 'travelCases', 'subAgentCases', 'whatsappTemplates'
];

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
}

export const api = {
  health: () => request('/api/v1/health'),
  login: (email, password) => request('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (payload) => request('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/api/v1/auth/me'),
  
  workspace: () => request('/api/v1/workspace'),
  replaceCollection: (collection, items) =>
    request(`/api/v1/workspace/${collection}`, { method: 'PUT', body: JSON.stringify({ items }) }),

  collections: {
    list: (collection, params = {}) => 
      request(`/api/v1/collections/${collection}?${buildQuery(params)}`),
    get: (collection, id) => 
      request(`/api/v1/collections/${collection}/${id}`),
    create: (collection, data) => 
      request(`/api/v1/collections/${collection}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (collection, id, data) => 
      request(`/api/v1/collections/${collection}/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    replace: (collection, items) => 
      request(`/api/v1/collections/${collection}`, { method: 'PUT', body: JSON.stringify({ items }) }),
    delete: (collection, id) => 
      request(`/api/v1/collections/${collection}/${id}`, { method: 'DELETE' }),
    stats: (collection) => 
      request(`/api/v1/collections/${collection}/stats/summary`),
    
    leads: (params) => api.collections.list('leads', params),
    customers: (params) => api.collections.list('customers', params),
    visaCases: (params) => api.collections.list('visaCases', params),
    quotations: (params) => api.collections.list('quotations', params),
    bookings: (params) => api.collections.list('bookings', params),
    payments: (params) => api.collections.list('payments', params),
    tasks: (params) => api.collections.list('tasks', params),
    packages: (params) => api.collections.list('packages', params),
    suppliers: (params) => api.collections.list('suppliers', params),
    supplierLedger: (params) => api.collections.list('supplierLedger', params),
    commissions: (params) => api.collections.list('commissions', params),
    travelCases: (params) => api.collections.list('travelCases', params),
    subAgentCases: (params) => api.collections.list('subAgentCases', params),
    whatsappTemplates: (params) => api.collections.list('whatsappTemplates', params)
  },
  
  documents: {
    list: (params = {}) => request(`/api/v1/documents?${buildQuery(params)}`),
    get: (id) => request(`/api/v1/documents/${id}`),
    upload: (formData) => request('/api/v1/documents', { 
      method: 'POST', 
      body: formData,
      headers: { 'Authorization': `Bearer ${getToken()}` }
    }),
    update: (id, data) => request(`/api/v1/documents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    replace: (id, formData) => request(`/api/v1/documents/${id}/replace`, { 
      method: 'POST', 
      body: formData,
      headers: { 'Authorization': `Bearer ${getToken()}` }
    }),
    download: (id) => `/api/v1/documents/${id}/download`,
    delete: (id) => request(`/api/v1/documents/${id}`, { method: 'DELETE' }),
    categories: () => request('/api/v1/documents/categories'),
    stats: () => request('/api/v1/documents/stats/summary')
  },
  
  reports: {
    dashboard: () => request('/api/v1/reports/dashboard'),
    leadSource: () => request('/api/v1/reports/lead-source'),
    conversion: () => request('/api/v1/reports/conversion'),
    consultantPerformance: () => request('/api/v1/reports/consultant-performance'),
    visaStatus: () => request('/api/v1/reports/visa-status'),
    bookingRevenue: () => request('/api/v1/reports/booking-revenue'),
    outstandingBalances: () => request('/api/v1/reports/outstanding-balances'),
    supplierPayable: () => request('/api/v1/reports/supplier-payable'),
    expenses: () => request('/api/v1/reports/expenses'),
    branchPerformance: () => request('/api/v1/reports/branch-performance')
  },
  
  platform: {
    supabase: () => request('/api/v1/platform/supabase'),
    supabaseSql: () => requestText('/api/v1/platform/supabase/sql'),
    supabasePreview: (table, limit = 5) =>
      request(`/api/v1/platform/supabase/preview?table=${encodeURIComponent(table)}&limit=${limit}`),
    supabaseSetup: () => requestStatus('/api/v1/platform/supabase/setup', { method: 'POST' }),
    supabaseSync: () => requestStatus('/api/v1/platform/supabase/sync', { method: 'POST' }),

    config: () => request('/api/v1/platform/config'),
    updateRule: (id, body) =>
      request(`/api/v1/platform/config/rules/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    updateFlag: (id, body) =>
      request(`/api/v1/platform/config/flags/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

    plans: () => request('/api/v1/platform/plans'),
    createPlan: (body) => request('/api/v1/platform/plans', { method: 'POST', body: JSON.stringify(body) }),
    updatePlan: (id, body) =>
      request(`/api/v1/platform/plans/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    deletePlan: (id) => request(`/api/v1/platform/plans/${id}`, { method: 'DELETE' }),

    organizations: () => request('/api/v1/platform/organizations'),
    createOrganization: (body) =>
      request('/api/v1/platform/organizations', { method: 'POST', body: JSON.stringify(body) }),
    updateOrganization: (id, body) =>
      request(`/api/v1/platform/organizations/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

    enforcement: () => request('/api/v1/platform/enforcement'),
    roles: () => request('/api/v1/platform/roles'),
    audit: (limit = 60) => request(`/api/v1/platform/audit?limit=${limit}`)
  },

  // Anonymous endpoints used by the public marketing site (no session required).
  public: {
    plans: () => request('/api/v1/public/plans')
  },

  entitlements: {
    get: () => request('/api/v1/entitlements'),
    requestPlan: (planId) =>
      request('/api/v1/entitlements/plan-request', { method: 'POST', body: JSON.stringify({ planId }) })
  },

  search: (q, collections) => {
    const params = new URLSearchParams({ q: String(q ?? '') });
    if (collections && collections.length) params.append('collections', collections.join(','));
    return request(`/api/v1/collections/search?${params.toString()}`);
  }
};

export { COLLECTIONS };