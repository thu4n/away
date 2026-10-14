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
    const bucket = (env as any).BUCKET;
    if (!db) {
      return new Response('DB binding not found', { status: 500 });
    }
    const data = await request.formData();
  
    const action = data.get('action'); // 'create', 'edit', 'delete'
    
    if (action === 'delete') {
      const id = data.get('id');
      const trip = await db.prepare('SELECT cover_image_key FROM trips WHERE id = ?').bind(id).first();
      if (trip?.cover_image_key && bucket) {
        await bucket.delete(trip.cover_image_key);
      }

      // Cleanup timeline item images
      const { results: timelineImages } = await db.prepare('SELECT image_key FROM timeline_items WHERE trip_id = ? AND image_key IS NOT NULL').bind(id).all();
      if (timelineImages && bucket) {
        for (const item of timelineImages) {
          if (item.image_key) await bucket.delete(item.image_key);
        }
      }

      // Cleanup expense images
      const { results: expenseImages } = await db.prepare('SELECT image_key FROM expenses WHERE trip_id = ? AND image_key IS NOT NULL').bind(id).all();
      if (expenseImages && bucket) {
        for (const exp of expenseImages) {
          if (exp.image_key) await bucket.delete(exp.image_key);
        }
      }

      await db.prepare('DELETE FROM trips WHERE id = ?').bind(id).run();
      return new Response(null, { status: 302, headers: { Location: '/' } });
    }

    if (action === 'edit') {
      const id = data.get('id');
      const name = data.get('name');
      const start_date = data.get('start_date');
      const end_date = data.get('end_date');
      const base_currency = (data.get('base_currency') as string) || 'VND';
      const target_budget_raw = data.get('target_budget');
      const target_budget = target_budget_raw !== null && String(target_budget_raw).trim() !== ''
        ? parseFloat(String(target_budget_raw).replace(/,/g, ''))
        : null;
      let cover_image_key = (data.get('cover_image_key') as string) || null;
      const remove_cover_image = data.get('remove_cover_image') === 'true';
      const cover_image = data.get('cover_image') as File | null;
      
      if (!id || !name || !start_date || !end_date) {
        return new Response('Missing fields', { status: 400 });
      }

      if (remove_cover_image && cover_image_key && bucket) {
        await bucket.delete(cover_image_key);
        cover_image_key = null;
      }

      if (cover_image && cover_image.size > 0 && bucket) {
        const new_key = `trips/${id}-${Date.now()}-${cover_image.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        await bucket.put(new_key, await cover_image.arrayBuffer(), {
          httpMetadata: { contentType: cover_image.type || 'application/octet-stream' }
        });
        if (cover_image_key && cover_image_key !== new_key) {
          await bucket.delete(cover_image_key);
        }
        cover_image_key = new_key;
      }

      await db.prepare('UPDATE trips SET name = ?, start_date = ?, end_date = ?, base_currency = ?, cover_image_key = ?, target_budget = ? WHERE id = ?')
        .bind(name, start_date, end_date, base_currency, cover_image_key, target_budget, id)
        .run();

      return new Response(null, { status: 302, headers: { Location: '/' } });
    }

    // Create
    const name = data.get('name');
    const start_date = data.get('start_date');
    const end_date = data.get('end_date');
    const base_currency = (data.get('base_currency') as string) || 'VND';
    const target_budget_raw = data.get('target_budget');
    const target_budget = target_budget_raw !== null && String(target_budget_raw).trim() !== ''
      ? parseFloat(String(target_budget_raw).replace(/,/g, ''))
      : null;
    const cover_image = data.get('cover_image') as File | null;
    
    if (!name || !start_date || !end_date) {
      return new Response('Missing fields', { status: 400 });
    }

    let cover_image_key: string | null = null;
    if (cover_image && cover_image.size > 0 && bucket) {
      const new_key = `trips/new-${Date.now()}-${cover_image.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      await bucket.put(new_key, await cover_image.arrayBuffer(), {
        httpMetadata: { contentType: cover_image.type || 'application/octet-stream' }
      });
      cover_image_key = new_key;
    }

    await db.prepare('INSERT INTO trips (name, start_date, end_date, base_currency, cover_image_key, target_budget) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(name, start_date, end_date, base_currency, cover_image_key, target_budget)
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
