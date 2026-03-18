import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  const data = await request.formData();
  
  const action = data.get('action');
  const trip_id = data.get('trip_id');
  
  if (action === 'delete') {
    const id = data.get('id');
    await db.prepare('DELETE FROM timeline_items WHERE id = ?').bind(id).run();
    return new Response(null, { status: 302, headers: { Location: `/trip/${trip_id}` } });
  }

  const day_number = data.get('day_number');
  const time_mark = data.get('time_mark');
  const title = data.get('title');
  const maps_url = data.get('maps_url');
  const description = data.get('description');

  if (action === 'edit') {
    const id = data.get('id');
    if (!id || !trip_id || !day_number || !time_mark || !title) {
      return new Response('Missing required fields', { status: 400 });
    }

    const { success } = await db.prepare(
      'UPDATE timeline_items SET day_number = ?, time_mark = ?, title = ?, maps_url = ?, description = ? WHERE id = ?'
    ).bind(day_number, time_mark, title, maps_url || null, description || null, id).run();

    if (success) {
      return new Response(null, { status: 302, headers: { Location: `/trip/${trip_id}` } });
    }
    return new Response('Error updating timeline item', { status: 500 });
  }

  // Create
  if (!trip_id || !day_number || !time_mark || !title) {

    return new Response('Missing required fields', { status: 400 });
  }

  const { success } = await db.prepare(
    'INSERT INTO timeline_items (trip_id, day_number, time_mark, title, maps_url, description) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(trip_id, day_number, time_mark, title, maps_url || null, description || null).run();
  
  if (success) {
    return new Response(null, { status: 302, headers: { Location: `/trip/${trip_id}` } });
  }
  return new Response('Error adding timeline item', { status: 500 });
};
