import { useId, useRef, useState, type SubmitEvent } from "react";
import type { Goal } from "./types";

type ContributionFormProps = {
  goal: Goal;
  onSaved: (goal: Goal) => void;
};

export default function ContributionForm({
  goal,
  onSaved,
}: ContributionFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formId = useId();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);
    const amount = String(data.get("amount") ?? "").trim();
    const contributedOn = String(data.get("contributed_on") ?? "");

    if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
      setError("Enter an amount such as 25 or 25.50.");
      return;
    }

    const [pounds, pennies = ""] = amount.split(".");
    const amountPence =
      Number(pounds) * 100 + Number(pennies.padEnd(2, "0"));

    if (!Number.isSafeInteger(amountPence) || amountPence <= 0) {
      setError("Enter a valid amount greater than £0.");
      return;
    }

    if (!contributedOn) {
      setError("Choose the contribution date.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:8000/goals/${goal.id}/contributions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount_pence: amountPence,
            contributed_on: contributedOn,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Could not record the contribution (${response.status}).`,
        );
      }

      const updatedGoal: Goal = await response.json();
      onSaved(updatedGoal);
      dialogRef.current?.close();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not record the contribution.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        className="new-goal-button"
        type="button"
        onClick={() => dialogRef.current?.showModal()}
      >
        Add contribution
      </button>

      <dialog
        ref={dialogRef}
        className="goal-dialog"
        aria-labelledby={`${formId}-title`}
        onCancel={(event) => {
          if (saving) event.preventDefault();
        }}
        onClose={() => {
          dialogRef.current?.querySelector("form")?.reset();
          setError("");
        }}
      >
        <form className="goal-form" onSubmit={handleSubmit}>
          <h2 id={`${formId}-title`}>Add contribution</h2>
          <p>{goal.name}</p>

          <fieldset disabled={saving}>
            <label htmlFor={`${formId}-amount`}>Amount (£)</label>
            <input
              id={`${formId}-amount`}
              name="amount"
              type="text"
              inputMode="decimal"
              placeholder="25.00"
              required
            />

            <label htmlFor={`${formId}-date`}>Contribution date</label>
            <input
              id={`${formId}-date`}
              name="contributed_on"
              type="date"
              required
            />

            <div className="form-actions">
              <button type="submit">
                {saving ? "Saving…" : "Add contribution"}
              </button>

              <button
                type="button"
                className="cancel-button"
                onClick={() => dialogRef.current?.close()}
              >
                Cancel
              </button>
            </div>
          </fieldset>

          {error && <p role="alert">{error}</p>}
        </form>
      </dialog>
    </>
  );
}