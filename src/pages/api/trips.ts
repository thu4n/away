import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async () => {
  try {
    const db = (env as any).DB;
    const { results } = await db.prepare('SELECT * FROM trips ORDER BY start_date ASC').all();
    return new Response(JSON.stringify(results), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const db = (env as any).DB;
    if (!db) {
      return new Response('DB binding not found', { status: 500 });
    }
    const data = await request.formData();
  
  const action = data.get('action'); // 'create' or 'delete'
  
  if (action === 'delete') {
    const id = data.get('id');
    await db.prepare('DELETE FROM trips WHERE id = ?').bind(id).run();
    return new Response(null, { status: 302, headers: { Location: '/' } });
  }

  if (action === 'edit') {
    const id = data.get('id');
    const name = data.get('name');
    const start_date = data.get('start_date');
    const end_date = data.get('end_date');
    const description = data.get('description'); // Not in DB, but may catch from form if not removed yet
    
    if (!id || !name || !start_date || !end_date) {
      return new Response('Missing fields', { status: 400 });
    }

    await db.prepare('UPDATE trips SET name = ?, start_date = ?, end_date = ? WHERE id = ?')
      .bind(name, start_date, end_date, id)
      .run();

    return new Response(null, { status: 302, headers: { Location: '/' } });
  }

  // Create

  const name = data.get('name');
  const start_date = data.get('start_date');
  const end_date = data.get('end_date');
  
  if (!name || !start_date || !end_date) {
    return new Response('Missing fields', { status: 400 });
  }

  await db.prepare('INSERT INTO trips (name, start_date, end_date) VALUES (?, ?, ?)')
    .bind(name, start_date, end_date)
    .run();
  
  return new Response(null, { status: 302, headers: { Location: '/' } });

  } catch (err: any) {
    console.error('[POST /api/trips] Error:', err?.message ?? err);
    return new Response(JSON.stringify({ error: err?.message ?? 'Unknown error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
