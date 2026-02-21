import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'http://localhost:4000';

async function proxyRequest(request: NextRequest, method: string) {
  try {
    const pathname = request.nextUrl.searchParams.get('path') || '';
    const url = `${API_BASE_URL}${pathname}`;
    
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      if (key !== 'host' && key !== 'content-length') {
        headers[key] = value;
      }
    });
    
    let body;
    if (method !== 'GET' && method !== 'HEAD') {
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        body = JSON.stringify(await request.json());
      } else if (contentType?.includes('multipart/form-data')) {
        body = await request.formData();
      } else {
        body = await request.text();
      }
    }
    
    const response = await fetch(url, {
      method,
      headers,
      body,
    });
    
    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'API service unavailable' },
      { status: 503 }
    );
  }
}

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
