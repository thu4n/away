import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  const data = await request.formData();
  
  const action = data.get('action');
  
  if (action === 'delete') {
    const id = data.get('id');
    const trip_id = data.get('trip_id');
    await db.prepare('DELETE FROM trip_resources WHERE id = ?').bind(id).run();
    return new Response(null, { status: 302, headers: { Location: `/trip/${trip_id}?tab=resources` } });
  }

  // Create
  const trip_id = data.get('trip_id');
  const type = data.get('type');
  const title = data.get('title');
  const url = data.get('url');
  const notes = data.get('notes') || '';
  
  if (!trip_id || !type || !title || !url) {
    return new Response('Missing fields', { status: 400 });
  }

  // Validate type
  if (type !== 'link' && type !== 'embed') {
    return new Response('Invalid resource type', { status: 400 });
  }

  const { success } = await db.prepare('INSERT INTO trip_resources (trip_id, type, title, url, notes) VALUES (?, ?, ?, ?, ?)')
    .bind(trip_id, type, title, url, notes)
    .run();
  
  if (success) {
    return new Response(null, { status: 302, headers: { Location: `/trip/${trip_id}?tab=resources` } });
  }
  return new Response('Error creating resource', { status: 500 });
};
