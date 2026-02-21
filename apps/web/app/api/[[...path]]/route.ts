import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'http://localhost:4000';

export async function GET(request: NextRequest) {
  return proxyRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request, 'PUT');
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request, 'PATCH');
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request, 'DELETE');
}

async function proxyRequest(request: NextRequest, method: string) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname.replace('/api', '');
    const targetUrl = `${API_BASE_URL}${pathname}${url.search}`;
    
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      if (key !== 'host' && key !== 'content-length') {
        headers[key] = value;
      }
    });
    
    let body: BodyInit | undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        body = JSON.stringify(await request.json());
      } else {
        body = await request.text();
      }
    }
    
    const response = await fetch(targetUrl, { method, headers, body });
    const data = await response.text();
    
    return new NextResponse(data, {
      status: response.status,
      headers: { 'content-type': response.headers.get('content-type') || 'application/json' },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'API unavailable', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 503 }
    );
  }
}
