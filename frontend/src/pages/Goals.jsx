import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Card, ProgressBar, Loading, ErrorBanner, EmptyState, Button } from "../components/UI";
import { formatPKR, formatDate } from "../utils/format";

const emptyForm = { name: "", target_amount: "", deadline: "", status: "active" };

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState(null); // { goal, direction }
  const [expanded, setExpanded] = useState(null);
  const [history, setHistory] = useState({});

  function load() {
    setLoading(true);
    Promise.all([api.get("/goals/"), api.get("/wallets/")])
      .then(([g, w]) => {
        setGoals(g);
        setWallets(w);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCreateGoal(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/goals/", {
        name: form.name,
        target_amount: form.target_amount,
        deadline: form.deadline || null,
        status: form.status,
      });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleHistory(goalId) {
    if (expanded === goalId) {
      setExpanded(null);
      return;
    }
    setExpanded(goalId);
    if (!history[goalId]) {
      try {
        const contribs = await api.get("/goal-transactions/", { goal: goalId });
        setHistory((prev) => ({ ...prev, [goalId]: contribs }));
      } catch (err) {
        setError(err.message);
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Goals</h1>
        <Button onClick={() => setShowForm(!showForm)}>New Goal</Button>
      </div>
      <ErrorBanner message={error} />

      {showForm && (
        <Card>
          <form onSubmit={handleCreateGoal} className="space-y-2">
            <input
              placeholder="Goal name (e.g. Bike)"
              className="w-full px-3 py-2 text-sm rounded-lg border border-app-border bg-transparent"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Target amount"
              className="w-full px-3 py-2 text-sm rounded-lg border border-app-border bg-transparent"
              value={form.target_amount}
              onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
              required
            />
            <input
              type="date"
              placeholder="Deadline (optional)"
              className="w-full px-3 py-2 text-sm rounded-lg border border-app-border bg-transparent"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                Create
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
      ) : goals.length === 0 ? (
        <EmptyState message="No goals yet." />
      ) : (
        <div className="space-y-3">
          {goals.map((g) => (
            <Card key={g.id}>
              <div className="flex justify-between items-start mb-1">
                <div>
                  <div className="font-medium text-sm">{g.name}</div>
                  <div className="text-xs text-text-muted">
                    {g.deadline ? `Deadline: ${formatDate(g.deadline)}` : "No deadline"} · {g.status}
                  </div>
                </div>
              </div>
              <ProgressBar percent={g.percent_complete} />
              <div className="flex justify-between text-xs text-text-muted mt-1 mb-2 font-mono">
                <span>
                  {formatPKR(g.current_saved_amount)} of {formatPKR(g.target_amount)} ({g.percent_complete}%)
                </span>
                {g.suggested_monthly_contribution != null && (
                  <span>Suggested/mo: {formatPKR(g.suggested_monthly_contribution)}</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button className="text-xs px-3 py-1.5" onClick={() => setModal({ goal: g, direction: "ADD" })}>
                  Add
                </Button>
                <Button
                  variant="secondary"
                  className="text-xs px-3 py-1.5"
                  onClick={() => setModal({ goal: g, direction: "WITHDRAW" })}
                >
                  Withdraw
                </Button>
                <button
                  className="text-xs px-3 py-1.5 text-text-muted hover:underline ml-auto"
                  onClick={() => toggleHistory(g.id)}
                >
                  {expanded === g.id ? "Hide history" : "History"}
                </button>
              </div>
              {expanded === g.id && (
                <div className="mt-3 pt-3 border-t border-app-border space-y-1.5">
                  {(history[g.id] || []).length === 0 ? (
                    <div className="text-xs text-text-muted">No contributions yet.</div>
                  ) : (
                    history[g.id].map((h) => (
                      <div key={h.id} className="flex justify-between text-xs font-mono">
                        <span className={h.direction === "ADD" ? "text-brand" : "text-error"}>
                          {h.direction === "ADD" ? "+" : "-"}
                          {formatPKR(h.amount)} ({h.source_wallet_name})
                        </span>
                        <span className="text-text-muted">{formatDate(h.date)}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {modal && (
        <ContributionModal
          goal={modal.goal}
          direction={modal.direction}
          wallets={wallets}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            setHistory((prev) => {
              const copy = { ...prev };
              delete copy[modal.goal.id];
              return copy;
            });
            load();
          }}
        />
      )}
    </div>
  );
}

function ContributionModal({ goal, direction, wallets, onClose, onSaved }) {
  const [amount, setAmount] = useState("");
  const [wallet, setWallet] = useState(wallets[0]?.id || "");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!amount || !wallet) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post("/goal-transactions/", {
        goal: goal.id,
        amount,
        direction,
        source_wallet: Number(wallet),
        note: note || undefined,
      });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/50 flex items-end sm:items-center justify-center z-30 p-4">
      <div className="bg-surface rounded-xl p-4 w-full max-w-sm">
        <h2 className="text-sm font-semibold mb-3">
          {direction === "ADD" ? "Add to" : "Withdraw from"} {goal.name}
        </h2>
        <ErrorBanner message={error} />
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="number"
            step="0.01"
            autoFocus
            placeholder="Amount"
            className="w-full px-3 py-2 text-sm rounded-lg border border-app-border bg-transparent"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <select
            className="w-full px-3 py-2 text-sm rounded-lg border border-app-border bg-transparent"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
          >
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <input
            placeholder="Note (optional)"
            className="w-full px-3 py-2 text-sm rounded-lg border border-app-border bg-transparent"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={submitting}>
              Confirm
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
