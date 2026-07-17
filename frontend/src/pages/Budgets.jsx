import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Card, ProgressBar, Loading, ErrorBanner, EmptyState, Button } from "../components/UI";
import { formatPKR, currentMonthStart } from "../utils/format";

const emptyForm = { label: "", category: "", amount: "", month: currentMonthStart() };

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([api.get("/budgets/"), api.get("/categories/")])
      .then(([b, c]) => {
        setBudgets(b);
        setCategories(c);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function startCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(b) {
    setForm({ label: b.label, category: String(b.category), amount: b.amount, month: b.month });
    setEditingId(b.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        label: form.label,
        category: Number(form.category),
        amount: form.amount,
        month: form.month,
      };
      if (editingId) {
        await api.patch(`/budgets/${editingId}/`, payload);
      } else {
        await api.post("/budgets/", payload);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/budgets/${id}/`);
      setBudgets((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Budgets</h1>
        <Button onClick={startCreate}>New Budget</Button>
      </div>
      <ErrorBanner message={error} />

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              placeholder="Label (e.g. Home Expenses - July 2026)"
              className="w-full px-3 py-2 text-sm rounded-lg border border-app-border bg-transparent"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              required
            />
            <select
              className="w-full px-3 py-2 text-sm rounded-lg border border-app-border bg-transparent"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              placeholder="Amount"
              className="w-full px-3 py-2 text-sm rounded-lg border border-app-border bg-transparent"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
            <input
              type="date"
              className="w-full px-3 py-2 text-sm rounded-lg border border-app-border bg-transparent"
              value={form.month}
              onChange={(e) => setForm({ ...form, month: e.target.value })}
              required
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {editingId ? "Save" : "Create"}
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
      ) : budgets.length === 0 ? (
        <EmptyState message="No budgets yet." />
      ) : (
        <div className="space-y-3">
          {budgets.map((b) => (
            <Card key={b.id}>
              <div className="flex justify-between items-start mb-1">
                <div>
                  <div className="font-medium text-sm">{b.label}</div>
                  <div className="text-xs text-text-muted">{b.category_name}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(b)} className="text-xs text-text-muted hover:underline">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(b.id)} className="text-xs text-error hover:underline">
                    Delete
                  </button>
                </div>
              </div>
              <ProgressBar percent={b.percent_used} />
              <div className="flex justify-between text-xs text-text-muted mt-1 font-mono">
                <span>
                  Spent {formatPKR(b.spent_amount)} of {formatPKR(b.amount)}
                </span>
                <span>{formatPKR(b.remaining_amount)} left</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
