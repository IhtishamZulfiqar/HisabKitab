export function Card({ children, className = "", ...props }) {
  return (
    <div
      className={`bg-surface border border-app-border rounded-xl shadow-xs hover:shadow-sm transition-shadow p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatValue({ children, className = "" }) {
  return <span className={`font-mono font-extrabold tracking-tight ${className}`}>{children}</span>;
}

export function ProgressBar({ percent }) {
  const pct = Math.max(0, Math.min(100, Number(percent) || 0));
  const color = pct >= 100 ? "bg-error" : pct >= 80 ? "bg-[#c98a1f]" : "bg-brand";
  return (
    <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Loading({ label = "Loading..." }) {
  return <div className="text-sm text-text-muted py-8 text-center">{label}</div>;
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="bg-error-bg border border-error/20 text-error text-sm font-medium rounded-lg px-3 py-2 mb-3">
      {message}
    </div>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-brand hover:bg-brand-hover text-navy",
    dark: "bg-navy hover:bg-navy-mid text-white",
    secondary: "bg-surface-2 hover:bg-app-border text-text-primary border border-app-border",
    danger: "bg-error-bg hover:bg-error text-error hover:text-white border border-error/20",
  };
  return (
    <button
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function EmptyState({ message }) {
  return <div className="text-sm text-text-muted text-center py-8">{message}</div>;
}
