import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Card, Loading, ErrorBanner, EmptyState, Button } from "../components/UI";
import { formatPKR, formatDate } from "../utils/format";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editing, setEditing] = useState(null);

  const [filters, setFilters] = useState({
    wallet: "",
    category: "",
    friend: "",
    date_from: "",
    date_to: "",
  });

  function loadTransactions(activeFilters = filters) {
    setLoading(true);
    api
      .get("/transactions/", activeFilters)
      .then(setTransactions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    Promise.all([api.get("/wallets/"), api.get("/categories/"), api.get("/friends/")])
      .then(([w, c, f]) => {
        setWallets(w);
        setCategories(c);
        setFriends(f);
      })
      .catch((e) => setError(e.message));
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyFilters(e) {
    e.preventDefault();
    loadTransactions();
  }

  function clearFilters() {
    const empty = { wallet: "", category: "", friend: "", date_from: "", date_to: "" };
    setFilters(empty);
    loadTransactions(empty);
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/transactions/${id}/`);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      setConfirmDeleteId(null);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    try {
      const updated = await api.patch(`/transactions/${editing.id}/`, {
        amount: editing.amount,
        note: editing.note,
        date: editing.date,
      });
      setTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditing(null);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Transactions</h1>
      <ErrorBanner message={error} />

      <Card>
        <form onSubmit={applyFilters} className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
          <div>
            <label className="block text-xs font-medium mb-1">Wallet</label>
            <select
              className="w-full px-2 py-1.5 text-sm rounded-lg border border-app-border bg-transparent"
              value={filters.wallet}
              onChange={(e) => setFilters({ ...filters, wallet: e.target.value })}
            >
              <option value="">All</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Category</label>
            <select
              className="w-full px-2 py-1.5 text-sm rounded-lg border border-app-border bg-transparent"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Friend</label>
            <select
              className="w-full px-2 py-1.5 text-sm rounded-lg border border-app-border bg-transparent"
              value={filters.friend}
              onChange={(e) => setFilters({ ...filters, friend: e.target.value })}
            >
              <option value="">All</option>
              {friends.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">From</label>
            <input
              type="date"
              className="w-full px-2 py-1.5 text-sm rounded-lg border border-app-border bg-transparent"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">To</label>
            <input
              type="date"
              className="w-full px-2 py-1.5 text-sm rounded-lg border border-app-border bg-transparent"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            />
          </div>
          <div className="col-span-2 sm:col-span-5 flex gap-2 mt-1">
            <Button type="submit" variant="secondary">
              Apply Filters
            </Button>
            <Button type="button" variant="secondary" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </form>
      </Card>

      {loading ? (
        <Loading />
      ) : transactions.length === 0 ? (
        <EmptyState message="No transactions found." />
      ) : (
        <div className="space-y-2">
          {transactions.map((t) => (
            <Card key={t.id} className="!p-3">
              {editing?.id === t.id ? (
                <form onSubmit={handleSaveEdit} className="space-y-2">
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-2 py-1.5 text-sm rounded-lg border border-app-border bg-transparent"
                    value={editing.amount}
                    onChange={(e) => setEditing({ ...editing, amount: e.target.value })}
                  />
                  <input
                    type="date"
                    className="w-full px-2 py-1.5 text-sm rounded-lg border border-app-border bg-transparent"
                    value={editing.date}
                    onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                  />
                  <input
                    className="w-full px-2 py-1.5 text-sm rounded-lg border border-app-border bg-transparent"
                    placeholder="Note"
                    value={editing.note}
                    onChange={(e) => setEditing({ ...editing, note: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Button type="submit" className="text-xs px-3 py-1.5">
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="text-xs px-3 py-1.5"
                      onClick={() => setEditing(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className={`font-semibold font-mono ${
                          t.direction === "IN" ? "text-brand" : "text-error"
                        }`}
                      >
                        {t.direction === "IN" ? "+" : "-"}
                        {formatPKR(t.amount)}
                      </span>
                      <span className="text-text-muted">·</span>
                      <span className="text-text-muted truncate">{t.wallet_name}</span>
                    </div>
                    <div className="text-xs text-text-muted mt-0.5 truncate">
                      {formatDate(t.date)}
                      {t.category_name && ` · ${t.category_name}`}
                      {t.friend_name && ` · ${t.friend_name}`}
                      {t.transfer_to_wallet_name && ` · → ${t.transfer_to_wallet_name}`}
                      {t.note && ` · ${t.note}`}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setEditing({ id: t.id, amount: t.amount, note: t.note, date: t.date })}
                      className="text-xs px-2 py-1 rounded-md text-text-muted hover:bg-surface-2"
                    >
                      Edit
                    </button>
                    {confirmDeleteId === t.id ? (
                      <>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="text-xs px-2 py-1 rounded-md text-white bg-error"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs px-2 py-1 rounded-md text-text-muted hover:bg-surface-2"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(t.id)}
                        className="text-xs px-2 py-1 rounded-md text-error hover:bg-error-bg"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
