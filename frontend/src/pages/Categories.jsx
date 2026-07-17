import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Card, Loading, ErrorBanner, EmptyState, Button } from "../components/UI";

const emptyForm = { name: "", is_friend_related: false, is_goal_related: false };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  function load() {
    setLoading(true);
    api
      .get("/categories/")
      .then(setCategories)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function startCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(c) {
    setForm({ name: c.name, is_friend_related: c.is_friend_related, is_goal_related: c.is_goal_related });
    setEditingId(c.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      if (editingId) {
        await api.patch(`/categories/${editingId}/`, form);
      } else {
        await api.post("/categories/", form);
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
      await api.delete(`/categories/${id}/`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Categories</h1>
        <Button onClick={startCreate}>New Category</Button>
      </div>
      <ErrorBanner message={error} />

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              placeholder="Category name"
              className="w-full px-3 py-2 text-sm rounded-lg border border-app-border bg-transparent"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoFocus
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_friend_related}
                onChange={(e) => setForm({ ...form, is_friend_related: e.target.checked })}
              />
              Friend-related (used for lend/borrow entries)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_goal_related}
                onChange={(e) => setForm({ ...form, is_goal_related: e.target.checked })}
              />
              Goal-related (used for savings goal contributions)
            </label>
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
      ) : categories.length === 0 ? (
        <EmptyState message="No categories yet." />
      ) : (
        <div className="space-y-2">
          {categories.map((c) => (
            <Card key={c.id} className="!p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{c.name}</div>
                  <div className="flex gap-1.5 mt-1">
                    {c.is_friend_related && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-brand-dim text-brand">
                        Friend
                      </span>
                    )}
                    {c.is_goal_related && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-warning-bg text-warning">
                        Goal
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(c)}
                    className="text-xs px-2 py-1 rounded-md text-text-muted hover:bg-surface-2"
                  >
                    Edit
                  </button>
                  {confirmDeleteId === c.id ? (
                    <>
                      <button
                        onClick={() => handleDelete(c.id)}
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
                      onClick={() => setConfirmDeleteId(c.id)}
                      className="text-xs px-2 py-1 rounded-md text-error hover:bg-error-bg"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
