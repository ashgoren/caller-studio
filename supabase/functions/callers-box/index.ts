import { AuthMiddleware } from '../_shared/auth.ts';

const BASE_URL = 'https://www.ibiblio.org/contradance/thecallersbox/dance.php';

function extractId(url: string): string | null {
  try {
    const id = new URL(url).searchParams.get('id');
    if (Number(id)) {
      return id;
    }
    return null;
  } catch {
    return null;
  }
}

Deno.serve((req) =>
  AuthMiddleware(req, async (req) => {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return Response.json({ msg: 'Invalid JSON body' }, { status: 400 });
    }
    const { url } = body;

    const id = typeof url === 'string' ? extractId(url) : null;
    if (!id) {
      return Response.json({ msg: 'Missing or invalid URL' }, { status: 400 });
    }

    return fetch(`${BASE_URL}?id=${id}&format=JSON`);
  })
);
