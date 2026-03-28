import type { CashFlowForecast } from "../types/index";

// Generate 90 days of cash flow data: actuals for past + today, forecast for future
function generateCashFlowData(): CashFlowForecast[] {
  const data: CashFlowForecast[] = [];
  const today = new Date("2026-03-28");
  const startDate = new Date("2026-01-27"); // 60 days ago

  // Base daily outflow pattern (weekday-weighted)
  const baseDailyOutflow = 42000;
  let cumulative = 0;

  // Known large payments on specific dates
  const largePayments: Record<string, number> = {
    "2026-02-01": 155600, // Workday Q1
    "2026-02-10": 65000, // PwC milestone 1
    "2026-02-15": 91000, // Salesforce annual
    "2026-03-01": 48320, // AWS
    "2026-03-05": 42000, // Wilson Sonsini
    "2026-03-10": 38900, // Workday
    "2026-03-12": 65000, // PwC final
    "2026-03-19": 31500, // GCP
    "2026-04-01": 48320, // AWS (projected)
    "2026-04-05": 22750, // Salesforce Q2
    "2026-04-10": 38900, // Workday Q2
    "2026-04-15": 18400, // WeWork
    "2026-05-01": 48320, // AWS
    "2026-05-10": 38900, // Workday
    "2026-05-15": 18400, // WeWork
    "2026-06-01": 48320, // AWS
    "2026-06-10": 38900, // Workday
    "2026-06-15": 18400, // WeWork
    "2026-06-25": 75000, // Mid-year consulting
  };

  for (let i = 0; i < 90; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isPast = date <= today;

    // Weekday vs weekend cash outflow
    const baseOutflow = isWeekend ? 8000 : baseDailyOutflow;
    const largePayment = largePayments[dateStr] || 0;
    const dailyVariance = (Math.sin(i * 0.3) * 8000) + (Math.cos(i * 0.7) * 5000);
    const projected = Math.max(0, baseOutflow + largePayment + dailyVariance);

    // Actual slightly varies from projected for past dates
    const actual = isPast
      ? projected * (0.94 + Math.random() * 0.12)
      : undefined;

    const confidence = 0.08 + (i / 90) * 0.12; // widens over time
    cumulative += isPast ? (actual ?? projected) : projected;

    data.push({
      date: dateStr,
      projected: Math.round(projected * 100) / 100,
      ...(actual !== undefined && { actual: Math.round(actual * 100) / 100 }),
      lowerBound: Math.round(projected * (1 - confidence) * 100) / 100,
      upperBound: Math.round(projected * (1 + confidence) * 100) / 100,
      cumulative: Math.round(cumulative * 100) / 100,
    });
  }

  return data;
}

export const cashFlowForecast: CashFlowForecast[] = generateCashFlowData();

export function getCashFlowByHorizon(days: 30 | 60 | 90): CashFlowForecast[] {
  const today = new Date("2026-03-28");
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + days);

  return cashFlowForecast.filter((entry) => {
    const entryDate = new Date(entry.date);
    return entryDate >= today && entryDate <= endDate;
  });
}
