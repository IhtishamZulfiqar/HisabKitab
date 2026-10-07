import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Card, Loading, ErrorBanner, EmptyState, Button, StatValue } from "../components/UI";
import { formatPKR, formatDate } from "../utils/format";

const INPUT = "w-full px-3 py-2 text-sm rounded-lg border border-app-border bg-transparent";
const today = () => new Date().toLocaleDateString("en-CA");
const rate = (v) => (v == null ? "—" : Number(v).toFixed(2));
const plColor = (v) => (Number(v) >= 0 ? "text-brand" : "text-error");
const signed = (v) => `${Number(v) >= 0 ? "+" : ""}${formatPKR(v)}`;

export default function Investments() {
  const [summary, setSummary] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ symbol: "", quantity: "", price: "", date: today() });
  const [submitting, setSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [symbols, setSymbols] = useState([]);

  function load() {
    return Promise.all([api.get("/investments/"), api.get("/stock-trades/")])
      .then(([s, t]) => {
        setSummary(s);
        setTrades(t);
        setError("");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    // suggestions only: typing a symbol by hand still works if this fails
    api
      .get("/stock-symbols/")
      .then(setSymbols)
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    // prices are cached for 60s on the server, so polling faster gains nothing
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/stock-trades/", form);
      setForm({ symbol: "", quantity: "", price: "", date: today() });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/stock-trades/${id}/`);
      setConfirmDeleteId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Investments</h1>
        <Button onClick={() => setShowForm(!showForm)}>Add Purchase</Button>
      </div>
      <ErrorBanner message={error} />

      {showForm && (
        <Card>
          <form onSubmit={handleAdd} className="space-y-2">
            <input
              list="psx-symbols"
              placeholder="Search share (e.g. LUCK or Lucky Cement)"
              className={`${INPUT} uppercase placeholder:normal-case`}
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value })}
              required
            />
            <datalist id="psx-symbols">
              {symbols.map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.name}
                </option>
              ))}
            </datalist>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Quantity (shares)"
              className={INPUT}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
            />
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Buy rate per share"
              className={INPUT}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
            <input
              type="date"
              className={INPUT}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                Add
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <Loading />
      ) : !summary || summary.holdings.length === 0 ? (
        <EmptyState message="No shares yet. Add your first purchase." />
      ) : (
        <>
          <Card>
            <div className="text-sm text-text-muted mb-1">Estimated value</div>
            <StatValue className="text-3xl">{formatPKR(summary.current_value)}</StatValue>
            <div className="mt-1 text-sm">
              <span className={`font-mono font-semibold ${plColor(summary.profit_loss)}`}>
                {signed(summary.profit_loss)}
              </span>
              <span className="text-text-muted"> on {formatPKR(summary.total_invested)} invested</span>
            </div>
            <div className="text-xs text-text-muted mt-2">
              Prices from PSX, refreshed every minute. Not included in your wallet balance.
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {summary.holdings.map((h) => (
              <Card key={h.symbol}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-sm">{h.symbol}</div>
                    <div className="text-xs text-text-muted">
                      {h.quantity} shares · avg {rate(h.avg_price)}
                    </div>
                  </div>
                  <div className="text-right">
                    <StatValue className="text-base">{formatPKR(h.current_value)}</StatValue>
                    <div className={`text-xs font-mono ${plColor(h.profit_loss)}`}>{signed(h.profit_loss)}</div>
                  </div>
                </div>
                <div className="text-xs text-text-muted mt-2">
                  {h.current_price == null
                    ? "Live price unavailable — shown at cost"
                    : `Now ${rate(h.current_price)} per share`}
                </div>
              </Card>
            ))}
          </div>

          <Card>
            <h2 className="text-sm font-semibold mb-2">Purchases</h2>
            <div className="space-y-2">
              {trades.map((t) => (
                <div
                  key={t.id}
                  className="flex justify-between items-center gap-2 text-sm border-b border-app-border pb-2 last:border-0"
                >
                  <div>
                    <div className="font-mono">
                      {t.symbol} · {t.quantity} @ {rate(t.price)}
                    </div>
                    <div className="text-xs text-text-muted">
                      {formatDate(t.date)} · {formatPKR(t.quantity * t.price)}
                    </div>
                  </div>
                  {confirmDeleteId === t.id ? (
                    <div className="flex gap-2 shrink-0">
                      <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => handleDelete(t.id)}>
                        Confirm
                      </Button>
                      <Button
                        variant="secondary"
                        className="px-2 py-1 text-xs"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <button className="text-xs text-error shrink-0" onClick={() => setConfirmDeleteId(t.id)}>
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
