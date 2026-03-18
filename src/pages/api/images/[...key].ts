import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async ({ params }) => {
  const key = params.key;
  if (!key) return new Response('Not found', { status: 404 });

  const bucket = (env as any).BUCKET;
  if (!bucket) return new Response('Storage not configured', { status: 500 });
  
  const object = await bucket.get(key);

  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  if (!headers.has('content-type')) {
    headers.set('content-type', 'image/jpeg');
  }

  return new Response(object.body, { headers });
};
