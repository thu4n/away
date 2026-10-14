import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  const bucket = (env as any).BUCKET;
  const data = await request.formData();
  
  const action = data.get('action');
  const trip_id = data.get('trip_id');
  
  if (action === 'delete') {
    const id = data.get('id');
    const day_number = data.get('day_number') || '1';
    const item = await db.prepare('SELECT image_key FROM timeline_items WHERE id = ?').bind(id).first();
    if (item?.image_key && bucket) {
      await bucket.delete(item.image_key);
    }
    await db.prepare('DELETE FROM timeline_items WHERE id = ?').bind(id).run();
    return new Response(null, { status: 302, headers: { Location: `/trip/${trip_id}?tab=timeline&day=${day_number}` } });
  }

  const day_number = data.get('day_number');
  const time_mark = data.get('time_mark');
  const title = data.get('title');
  const maps_url = data.get('maps_url');
  const description = data.get('description');
  const event_image = data.get('event_image') as File | null;
  let image_key = data.get('image_key') as string | null;
  const remove_image = data.get('remove_image') === 'true';

  if (action === 'edit') {
    const id = data.get('id');
    if (!id || !trip_id || !day_number || !time_mark || !title) {
      return new Response('Missing required fields', { status: 400 });
    }

    if (remove_image && image_key && bucket) {
      await bucket.delete(image_key);
      image_key = null;
    }

    if (event_image && event_image.size > 0 && bucket) {
      const new_key = `timeline/${trip_id}-${Date.now()}-${event_image.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      await bucket.put(new_key, await event_image.arrayBuffer(), {
        httpMetadata: { contentType: event_image.type || 'application/octet-stream' }
      });
      if (image_key && image_key !== new_key) {
        await bucket.delete(image_key);
      }
      image_key = new_key;
    }

    const { success } = await db.prepare(
      'UPDATE timeline_items SET day_number = ?, time_mark = ?, title = ?, maps_url = ?, description = ?, image_key = ? WHERE id = ?'
    ).bind(day_number, time_mark, title, maps_url || null, description || null, image_key || null, id).run();

    if (success) {
      return new Response(null, { status: 302, headers: { Location: `/trip/${trip_id}?tab=timeline&day=${day_number}` } });
    }
    return new Response('Error updating timeline item', { status: 500 });
  }

  // Create
  if (!trip_id || !day_number || !time_mark || !title) {
    return new Response('Missing required fields', { status: 400 });
  }

  if (event_image && event_image.size > 0 && bucket) {
    const new_key = `timeline/${trip_id}-${Date.now()}-${event_image.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    await bucket.put(new_key, await event_image.arrayBuffer(), {
      httpMetadata: { contentType: event_image.type || 'application/octet-stream' }
    });
    image_key = new_key;
  }

  const { success } = await db.prepare(
    'INSERT INTO timeline_items (trip_id, day_number, time_mark, title, maps_url, description, image_key) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(trip_id, day_number, time_mark, title, maps_url || null, description || null, image_key || null).run();
  
  if (success) {
    return new Response(null, { status: 302, headers: { Location: `/trip/${trip_id}?tab=timeline&day=${day_number}` } });
  }
  return new Response('Error adding timeline item', { status: 500 });
};
