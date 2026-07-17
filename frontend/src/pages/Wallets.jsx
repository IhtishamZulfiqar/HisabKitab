import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { Card, Loading, ErrorBanner, EmptyState, Button, StatValue } from "../components/UI";
import { formatPKR, formatDate } from "../utils/format";

const KIND_LABELS = { bank: "Bank", mobile_wallet: "Mobile Wallet", cash: "Cash" };

export default function Wallets() {
  const { id } = useParams();
  return id ? <WalletDetail id={id} /> : <WalletList />;
}

function WalletList() {
  const navigate = useNavigate();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", kind: "cash" });
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    api
      .get("/wallets/")
      .then(setWallets)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      await api.post("/wallets/", form);
      setForm({ name: "", kind: "cash" });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Wallets</h1>
        <Button onClick={() => setShowForm(!showForm)}>New Wallet</Button>
      </div>
      <ErrorBanner message={error} />

      {showForm && (
        <Card>
          <form onSubmit={handleAdd} className="space-y-2">
            <input
              placeholder="Wallet name"
              className="w-full px-3 py-2 text-sm rounded-lg border border-app-border bg-transparent"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <select
              className="w-full px-3 py-2 text-sm rounded-lg border border-app-border bg-transparent"
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value })}
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="mobile_wallet">Mobile Wallet</option>
            </select>
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
      ) : wallets.length === 0 ? (
        <EmptyState message="No wallets yet." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {wallets.map((w) => (
            <Card
              key={w.id}
              className="cursor-pointer hover:border-brand"
              onClick={() => navigate(`/wallets/${w.id}`)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-sm">{w.name}</div>
                  <div className="text-xs text-text-muted">{KIND_LABELS[w.kind]}</div>
                </div>
                <StatValue className="text-base">{formatPKR(w.current_balance)}</StatValue>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function WalletDetail({ id }) {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get(`/wallets/${id}/`), api.get("/transactions/", { wallet: id })])
      .then(([w, t]) => {
        setWallet(w);
        setTransactions(t);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;
  if (error) return <ErrorBanner message={error} />;
  if (!wallet) return null;

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/wallets")} className="text-sm text-brand">
        ← Back to wallets
      </button>
      <h1 className="text-lg font-semibold">{wallet.name}</h1>

      <Card>
        <div className="text-sm text-text-muted mb-1">Current balance</div>
        <StatValue className="text-2xl">{formatPKR(wallet.current_balance)}</StatValue>
        <div className="text-xs text-text-muted mt-1">{KIND_LABELS[wallet.kind]}</div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-2">Transaction history</h2>
        {transactions.length === 0 ? (
          <EmptyState message="No transactions for this wallet yet." />
        ) : (
          <div className="space-y-2">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="flex justify-between items-center text-sm border-b border-app-border pb-2 last:border-0"
              >
                <div>
                  <div className={`font-mono ${t.direction === "IN" ? "text-brand" : "text-error"}`}>
                    {t.direction === "IN" ? "+" : "-"}
                    {formatPKR(t.amount)}
                  </div>
                  <div className="text-xs text-text-muted">
                    {formatDate(t.date)}
                    {t.category_name && ` · ${t.category_name}`}
                    {t.transfer_to_wallet_name && ` · → ${t.transfer_to_wallet_name}`}
                    {t.note && ` · ${t.note}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
