import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const db = (env as any).DB;
    if (!db) {
      return new Response('Database connection failed', { status: 500 });
    }

    const id = url.searchParams.get('id');
    if (!id) {
      return new Response('Missing trip ID parameter', { status: 400 });
    }

    const trip = await db.prepare('SELECT * FROM trips WHERE id = ?').bind(id).first();
    if (!trip) {
      return new Response('Trip not found', { status: 404 });
    }

    const { results: timelineItems } = await db.prepare(
      'SELECT * FROM timeline_items WHERE trip_id = ? ORDER BY day_number ASC, time_mark ASC'
    ).bind(id).all();

    const { results: expenses } = await db.prepare(
      `SELECT e.*, t.title AS timeline_item_title
       FROM expenses e
       LEFT JOIN timeline_items t ON e.timeline_item_id = t.id
       WHERE e.trip_id = ?
       ORDER BY e.expense_date DESC, e.id ASC`
    ).bind(id).all();

    const { results: resources } = await db.prepare(
      'SELECT * FROM trip_resources WHERE trip_id = ? ORDER BY created_at DESC'
    ).bind(id).all();

    const requestUrl = new URL(request.url);
    const origin = requestUrl.origin;

    // Helper to calculate exact date string for day N
    const formatDateForDay = (dayNum: number) => {
      if (!trip.start_date) return '';
      const parts = String(trip.start_date).split('-').map(Number);
      if (parts.length !== 3 || parts.some(isNaN)) return '';
      const [y, m, d] = parts;
      const dateObj = new Date(y, m - 1, d);
      dateObj.setDate(dateObj.getDate() + (dayNum - 1));
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const lines: string[] = [];

    // SECTION 1: TRIP OVERVIEW
    lines.push('# TRIP OVERVIEW');
    lines.push(['Trip ID', 'Trip Name', 'Start Date', 'End Date', 'Total Events', 'Total Expenses', 'Total Resources'].map(escapeCSV).join(','));
    const totalExpensesSum = (expenses || []).reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
    lines.push([
      trip.id,
      trip.name,
      trip.start_date,
      trip.end_date,
      (timelineItems || []).length,
      totalExpensesSum,
      (resources || []).length
    ].map(escapeCSV).join(','));
    lines.push('');

    // SECTION 2: TIMELINE ITEMS
    lines.push('# ITINERARY & TIMELINE');
    lines.push(['Day Number', 'Date', 'Time Mark', 'Event Title', 'Google Maps URL', 'Description'].map(escapeCSV).join(','));
    for (const item of (timelineItems || [])) {
      lines.push([
        item.day_number,
        formatDateForDay(item.day_number),
        item.time_mark || '',
        item.title || '',
        item.maps_url || '',
        item.description || ''
      ].map(escapeCSV).join(','));
    }
    lines.push('');

    // SECTION 3: EXPENSES
    lines.push('# EXPENSES');
    lines.push(['Expense ID', 'Date', 'Description', 'Amount', 'Linked Timeline Event', 'Receipt Photo URL'].map(escapeCSV).join(','));
    for (const exp of (expenses || [])) {
      const receiptUrl = exp.image_key ? `${origin}/api/images/${exp.image_key}` : '';
      lines.push([
        exp.id,
        exp.expense_date || '',
        exp.description || '',
        exp.amount,
        exp.timeline_item_title || '',
        receiptUrl
      ].map(escapeCSV).join(','));
    }
    lines.push('');

    // SECTION 4: RESOURCES HUB
    lines.push('# RESOURCES HUB');
    lines.push(['Resource ID', 'Type', 'Title', 'URL / Link', 'Notes', 'Created At'].map(escapeCSV).join(','));
    for (const res of (resources || [])) {
      lines.push([
        res.id,
        res.type || '',
        res.title || '',
        res.url || '',
        res.notes || '',
        res.created_at || ''
      ].map(escapeCSV).join(','));
    }

    // Include UTF-8 BOM prefix for Excel compatibility
    const csvContent = '\uFEFF' + lines.join('\r\n');

    const safeName = (trip.name || 'trip').replace(/[^a-zA-Z0-9_\-]/g, '_');
    const filename = `${safeName}_export.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
      }
    });
  } catch (err: any) {
    console.error('[GET /api/export] Error:', err?.message ?? err);
    return new Response(JSON.stringify({ error: err?.message ?? 'Export failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
