import { useState, type SubmitEvent } from "react";
import { Link } from "react-router";
import { API_BASE_URL } from "./config";

export default function RegisterPage() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);

    const displayName = String(data.get("display_name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const confirmation = String(data.get("confirmation") ?? "");

    setError("");

    if (!displayName) {
      setError("Enter a display name.");
      return;
    }

    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          display_name: displayName,
          email,
          password,
        }),
      });

      if (response.status === 409) {
        throw new Error("An account with this email already exists.");
      }

      if (response.status === 422) {
        throw new Error(
          "Check your email and use a password of 15–128 characters.",
        );
      }

      if (!response.ok) {
        throw new Error("Could not create your account. Please try again.");
      }

      form.reset();
      setRegistered(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not create your account.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (registered) {
    return (
      <main className="auth-page">
        <p className="app-name">GoalDash Lite</p>
        <h1>Account created</h1>
        <p role="status">You can now sign in and create your first goal.</p>
        <Link to="/login">Continue to sign in</Link>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <p className="app-name">GoalDash Lite</p>
      <h1>Create your account</h1>
      <p>Start tracking your goals and progress.</p>

      <form className="goal-form" onSubmit={handleSubmit}>
        <fieldset disabled={saving}>
          <label htmlFor="register-name">Display name</label>
          <input
            id="register-name"
            name="display_name"
            autoComplete="nickname"
            maxLength={50}
            required
          />

          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="username"
            required
          />

          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            aria-describedby="password-help"
            minLength={15}
            maxLength={128}
            required
          />
          <small id="password-help">
            Use 15–128 characters. Spaces are welcome.
          </small>

          <label htmlFor="register-confirmation">Confirm password</label>
          <input
            id="register-confirmation"
            name="confirmation"
            type="password"
            autoComplete="new-password"
            minLength={15}
            maxLength={128}
            required
          />

          <button type="submit">
            {saving ? "Creating account…" : "Create account"}
          </button>
        </fieldset>

        {error && <p role="alert">{error}</p>}
      </form>

      <p>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </main>
  );
}