import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { Button } from "../components/UI";
import Logo from "../components/Logo";

const CHART_COLORS = ["#04be99", "#2a4a6b", "#c98a1f", "#006875", "#ba1a1a"];

const SPEND_SCENARIOS = [
  [
    { name: "Food", value: 18000 },
    { name: "Transport", value: 9000 },
    { name: "Bills", value: 14000 },
    { name: "Fun", value: 6000 },
    { name: "Other", value: 4000 },
  ],
  [
    { name: "Food", value: 15500 },
    { name: "Transport", value: 11500 },
    { name: "Bills", value: 13000 },
    { name: "Fun", value: 9000 },
    { name: "Other", value: 3200 },
  ],
  [
    { name: "Food", value: 21000 },
    { name: "Transport", value: 7000 },
    { name: "Bills", value: 14500 },
    { name: "Fun", value: 4500 },
    { name: "Other", value: 5800 },
  ],
];

const TREND_SCENARIOS = [
  [
    { m: "Feb", in: 82000, out: 54000 },
    { m: "Mar", in: 88000, out: 61000 },
    { m: "Apr", in: 79000, out: 58000 },
    { m: "May", in: 95000, out: 63000 },
    { m: "Jun", in: 91000, out: 59000 },
    { m: "Jul", in: 99000, out: 65000 },
  ],
  [
    { m: "Feb", in: 76000, out: 51000 },
    { m: "Mar", in: 81000, out: 55000 },
    { m: "Apr", in: 85000, out: 60000 },
    { m: "May", in: 87000, out: 57000 },
    { m: "Jun", in: 93000, out: 62000 },
    { m: "Jul", in: 97000, out: 60000 },
  ],
];

const BUDGET_SCENARIOS = [
  [
    { name: "Food", used: 72 },
    { name: "Transport", used: 45 },
    { name: "Bills", used: 91 },
    { name: "Fun", used: 38 },
  ],
  [
    { name: "Food", used: 88 },
    { name: "Transport", used: 52 },
    { name: "Bills", used: 68 },
    { name: "Fun", used: 60 },
  ],
];

function useCycle(scenarios, intervalMs) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % scenarios.length), intervalMs);
    return () => clearInterval(id);
  }, [scenarios.length, intervalMs]);
  return scenarios[index];
}

const FEATURES = [
  {
    icon: "👛",
    title: "Multi-wallet tracking",
    desc: "Cash, bank accounts and mobile wallets - all your balances in one clean view.",
  },
  {
    icon: "🎯",
    title: "Budgets that keep you honest",
    desc: "Set monthly limits per category and see exactly where you stand, in real time.",
  },
  {
    icon: "🏆",
    title: "Savings goals",
    desc: "Plan a target, get a suggested monthly contribution, and track progress visually.",
  },
  {
    icon: "🤝",
    title: "Friend ledgers",
    desc: "Track who owes who, without the group-chat math.",
  },
];

export default function Home() {
  const spendData = useCycle(SPEND_SCENARIOS, 3000);
  const trendData = useCycle(TREND_SCENARIOS, 4000);
  const budgetData = useCycle(BUDGET_SCENARIOS, 3500);

  return (
    <div className="min-h-screen bg-app-bg text-text-primary">
      <header className="border-b border-app-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-md bg-navy flex items-center justify-center text-brand shrink-0">
              <Logo className="w-5 h-5" />
            </span>
            <span className="text-[15px] font-bold tracking-tight">HisabKitab</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="secondary" className="!px-3 !py-1.5">
                Sign in
              </Button>
            </Link>
            <Link to="/register">
              <Button className="!px-3 !py-1.5">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-10 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand bg-brand-dim px-3 py-1 rounded-full mb-4">
            Personal finance, simplified
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] mb-4">
            Know exactly where your <span className="text-brand">paisa</span> goes.
          </h1>
          <p className="text-text-secondary text-base sm:text-lg mb-7 max-w-md">
            Wallets, budgets, goals and friend ledgers in one clean dashboard - built to keep
            your money story honest, every single month.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/register">
              <Button className="!px-6 !py-3 text-base">Create free account</Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" className="!px-6 !py-3 text-base">
                I already have an account
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-surface border border-app-border rounded-2xl shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-text-muted">Monthly cash flow</div>
              <div className="text-2xl font-mono font-extrabold tracking-tight">
                Rs. {trendData[trendData.length - 1].in.toLocaleString()}
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-success-text bg-success-bg px-2.5 py-1 rounded-full">
              ● Live preview
            </span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="homeIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#04be99" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#04be99" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="homeOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2a4a6b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2a4a6b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-app-border)" vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-app-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v) => `Rs. ${Number(v).toLocaleString()}`}
              />
              <Area type="monotone" dataKey="in" stroke="#04be99" fill="url(#homeIn)" strokeWidth={2} isAnimationActive animationDuration={800} />
              <Area type="monotone" dataKey="out" stroke="#2a4a6b" fill="url(#homeOut)" strokeWidth={2} isAnimationActive animationDuration={800} />
            </AreaChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <div className="text-xs text-text-muted mb-2">Spend by category</div>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie
                    data={spendData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={28}
                    outerRadius={48}
                    paddingAngle={3}
                    isAnimationActive
                    animationDuration={800}
                  >
                    {spendData.map((entry, i) => (
                      <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-app-border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v) => `Rs. ${Number(v).toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div className="text-xs text-text-muted mb-2">Budget usage</div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={budgetData} layout="vertical" margin={{ left: 0, right: 8 }}>
                  <XAxis type="number" hide domain={[0, 100]} />
                  <Bar dataKey="used" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={800}>
                    {budgetData.map((entry) => (
                      <Cell key={entry.name} fill={entry.used >= 85 ? "#ba1a1a" : entry.used >= 70 ? "#c98a1f" : "#04be99"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center mb-2">
          Everything you need to stay on top of money
        </h2>
        <p className="text-text-secondary text-center max-w-xl mx-auto mb-10">
          No spreadsheets, no guesswork - just a clear picture updated every time you add a
          transaction.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-surface border border-app-border rounded-xl p-5 hover:shadow-sm transition-shadow"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-dim border border-brand/25 flex items-center justify-center text-lg mb-3">
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold mb-1">{f.title}</h3>
              <p className="text-xs text-text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="bg-navy rounded-2xl px-6 sm:px-12 py-10 sm:py-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">
            Start your hisab-kitab today
          </h2>
          <p className="text-white/60 mb-7 max-w-md mx-auto">
            Free to use, private to you - each account only ever sees its own data.
          </p>
          <Link to="/register">
            <Button className="!px-7 !py-3 text-base">Create free account</Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-app-border py-6 text-center text-xs text-text-muted">
        © {new Date().getFullYear()} HisabKitab. Built for clean personal finance.
      </footer>
    </div>
  );
}
