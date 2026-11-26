export async function fetchAnalyticsData() {
  const currentQueryString = typeof window !== 'undefined' ? window.location.search : '';
  const response = await fetch(`/api/analytics${currentQueryString}`, { 
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'Failed to fetch analytics data');
  }
  return response.json();
}

// Manual User Authentication (Stays on client side since user inputs these)
export async function authenticateUser(email: string, password: string) {
  const response = await fetch('https://crowdsnap.ai/api/client/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, issocial: true }),
  });
  if (!response.ok) throw new Error('Authentication failed');
  return response.json();
}

// User Verification OTP Handshake
export async function verifyOtp(otp: string, userid: string) {
  const response = await fetch('https://crowdsnap.ai/api/client/otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ otp, userid }),
  });
  if (!response.ok) throw new Error('Invalid OTP');
  return response.json();
}

// Save grid data to TiDB
export interface SaveGridPayload {
  gridId: string;
  gridName: string;
  gridType: 'text' | 'multi' | 'checkbox';
  columns: string[];
  rows: string[];
  cells: Array<{
    row: string;
    column: string;
    userInput?: boolean;
    notes?: Record<string, any> | string;
  }>;
  responseId?: string;
  responseDateTime?: string;
  responseIp?: string;
  responseGuid?: string;
}

export async function saveGridData(payload: SaveGridPayload) {
  const response = await fetch('/api/grid/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to save grid data');
  }
  return response.json();
}

// Search grid data
export interface SearchGridParams {
  gridId: string;
  search?: string;
  rowName?: string;
  columnName?: string;
  limit?: number;
  offset?: number;
}

export async function searchGridData(params: SearchGridParams) {
  const queryParams = new URLSearchParams();
  queryParams.set('gridId', params.gridId);
  if (params.search) queryParams.set('search', params.search);
  if (params.rowName) queryParams.set('rowName', params.rowName);
  if (params.columnName) queryParams.set('columnName', params.columnName);
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.offset) queryParams.set('offset', params.offset.toString());

  const response = await fetch(`/api/grid/search?${queryParams}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to search grid data');
  }
  return response.json();
}

// List all saved grids
export interface ListGridsParams {
  search?: string;
  limit?: number;
  offset?: number;
}

export async function listSavedGrids(params?: ListGridsParams) {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.set('search', params.search);
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.offset) queryParams.set('offset', params.offset.toString());

  const response = await fetch(`/api/grid/list?${queryParams}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to list grids');
  }
  return response.json();
}

// Get grid details by ID
export interface GetGridParams {
  gridId: string;
}

export async function getGridDataById(params: GetGridParams) {
  const queryParams = new URLSearchParams();
  queryParams.set('gridId', params.gridId);

  const response = await fetch(`/api/grid/get?${queryParams}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to get grid');
  }
  return response.json();
}