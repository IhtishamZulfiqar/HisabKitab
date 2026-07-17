import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { Card, Loading, ErrorBanner, EmptyState, Button } from "../components/UI";
import { formatPKR, formatDate } from "../utils/format";

export default function Friends() {
  const { id } = useParams();
  return id ? <FriendLedger id={id} /> : <FriendList />;
}

function FriendList() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  function load() {
    setLoading(true);
    api
      .get("/friends/")
      .then(setFriends)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await api.post("/friends/", { name: newName.trim() });
      setNewName("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Friends</h1>
      <ErrorBanner message={error} />

      <Card>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-app-border bg-transparent"
            placeholder="Add a friend"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button type="submit" disabled={adding}>
            Add
          </Button>
        </form>
      </Card>

      {loading ? (
        <Loading />
      ) : friends.length === 0 ? (
        <EmptyState message="No friends added yet." />
      ) : (
        <div className="space-y-2">
          {friends.map((f) => (
            <Card
              key={f.id}
              className="!p-3 cursor-pointer hover:border-brand"
              onClick={() => navigate(`/friends/${f.id}`)}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">{f.name}</span>
                <span
                  className={`text-sm font-mono font-medium ${
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function FriendLedger({ id }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({ amount: "", direction: "OUT", wallet: "", note: "" });

  function load() {
    setLoading(true);
    Promise.all([api.get(`/friends/${id}/ledger/`), api.get("/wallets/")])
      .then(([ledger, w]) => {
        setData(ledger);
        setWallets(w);
        if (w.length && !form.wallet) setForm((f) => ({ ...f, wallet: String(w[0].id) }));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function handleAddEntry(e) {
    e.preventDefault();
    if (!form.amount || !form.wallet) return;
    setSubmitting(true);
    try {
      await api.post("/transactions/", {
        wallet: Number(form.wallet),
        amount: form.amount,
        direction: form.direction,
        friend: Number(id),
        category: undefined,
        note: form.note || undefined,
      });
      setForm({ ...form, amount: "", note: "" });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loading />;
  if (error) return <ErrorBanner message={error} />;
  if (!data) return null;

  const net = Number(data.net_balance);

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/friends")} className="text-sm text-brand">
        ← Back to friends
      </button>
      <h1 className="text-lg font-semibold">{data.friend.name}</h1>

      <Card>
        <div className="text-sm text-text-muted mb-1">Net balance</div>
        <div className={`text-2xl font-semibold font-mono ${net > 0 ? "text-brand" : net < 0 ? "text-error" : ""}`}>
          {net === 0 ? "Settled" : net > 0 ? `Owes you ${formatPKR(net)}` : `You owe ${formatPKR(Math.abs(net))}`}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-2">Add lend / borrow entry</h2>
        <form onSubmit={handleAddEntry} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setForm({ ...form, direction: "OUT" })}
              className={`py-2 rounded-lg text-sm font-medium border ${
                form.direction === "OUT" ? "bg-error text-white border-error" : "border-app-border"
              }`}
            >
              I lent (OUT)
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, direction: "IN" })}
              className={`py-2 rounded-lg text-sm font-medium border ${
                form.direction === "IN" ? "bg-brand text-navy border-brand" : "border-app-border"
              }`}
            >
              They paid / I borrowed (IN)
            </button>
          </div>
          <input
            type="number"
            step="0.01"
            placeholder="Amount"
            className="w-full px-3 py-2 text-sm rounded-lg border border-app-border bg-transparent"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <select
            className="w-full px-3 py-2 text-sm rounded-lg border border-app-border bg-transparent"
            value={form.wallet}
            onChange={(e) => setForm({ ...form, wallet: e.target.value })}
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
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
          <Button type="submit" disabled={submitting} className="w-full">
            Add Entry
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-2">History</h2>
        {data.entries.length === 0 ? (
          <EmptyState message="No transactions with this friend yet." />
        ) : (
          <div className="space-y-2">
            {data.entries.map((e) => (
              <div
                key={e.id}
                className="flex justify-between items-center text-sm border-b border-app-border pb-2 last:border-0"
              >
                <div>
                  <div className={`font-mono ${e.direction === "OUT" ? "text-error" : "text-brand"}`}>
                    {e.direction === "OUT" ? "-" : "+"}
                    {formatPKR(e.amount)}
                  </div>
                  <div className="text-xs text-text-muted">
                    {formatDate(e.date)} · {e.wallet}
                    {e.note && ` · ${e.note}`}
                  </div>
                </div>
                <div className="text-xs text-text-muted font-mono">bal: {formatPKR(e.running_balance)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
