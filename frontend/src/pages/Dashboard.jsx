import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api/client";
import { Card, ProgressBar, Loading, ErrorBanner, EmptyState, StatValue } from "../components/UI";
import { formatPKR } from "../utils/format";

const CHART_COLORS = ["#04be99", "#2a4a6b", "#c98a1f", "#006875", "#ba1a1a", "#7a4100", "#03a886"];

const chartTooltipStyle = {
  contentStyle: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-app-border)",
    borderRadius: 8,
    fontSize: 12,
  },
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard/")
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading label="Loading dashboard..." />;
  if (error) return <ErrorBanner message={error} />;
  if (!data) return null;

  const maxCategorySpend = Math.max(1, ...data.month_spend_by_category.map((c) => Number(c.total)));

  return (
    <div className="space-y-5">
      {data.leakage.flagged && (
        <div className="bg-warning-bg border border-warning/25 text-warning rounded-lg px-4 py-3 text-sm">
          <strong>Leakage warning:</strong> Rs. {formatPKR(data.leakage.amount).replace("Rs. ", "")} of this
          month's income ({formatPKR(data.leakage.total_in)}) isn't accounted for in categorized spending.
        </div>
      )}

      <Card>
        <div className="text-sm text-text-muted mb-1">Total balance</div>
        <StatValue className="text-3xl">{formatPKR(data.total_balance)}</StatValue>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {data.wallets.map((w) => (
            <div key={w.id} className="rounded-lg bg-surface-2 px-3 py-2 border border-app-border">
              <div className="text-xs text-text-muted truncate">{w.name}</div>
              <StatValue className="text-sm">{formatPKR(w.current_balance)}</StatValue>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-3">This month's spend by category</h2>
        {data.month_spend_by_category.length === 0 ? (
          <EmptyState message="No spending recorded yet this month." />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.month_spend_by_category}
                  dataKey="total"
                  nameKey="category_name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {data.month_spend_by_category.map((entry, i) => (
                    <Cell key={entry.category_id ?? entry.category_name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...chartTooltipStyle} formatter={(v) => formatPKR(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-3">
              {data.month_spend_by_category.map((c) => (
                <div key={c.category_id ?? c.category_name}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span>{c.category_name}</span>
                    <span className="text-text-muted font-mono">{formatPKR(c.total)}</span>
                  </div>
                  <ProgressBar percent={(Number(c.total) / maxCategorySpend) * 100} />
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Active budgets</h2>
          <Link to="/budgets" className="text-xs text-brand font-medium">
            View all
          </Link>
        </div>
        {data.budgets.length === 0 ? (
          <EmptyState message="No budgets set for this month." />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={Math.max(120, data.budgets.length * 40)}>
              <BarChart data={data.budgets} layout="vertical" margin={{ left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-app-border)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={90}
                  tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                />
                <Tooltip {...chartTooltipStyle} formatter={(v) => `${v}% used`} />
                <Bar dataKey="percent_used" radius={[0, 4, 4, 0]}>
                  {data.budgets.map((b) => (
                    <Cell
                      key={b.id}
                      fill={b.percent_used >= 100 ? "#ba1a1a" : b.percent_used >= 80 ? "#c98a1f" : "#04be99"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="space-y-3 mt-3">
              {data.budgets.map((b) => (
                <div key={b.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{b.label}</span>
                    <span className="text-text-muted font-mono">
                      {formatPKR(b.spent_amount)} / {formatPKR(b.amount)}
                    </span>
                  </div>
                  <ProgressBar percent={b.percent_used} />
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Active goals</h2>
          <Link to="/goals" className="text-xs text-brand font-medium">
            View all
          </Link>
        </div>
        {data.goals.length === 0 ? (
          <EmptyState message="No active goals." />
        ) : (
          <div className="space-y-3">
            {data.goals.map((g) => (
              <div key={g.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{g.name}</span>
                  <span className="text-text-muted font-mono">
                    {formatPKR(g.current_saved_amount)} / {formatPKR(g.target_amount)}
                  </span>
                </div>
                <ProgressBar percent={g.percent_complete} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Friends</h2>
          <Link to="/friends" className="text-xs text-brand font-medium">
            View all
          </Link>
        </div>
        {data.friends.length === 0 ? (
          <EmptyState message="No friend balances yet." />
        ) : (
          <div className="space-y-2">
            {data.friends.map((f) => (
              <div key={f.id} className="flex justify-between text-sm">
                <span>{f.name}</span>
                <span
                  className={`font-mono font-medium ${
                    Number(f.net_balance) > 0
                      ? "text-brand"
                      : Number(f.net_balance) < 0
                      ? "text-error"
                      : "text-text-muted"
                  }`}
                >
                  {Number(f.net_balance) === 0
                    ? "Settled"
                    : Number(f.net_balance) > 0
                    ? `Owes you ${formatPKR(f.net_balance)}`
                    : `You owe ${formatPKR(Math.abs(Number(f.net_balance)))}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
