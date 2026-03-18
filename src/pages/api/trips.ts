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
  const db = (env as any).DB;
  const data = await request.formData();
  
  const action = data.get('action'); // 'create' or 'delete'
  
  if (action === 'delete') {
    const id = data.get('id');
    await db.prepare('DELETE FROM trips WHERE id = ?').bind(id).run();
    return new Response(null, { status: 302, headers: { Location: '/' } });
  }

  // Create
  const name = data.get('name');
  const start_date = data.get('start_date');
  const end_date = data.get('end_date');
  
  if (!name || !start_date || !end_date) {
    return new Response('Missing fields', { status: 400 });
  }

  const { success } = await db.prepare('INSERT INTO trips (name, start_date, end_date) VALUES (?, ?, ?)')
    .bind(name, start_date, end_date)
    .run();
  
  if (success) {
    return new Response(null, { status: 302, headers: { Location: '/' } });
  }
  return new Response('Error creating trip', { status: 500 });
};
