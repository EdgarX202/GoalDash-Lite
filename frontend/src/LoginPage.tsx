import { useState, type SubmitEvent } from "react";
import { API_BASE_URL } from "./config";
import type { User } from "./types";
import { Link } from "react-router";

type LoginPageProps = {
  onSignedIn: (user: User) => void;
};

export default function LoginPage({ onSignedIn }: LoginPageProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: String(data.get("email") ?? "").trim(),
          password: String(data.get("password") ?? ""),
        }),
      });

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Incorrect email or password."
            : "Could not sign in. Please try again.",
        );
      }

      const user: User = await response.json();
      onSignedIn(user);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not sign in.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="auth-page">
      <p className="app-name">GoalDash Lite</p>
      <h1>Welcome back</h1>
      <p>Sign in to see your goals and progress.</p>

      <form className="goal-form" onSubmit={handleSubmit}>
        <fieldset disabled={saving}>
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            maxLength={128}
            required
          />

          <button type="submit">
            {saving ? "Signing in…" : "Sign in"}
          </button>
        </fieldset>

        {error && <p role="alert">{error}</p>}
      </form>
    <p>
        New to GoalDash Lite? <Link to="/register">Create an account</Link>
    </p>
    </main>
  );
}