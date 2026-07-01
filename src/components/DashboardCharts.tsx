"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { MonthlyCashflowRow } from "@/types";

function formatEur(value: number) {
  return value.toLocaleString("sl-SI", { maximumFractionDigits: 0 }) + " €";
}

function tooltipFormatter(value: unknown) {
  return formatEur(Number(value));
}

export function DashboardCharts({ rows }: { rows: MonthlyCashflowRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        Ni še plačilnih dogodkov za prikaz grafov.
      </p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Mesečni denarni tok</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatEur(value as number)} width={90} />
            <Tooltip formatter={tooltipFormatter} />
            <Legend />
            <Bar dataKey="ownFunds" stackId="a" name="Lastna sredstva" fill="#0f766e" />
            <Bar dataKey="loan" stackId="a" name="Kredit" fill="#b45309" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Kumulativni strošek</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatEur(value as number)} width={90} />
            <Tooltip formatter={tooltipFormatter} />
            <Legend />
            <Line type="monotone" dataKey="cumulativeTotal" name="Kumulativni strošek" stroke="#1e293b" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="cumulativeLoan" name="Kumulativno črpanje kredita" stroke="#b45309" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
