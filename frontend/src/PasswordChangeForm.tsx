import { useState, type SubmitEvent } from "react";
import { API_BASE_URL } from "./config";

type PasswordChangeFormProps = {
  onPasswordChanged: () => void;
};

export default function PasswordChangeForm({
  onPasswordChanged,
}: PasswordChangeFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const form = event.currentTarget;
    const data = new FormData(form);

    const currentPassword = String(data.get("current_password") ?? "");
    const newPassword = String(data.get("new_password") ?? "");
    const confirmation = String(data.get("confirmation") ?? "");

    if (newPassword !== confirmation) {
      setError("The new passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("Choose a different new password.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error(
            "Password was not changed. Check your current password and choose a different new password.",
          );
        }

        if (response.status === 401) {
          throw new Error(
            "Your session has expired. Refresh the page to sign in again.",
          );
        }

        if (response.status === 422) {
          throw new Error(
            "Your new password must contain between 15 and 128 characters.",
          );
        }

        throw new Error("Could not change your password. Please try again.");
      }

      form.reset();
      onPasswordChanged();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not change your password.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      className="home-panel account-panel"
      aria-labelledby="password-title"
    >
      <h2 id="password-title">Change password</h2>
      <p>
        After changing your password, you will be signed out on all devices.
      </p>

      <form className="goal-form" onSubmit={handleSubmit}>
        <fieldset disabled={saving}>
          <label htmlFor="current-password">Current password</label>
          <input
            id="current-password"
            name="current_password"
            type="password"
            autoComplete="current-password"
            maxLength={128}
            required
          />

          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            name="new_password"
            type="password"
            autoComplete="new-password"
            aria-describedby="password-help"
            minLength={15}
            maxLength={128}
            required
          />
          <small id="password-help">
            Use between 15 and 128 characters.
          </small>

          <label htmlFor="confirm-password">Confirm new password</label>
          <input
            id="confirm-password"
            name="confirmation"
            type="password"
            autoComplete="new-password"
            minLength={15}
            maxLength={128}
            required
          />

          <button type="submit">
            {saving ? "Changing password…" : "Change password"}
          </button>
        </fieldset>

        {error && <p role="alert">{error}</p>}
      </form>
    </section>
  );
}