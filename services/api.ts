// Fetch Analytics Data via your new secure local server proxy
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
  const response = await fetch('https://crowdsnap-api-qa2.azurewebsites.net/api/client/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, issocial: true }),
  });
  if (!response.ok) throw new Error('Authentication failed');
  return response.json();
}

// User Verification OTP Handshake
export async function verifyOtp(otp: string, userid: string) {
  const response = await fetch('https://crowdsnap-api-qa2.azurewebsites.net/api/client/otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ otp, userid }),
  });
  if (!response.ok) throw new Error('Invalid OTP');
  return response.json();
}