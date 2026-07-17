import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, ErrorBanner } from "../components/UI";
import Logo from "../components/Logo";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-surface border border-app-border rounded-xl p-6"
      >
        <div className="w-11 h-11 rounded-lg bg-brand-dim border border-brand/25 flex items-center justify-center text-brand mb-4">
          <Logo className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight mb-1">HisabKitab</h1>
        <p className="text-sm text-text-muted mb-4">Sign in to your account</p>
        <ErrorBanner message={error} />
        <label className="block text-sm font-medium mb-1">Username</label>
        <input
          className="w-full mb-3 px-3 py-2 rounded-lg border border-app-border bg-transparent"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
        />
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          className="w-full mb-4 px-3 py-2 rounded-lg border border-app-border bg-transparent"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Signing in..." : "Sign in"}
        </Button>
        <p className="text-sm text-text-muted mt-4 text-center">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-brand font-medium">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
