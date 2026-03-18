import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  const data = await request.formData();
  
  const action = data.get('action');
  const trip_id = data.get('trip_id');
  
  if (action === 'delete') {
    const id = data.get('id');
    await db.prepare('DELETE FROM expenses WHERE id = ?').bind(id).run();
    return new Response(null, { status: 302, headers: { Location: `/trip/${trip_id}?tab=expenses` } });
  }

  // Create
  const amount = data.get('amount');
  const description = data.get('description');
  const expense_date = data.get('expense_date');
  let timeline_item_id = data.get('timeline_item_id');
  if (!timeline_item_id || timeline_item_id === '') {
    timeline_item_id = null;
  }
  
  if (!trip_id || !amount || !description || !expense_date) {
    return new Response('Missing required fields', { status: 400 });
  }

  const { success } = await db.prepare(
    'INSERT INTO expenses (trip_id, timeline_item_id, amount, description, expense_date) VALUES (?, ?, ?, ?, ?)'
  ).bind(trip_id, timeline_item_id, amount, description, expense_date).run();
  
  if (success) {
    return new Response(null, { status: 302, headers: { Location: `/trip/${trip_id}?tab=expenses` } });
  }
  return new Response('Error adding expense', { status: 500 });
};
