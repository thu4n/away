import { formatCurrency } from './currency';

export interface MemberBalance {
  name: string;
  paid: number;
  share: number;
  net: number; // Positive = gets back money (creditor), Negative = owes money (debtor)
}

export interface SettlementTransfer {
  from: string;
  to: string;
  amount: number;
}

export interface SettlementSummary {
  totalAmount: number;
  averagePerPerson: number;
  balances: MemberBalance[];
  transfers: SettlementTransfer[];
  unattributedTotal: number;
  unattributedCount: number;
}

/**
 * Calculates member balances and minimum debt-settling transactions.
 */
export function calculateSettlement(
  memberNames: string[],
  expenses: any[],
  baseCurrency: string = 'VND'
): SettlementSummary {
  const isVnd = baseCurrency.toUpperCase() === 'VND';
  const round = (val: number) => (isVnd ? Math.round(val) : Math.round(val * 100) / 100);

  const balancesMap: Record<string, { paid: number; share: number }> = {};
  for (const name of memberNames) {
    balancesMap[name] = { paid: 0, share: 0 };
  }

  let totalAmount = 0;
  let unattributedTotal = 0;
  let unattributedCount = 0;

  for (const exp of expenses) {
    const cost = exp.base_amount ?? exp.amount ?? 0;
    totalAmount += cost;

    const payer = exp.paid_by ? String(exp.paid_by).trim() : null;
    if (!payer || !(payer in balancesMap)) {
      unattributedTotal += cost;
      unattributedCount += 1;
      continue;
    }

    balancesMap[payer].paid += cost;

    // Parse split_among
    let beneficiaries: string[] = [];
    if (exp.split_among) {
      try {
        const parsed = JSON.parse(exp.split_among);
        if (Array.isArray(parsed)) {
          beneficiaries = parsed.map((s: any) => String(s).trim()).filter((m) => m in balancesMap);
        }
      } catch {
        beneficiaries = String(exp.split_among)
          .split(',')
          .map((s) => s.trim())
          .filter((m) => m in balancesMap);
      }
    }

    // Default: split equally among all trip members if none selected
    if (beneficiaries.length === 0) {
      beneficiaries = [...memberNames];
    }

    const perPersonShare = cost / beneficiaries.length;
    for (const b of beneficiaries) {
      balancesMap[b].share += perPersonShare;
    }
  }

  const balances: MemberBalance[] = memberNames.map((name) => {
    const data = balancesMap[name] || { paid: 0, share: 0 };
    const net = data.paid - data.share;
    return {
      name,
      paid: round(data.paid),
      share: round(data.share),
      net: round(net),
    };
  });

  // Minimum cash flow settlement algorithm
  const epsilon = isVnd ? 1 : 0.01;
  const debtors: { name: string; amount: number }[] = [];
  const creditors: { name: string; amount: number }[] = [];

  for (const b of balances) {
    if (b.net < -epsilon) {
      debtors.push({ name: b.name, amount: -b.net });
    } else if (b.net > epsilon) {
      creditors.push({ name: b.name, amount: b.net });
    }
  }

  // Sort descending to match largest debtor with largest creditor
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transfers: SettlementTransfer[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];
    const payment = Math.min(debtor.amount, creditor.amount);
    const roundedPayment = round(payment);

    if (roundedPayment > 0) {
      transfers.push({
        from: debtor.name,
        to: creditor.name,
        amount: roundedPayment,
      });
    }

    debtor.amount -= payment;
    creditor.amount -= payment;

    if (debtor.amount <= epsilon) dIdx++;
    if (creditor.amount <= epsilon) cIdx++;
  }

  const averagePerPerson = memberNames.length > 0 ? totalAmount / memberNames.length : 0;

  return {
    totalAmount: round(totalAmount),
    averagePerPerson: round(averagePerPerson),
    balances,
    transfers,
    unattributedTotal: round(unattributedTotal),
    unattributedCount,
  };
}

/**
 * Generates an easy-to-read text summary suitable for sharing on chat platforms.
 */
export function formatSettlementText(
  summary: SettlementSummary,
  baseCurrency: string,
  tripName: string = 'Trip'
): string {
  const lines: string[] = [];
  lines.push(`💰 Bill Settlement Summary: ${tripName}`);
  lines.push(`Total Expenses: ${formatCurrency(summary.totalAmount, baseCurrency)}`);
  lines.push(`Per Person Average: ${formatCurrency(summary.averagePerPerson, baseCurrency)}`);
  lines.push('');
  lines.push('📊 Balances:');
  for (const b of summary.balances) {
    if (b.net > 0) {
      lines.push(`  • ${b.name}: paid ${formatCurrency(b.paid, baseCurrency)} (gets back +${formatCurrency(b.net, baseCurrency)})`);
    } else if (b.net < 0) {
      lines.push(`  • ${b.name}: paid ${formatCurrency(b.paid, baseCurrency)} (owes -${formatCurrency(-b.net, baseCurrency)})`);
    } else {
      lines.push(`  • ${b.name}: paid ${formatCurrency(b.paid, baseCurrency)} (settled up)`);
    }
  }

  lines.push('');
  lines.push('🤝 Settlement Plan:');
  if (summary.transfers.length === 0) {
    lines.push('  🎉 Everyone is settled up! No transfers needed.');
  } else {
    for (const t of summary.transfers) {
      lines.push(`  • ${t.from} ➔ ${t.to}: ${formatCurrency(t.amount, baseCurrency)}`);
    }
  }

  if (summary.unattributedCount > 0) {
    lines.push('');
    lines.push(`⚠️ Note: ${summary.unattributedCount} expense(s) (${formatCurrency(summary.unattributedTotal, baseCurrency)}) had no payer assigned.`);
  }

  return lines.join('\n');
}
