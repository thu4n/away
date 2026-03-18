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
    const expense = await db.prepare('SELECT image_key FROM expenses WHERE id = ?').bind(id).first();
    if (expense?.image_key && bucket) {
      await bucket.delete(expense.image_key);
    }
    await db.prepare('DELETE FROM expenses WHERE id = ?').bind(id).run();
    return new Response(null, { status: 302, headers: { Location: `/trip/${trip_id}?tab=expenses` } });
  }

  const amount = data.get('amount');
  const description = data.get('description');
  const expense_date = data.get('expense_date');
  let timeline_item_id = data.get('timeline_item_id');
  if (!timeline_item_id || timeline_item_id === '') timeline_item_id = null;
  
  const proof_image = data.get('proof_image') as File | null;
  let image_key = data.get('image_key') as string | null;

  if (proof_image && proof_image.size > 0 && bucket) {
    const new_key = `expenses/${trip_id}-${Date.now()}-${proof_image.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    await bucket.put(new_key, await proof_image.arrayBuffer(), {
      httpMetadata: { contentType: proof_image.type || 'application/octet-stream' }
    });
    if (action === 'edit' && image_key) await bucket.delete(image_key);
    image_key = new_key;
  }

  if (action === 'edit') {
    const id = data.get('id');
    if (!id || !trip_id || !amount || !description || !expense_date) {
      return new Response('Missing required fields', { status: 400 });
    }

    const { success } = await db.prepare(
      'UPDATE expenses SET amount = ?, description = ?, expense_date = ?, timeline_item_id = ?, image_key = ? WHERE id = ?'
    ).bind(amount, description, expense_date, timeline_item_id, image_key, id).run();

    if (success) {
      return new Response(null, { status: 302, headers: { Location: `/trip/${trip_id}?tab=expenses` } });
    }
    return new Response('Error updating expense', { status: 500 });
  }

  if (!trip_id || !amount || !description || !expense_date) {
    return new Response('Missing required fields', { status: 400 });
  }

  const { success } = await db.prepare(
    'INSERT INTO expenses (trip_id, timeline_item_id, amount, description, expense_date, image_key) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(trip_id, timeline_item_id, amount, description, expense_date, image_key).run();
  
  if (success) {
    return new Response(null, { status: 302, headers: { Location: `/trip/${trip_id}?tab=expenses` } });
  }
  return new Response('Error adding expense', { status: 500 });
};
