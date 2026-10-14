import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { formatCurrency } from '../../utils/currency';
import { calculateSettlement } from '../../utils/settlement';

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

    const baseCurrency = trip.base_currency || 'VND';

    const { results: members } = await db.prepare(
      'SELECT * FROM trip_members WHERE trip_id = ? ORDER BY created_at ASC, id ASC'
    ).bind(id).all();
    const memberNames = (members || []).map((m: any) => m.name);

    const { results: timelineItems } = await db.prepare(
      'SELECT * FROM timeline_items WHERE trip_id = ? ORDER BY day_number ASC, time_mark ASC'
    ).bind(id).all();

    const { results: expenses } = await db.prepare(
      `SELECT e.*, t.title AS timeline_item_title
       FROM expenses e
       LEFT JOIN timeline_items t ON e.timeline_item_id = t.id
       WHERE e.trip_id = ?
       ORDER BY e.expense_date ASC, e.id ASC`
    ).bind(id).all();

    const { results: resources } = await db.prepare(
      'SELECT * FROM trip_resources WHERE trip_id = ? ORDER BY created_at ASC, id ASC'
    ).bind(id).all();

    const settlementSummary = calculateSettlement(expenses || [], memberNames, baseCurrency);

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
    lines.push(['Trip Name', 'Base Currency', 'Start Date', 'End Date', 'Participants', 'Total Events', `Total Expenses (${baseCurrency})`, 'Total Resources'].map(escapeCSV).join(','));
    const totalExpensesSum = (expenses || []).reduce((acc: number, curr: any) => acc + (curr.base_amount ?? curr.amount ?? 0), 0);
    lines.push([
      trip.name,
      baseCurrency,
      trip.start_date,
      trip.end_date,
      memberNames.join('; ') || 'None',
      (timelineItems || []).length,
      formatCurrency(totalExpensesSum, baseCurrency),
      (resources || []).length
    ].map(escapeCSV).join(','));
    lines.push('');

    // SECTION 2: TIMELINE ITEMS
    lines.push('# ITINERARY & TIMELINE');
    lines.push(['No.', 'Day Number', 'Date', 'Time Mark', 'Event Title', 'Google Maps URL', 'Description', 'Photo URL'].map(escapeCSV).join(','));
    let eventIdx = 1;
    for (const item of (timelineItems || [])) {
      const photoUrl = item.image_key ? `${origin}/api/images/${item.image_key}` : '';
      lines.push([
        eventIdx++,
        item.day_number,
        formatDateForDay(item.day_number),
        item.time_mark || '',
        item.title || '',
        item.maps_url || '',
        item.description || '',
        photoUrl
      ].map(escapeCSV).join(','));
    }
    lines.push('');

    // SECTION 3: EXPENSES
    lines.push('# EXPENSES');
    lines.push(['No.', 'Date', 'Description', 'Original Amount', 'Currency', `Converted Amount (${baseCurrency})`, 'Paid By', 'Split Between', 'Linked Timeline Event', 'Receipt Photo URL'].map(escapeCSV).join(','));
    let expenseIdx = 1;
    for (const exp of (expenses || [])) {
      const expCurrency = exp.currency || baseCurrency;
      const receiptUrl = exp.image_key ? `${origin}/api/images/${exp.image_key}` : '';
      let splitDesc = 'All participants';
      if (exp.split_among) {
        try {
          const parsed = JSON.parse(exp.split_among);
          if (Array.isArray(parsed) && parsed.length > 0) {
            splitDesc = parsed.join('; ');
          }
        } catch (e) {}
      }
      lines.push([
        expenseIdx++,
        exp.expense_date || '',
        exp.description || '',
        formatCurrency(exp.amount || 0, expCurrency),
        expCurrency,
        formatCurrency(exp.base_amount ?? exp.amount ?? 0, baseCurrency),
        exp.paid_by || 'Unassigned',
        splitDesc,
        exp.timeline_item_title || '',
        receiptUrl
      ].map(escapeCSV).join(','));
    }
    lines.push('');

    // SECTION 4: BILL SPLITTING & SETTLEMENT PLAN
    if (memberNames.length > 0) {
      lines.push('# BILL SPLITTING & SETTLEMENT PLAN');
      lines.push(['Total Attributed Expenses', formatCurrency(settlementSummary.totalAmount, baseCurrency), 'Average Per Person', formatCurrency(settlementSummary.averagePerPerson, baseCurrency)].map(escapeCSV).join(','));
      lines.push('');
      lines.push(['Member Name', `Total Paid (${baseCurrency})`, `Share Owed (${baseCurrency})`, `Net Balance (${baseCurrency})`, 'Status'].map(escapeCSV).join(','));
      for (const b of settlementSummary.balances) {
        const status = b.net > 0 ? 'To receive' : b.net < 0 ? 'To pay' : 'Settled';
        lines.push([
          b.name,
          formatCurrency(b.paid, baseCurrency),
          formatCurrency(b.share, baseCurrency),
          formatCurrency(b.net, baseCurrency),
          status
        ].map(escapeCSV).join(','));
      }
      lines.push('');
      lines.push(['Debtor (Pays)', 'Creditor (Receives)', `Transfer Amount (${baseCurrency})`].map(escapeCSV).join(','));
      if (settlementSummary.transfers.length === 0) {
        lines.push(['All balances are settled up', '', ''].map(escapeCSV).join(','));
      } else {
        for (const t of settlementSummary.transfers) {
          lines.push([
            t.from,
            t.to,
            formatCurrency(t.amount, baseCurrency)
          ].map(escapeCSV).join(','));
        }
      }
      lines.push('');
    }

    // SECTION 5: RESOURCES HUB
    lines.push('# RESOURCES HUB');
    lines.push(['No.', 'Type', 'Title', 'URL / Link', 'Notes', 'Created At'].map(escapeCSV).join(','));
    let resourceIdx = 1;
    for (const res of (resources || [])) {
      lines.push([
        resourceIdx++,
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
