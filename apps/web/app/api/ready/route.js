export async function GET() {
  return new Response(JSON.stringify({ ready: true, service: 'web' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
