import { NextResponse } from 'next/server';

const BASE_URL = 'https://crowdsnap-api-qa2.azurewebsites.net';

const SYSTEM_AUTH_CREDENTIALS = {
  email: process.env.CROWDSNAP_EMAIL || "",
  password: process.env.CROWDSNAP_PASSWORD || "",
  issocial: true
};

async function fetchSystemAccessToken(): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/client/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(SYSTEM_AUTH_CREDENTIALS),
  });
  if (!response.ok) throw new Error('System authorization handshake failed.');
  const res = await response.json();
  if (!res?.token) throw new Error("Token not found");
  
  return res.token;
}

// Pass the request object into the function argument list
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userdid = searchParams.get('userdid');
    const eventid = searchParams.get('eventid');
    const pollid = searchParams.get('pollid');

    // Fail-fast validation guardrail
    if (!userdid || !eventid || !pollid) {
      return NextResponse.json(
        { message: 'Missing required tracking values: userdid, eventid, or pollid.' }, 
        { status: 400 }
      );
    }

    // Construct dynamic metric target payload mapping variables 
    const dynamicPayload = {
      eventcode: "KCEV"+eventid,
      userdid: userdid,
      eventid: eventid,
      pollid: Number(pollid),
      forsummerypage: false,
      completionsonly: false,
      votercount: "8",
      type: "Survey",
      multisubmission: "true",
      backbutton: null
    };

    // Secure client system access handshake token verification
    const token = await fetchSystemAccessToken();

    // Execute proxy request to Azure telemetry service endpoint
    const response = await fetch(`${BASE_URL}/api/polls/getPollAnalytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${token}`
      },
      body: JSON.stringify(dynamicPayload),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      return NextResponse.json({ message: errorPayload?.message || 'Failed to fetch metrics' }, { status: response.status });
    }

    const data = await response.json();
    console.log('Fetched analytics data:', data);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}