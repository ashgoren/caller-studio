import { next } from '@vercel/functions';

export const config = {
  matcher: [
    '/share/d/:token*',
    '/share/p/:token*'
  ]
};

const CRAWLER_REGEX = /bot|crawl|spider|facebookexternalhit|twitterbot|whatsapp|telegram|slack|discord/i;

export default async function middleware(request: Request) {
  console.log('Request to:', request.url);
  
  const userAgent = request.headers.get('User-Agent') ?? '';
  if (!CRAWLER_REGEX.test(userAgent)) {
    return next(); // Not a crawler, exit middleware and return SPA
  }

  const url = request.url.endsWith('/') ? request.url.slice(0, -1) : request.url;
  const isDance = url.includes('/share/d/');
  const endpoint = isDance ? 'get_shared_dance' : 'get_shared_program';
  const token = url.split('/').pop();
  
  const res = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '',
    },
    body: JSON.stringify({ token }),
  });

  let title = 'Caller Studio';
  if (res.ok) {
    const data = await res.json();
    title = isDance ? data.title : [data.date, data.location].filter(Boolean).join(' - ');
  }

  const html =
    `<!doctype html><html><head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <meta property="og:title" content="${title}">
      <meta property="og:site_name" content="Caller Studio">
      <link rel="icon" type="image/x-icon" href="/favicon/favicon.ico">
    </head><body></body></html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}
