import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Button, Card, ErrorBanner, Loading } from "../components/UI";

export default function QuickAdd() {
  const [wallets, setWallets] = useState([]);
  const [friends, setFriends] = useState([]);
  const [categories, setCategories] = useState([]);
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
  const [toWallet, setToWallet] = useState("");

  useEffect(() => {
    Promise.all([api.get("/wallets/"), api.get("/friends/"), api.get("/categories/")])
      .then(([w, f, c]) => {
        setWallets(w);
        setFriends(f);
        setCategories(c);
        if (w.length) setWallet(String(w[0].id));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const selectedCategory = categories.find((c) => c.name === category);
  const needsFriend = !!selectedCategory?.is_friend_related;
  const isTransfer = direction === "TRANSFER";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!wallet || !amount) {
      setError("Wallet and amount are required.");
      return;
    }
    if (isTransfer && !toWallet) {
      setError("Select a destination wallet.");
      return;
    }
    if (isTransfer && toWallet === wallet) {
      setError("Cannot transfer a wallet to itself.");
      return;
    }
    setSubmitting(true);
    try {
      if (isTransfer) {
        await api.post("/transactions/", {
          wallet: Number(wallet),
          amount,
          direction: "OUT",
          transfer_to_wallet: Number(toWallet),
          note: note || undefined,
        });
      } else {
        await api.post("/transactions/quick-add/", {
          wallet: Number(wallet),
          amount,
          direction,
          category: category || undefined,
          friend: needsFriend && friend ? Number(friend) : undefined,
          note: note || undefined,
        });
      }
      setSuccess(true);
      setAmount("");
      setCategory("");
      setNote("");
      setFriend("");
      setToWallet("");
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
            <div className="grid grid-cols-3 gap-2">
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
              <button
                type="button"
                onClick={() => setDirection("TRANSFER")}
                className={`py-3 rounded-lg text-sm font-semibold border ${
                  direction === "TRANSFER"
                    ? "bg-brand text-navy border-brand"
                    : "border-app-border text-text-secondary"
                }`}
              >
                Transfer
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
            <label className="block text-sm font-medium mb-1">{isTransfer ? "From Wallet" : "Wallet"}</label>
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

          {isTransfer ? (
            <div>
              <label className="block text-sm font-medium mb-1">To Wallet</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-app-border bg-transparent"
                value={toWallet}
                onChange={(e) => setToWallet(e.target.value)}
              >
                <option value="">Select wallet</option>
                {wallets
                  .filter((w) => String(w.id) !== wallet)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <div className="grid grid-cols-4 gap-2">
                  {categories.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setCategory(c.name === category ? "" : c.name)}
                      className={`py-2 px-1 rounded-lg text-xs font-medium border truncate ${
                        category === c.name
                          ? "bg-brand text-navy border-brand"
                          : "border-app-border text-text-secondary"
                      }`}
                    >
                      {c.name}
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
            </>
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
