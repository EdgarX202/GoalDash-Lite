import { useState, type SubmitEvent } from "react";
import { API_BASE_URL } from "./config";
import type { User } from "./types";

type AccountPageProps = {
  user: User;
  onUpdated: (user: User) => void;
};

export default function AccountPage({
  user,
  onUpdated,
}: AccountPageProps) {
  const [displayName, setDisplayName] = useState(user.display_name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const trimmedName = displayName.trim();

    if (!trimmedName) {
      setError("Please enter a display name.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          display_name: trimmedName,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Your session has expired. Refresh the page to sign in again.",
          );
        }

        if (response.status === 422) {
          throw new Error("Please enter a name between 1 and 50 characters.");
        }

        throw new Error("Could not save your changes. Please try again.");
      }

      const updatedUser: User = await response.json();

      setDisplayName(updatedUser.display_name);
      onUpdated(updatedUser);
      setSuccess("Your display name has been updated.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not save your changes.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="home-page">
      <h1>My account</h1>
      <p>Manage your profile details.</p>

      <section className="home-panel account-panel" aria-labelledby="profile-title">
        <h2 id="profile-title">Profile</h2>

        <dl className="account-details">
          <dt>Email address</dt>
          <dd>{user.email}</dd>
        </dl>

        <form className="goal-form" onSubmit={handleSubmit}>
          <fieldset disabled={saving}>
            <label htmlFor="account-display-name">Display name</label>
            <input
              id="account-display-name"
              name="display_name"
              type="text"
              autoComplete="nickname"
              value={displayName}
              onChange={(event) => {
                setDisplayName(event.target.value);
                setError("");
                setSuccess("");
              }}
              maxLength={50}
              required
            />

            <button
              type="submit"
              disabled={displayName.trim() === user.display_name}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </fieldset>

          {error && <p role="alert">{error}</p>}
          <p className="account-success" role="status">
            {success}
          </p>
        </form>
      </section>
    </main>
  );
}