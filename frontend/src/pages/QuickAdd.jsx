import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Button, Card, ErrorBanner, Loading } from "../components/UI";

const PRESET_CATEGORIES = [
  "Daily-Lunch",
  "Petrol",
  "Lend",
  "Borrow",
  "Outing",
  "Bills",
  "Home Expenses",
  "Misc",
];

export default function QuickAdd() {
  const [wallets, setWallets] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [wallet, setWallet] = useState("");
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState("OUT");
  const [category, setCategory] = useState("");
  const [friend, setFriend] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    Promise.all([api.get("/wallets/"), api.get("/friends/")])
      .then(([w, f]) => {
        setWallets(w);
        setFriends(f);
        if (w.length) setWallet(String(w[0].id));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const needsFriend = category === "Lend" || category === "Borrow";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!wallet || !amount) {
      setError("Wallet and amount are required.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/transactions/quick-add/", {
        wallet: Number(wallet),
        amount,
        direction,
        category: category || undefined,
        friend: needsFriend && friend ? Number(friend) : undefined,
        note: note || undefined,
      });
      setSuccess(true);
      setAmount("");
      setCategory("");
      setNote("");
      setFriend("");
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loading label="Loading..." />;

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-lg font-semibold mb-4">Quick Add</h1>
      <ErrorBanner message={error} />
      {success && (
        <div className="bg-success-bg border border-brand/30 text-success-text text-sm rounded-lg px-3 py-2 mb-3">
          Transaction added.
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection("OUT")}
                className={`py-3 rounded-lg text-sm font-semibold border ${
                  direction === "OUT"
                    ? "bg-error text-white border-error"
                    : "border-app-border text-text-secondary"
                }`}
              >
                Money Out
              </button>
              <button
                type="button"
                onClick={() => setDirection("IN")}
                className={`py-3 rounded-lg text-sm font-semibold border ${
                  direction === "IN"
                    ? "bg-brand text-navy border-brand"
                    : "border-app-border text-text-secondary"
                }`}
              >
                Money In
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Amount (PKR)</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              autoFocus
              className="w-full px-3 py-3 text-2xl font-semibold font-mono rounded-lg border border-app-border bg-transparent"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Wallet</label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-app-border bg-transparent"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCategory(c === category ? "" : c)}
                  className={`py-2 px-1 rounded-lg text-xs font-medium border truncate ${
                    category === c
                      ? "bg-brand text-navy border-brand"
                      : "border-app-border text-text-secondary"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {needsFriend && (
            <div>
              <label className="block text-sm font-medium mb-1">Friend</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-app-border bg-transparent"
                value={friend}
                onChange={(e) => setFriend(e.target.value)}
              >
                <option value="">Select friend</option>
                {friends.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Note (optional)</label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-app-border bg-transparent"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full py-3 text-base">
            {submitting ? "Adding..." : "Add Transaction"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
