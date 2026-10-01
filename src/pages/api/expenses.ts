import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getReferenceRate } from '../../utils/currency';

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

  // Fetch trip's base currency to automatically convert if different
  const trip = await db.prepare('SELECT base_currency FROM trips WHERE id = ?').bind(trip_id).first();
  const baseCurrency = (trip?.base_currency || 'VND').toUpperCase();
  const currency = ((data.get('currency') as string) || baseCurrency).toUpperCase();

  const numAmount = parseFloat(amount as string) || 0;
  let exchange_rate = 1.0;
  let base_amount = numAmount;

  if (currency !== baseCurrency) {
    exchange_rate = getReferenceRate(currency, baseCurrency);
    base_amount = numAmount * exchange_rate;
    if (baseCurrency === 'VND') {
      base_amount = Math.round(base_amount);
    } else {
      base_amount = Math.round(base_amount * 100) / 100;
    }
  }

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
      'UPDATE expenses SET amount = ?, description = ?, expense_date = ?, timeline_item_id = ?, image_key = ?, currency = ?, exchange_rate = ?, base_amount = ? WHERE id = ?'
    ).bind(amount, description, expense_date, timeline_item_id, image_key, currency, exchange_rate, base_amount, id).run();

    if (success) {
      return new Response(null, { status: 302, headers: { Location: `/trip/${trip_id}?tab=expenses` } });
    }
    return new Response('Error updating expense', { status: 500 });
  }

  if (!trip_id || !amount || !description || !expense_date) {
    return new Response('Missing required fields', { status: 400 });
  }

  const { success } = await db.prepare(
    'INSERT INTO expenses (trip_id, timeline_item_id, amount, description, expense_date, image_key, currency, exchange_rate, base_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(trip_id, timeline_item_id, amount, description, expense_date, image_key, currency, exchange_rate, base_amount).run();
  
  if (success) {
    return new Response(null, { status: 302, headers: { Location: `/trip/${trip_id}?tab=expenses` } });
  }
  return new Response('Error adding expense', { status: 500 });
};
