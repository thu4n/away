import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request }) => {
  try {
    const db = (env as any).DB;
    if (!db) {
      return new Response('Database connection failed', { status: 500 });
    }

    const data = await request.formData();
    const action = data.get('action');
    const trip_id = data.get('trip_id');

    if (!trip_id) {
      return new Response('Missing trip_id', { status: 400 });
    }

    if (action === 'delete') {
      const id = data.get('id');
      if (id) {
        await db.prepare('DELETE FROM trip_members WHERE id = ? AND trip_id = ?').bind(id, trip_id).run();
      }
      return new Response(null, { status: 302, headers: { Location: `/trip/${trip_id}?tab=expenses` } });
    }

    if (action === 'edit') {
      const id = data.get('id');
      const name = (data.get('name') as string)?.trim();
      if (id && name) {
        await db.prepare('UPDATE trip_members SET name = ? WHERE id = ? AND trip_id = ?').bind(name, id, trip_id).run();
      }
      return new Response(null, { status: 302, headers: { Location: `/trip/${trip_id}?tab=expenses` } });
    }

    // Default action: add member(s)
    const nameRaw = (data.get('name') as string)?.trim();
    if (nameRaw) {
      // Support comma, semicolon, or newline separated lists of names
      const names = nameRaw
        .split(/[,;\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      for (const name of names) {
        const existing = await db
          .prepare('SELECT id FROM trip_members WHERE trip_id = ? AND LOWER(name) = LOWER(?)')
          .bind(trip_id, name)
          .first();

        if (!existing) {
          await db
            .prepare('INSERT INTO trip_members (trip_id, name) VALUES (?, ?)')
            .bind(trip_id, name)
            .run();
        }
      }
    }

    return new Response(null, { status: 302, headers: { Location: `/trip/${trip_id}?tab=expenses` } });
  } catch (err: any) {
    console.error('[POST /api/members] Error:', err?.message ?? err);
    return new Response(JSON.stringify({ error: err?.message ?? 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
