import { useEffect, useRef, useState, type SubmitEvent } from "react";
import "./App.css";
import type { Goal } from "./types";
import ContributionForm from "./ContributionForm";

const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

type GoalFormProps = {
  goal?: Goal;
  onSaved: (goal: Goal) => void;
};

function GoalForm({ goal, onSaved }: GoalFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEditing = goal !== undefined;
  const formId = goal ? `edit-goal-${goal.id}` : "new-goal";

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") ?? "").trim();
    const category = String(formData.get("category") ?? "");
    const target = String(formData.get("target") ?? "");
    const deadline = String(formData.get("deadline") ?? "");
    const priority = String(formData.get("priority") ?? "Moderate");

    // Accept pounds with up to two decimal places.
    if (!/^\d+(\.\d{1,2})?$/.test(target)) {
      setError("Enter an amount such as 1000 or 1000.50.");
      return;
    }

    // Convert pounds to pence using whole numbers.
    const [pounds, pennies = ""] = target.split(".");
    const targetPence =
      Number(pounds) * 100 + Number(pennies.padEnd(2, "0"));

    if (!name || !Number.isSafeInteger(targetPence) || targetPence <= 0) {
      setError("Enter a name and a valid target greater than £0.");
      return;
    }
    
    setSaving(true);
    setError("");

    try {
        const url = goal
          ? `http://localhost:8000/goals/${goal.id}`
          : "http://localhost:8000/goals";

        const response = await fetch(url, {
          method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          category,
          target_pence: targetPence,
          deadline: deadline || null,
          priority,
        }),
      });

      if (!response.ok) {
        throw new Error(`Could not save the goal (${response.status}).`);
      }

      const savedGoal: Goal = await response.json();
      onSaved(savedGoal);
      form.reset();
      dialogRef.current?.close();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not save the goal.",
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
        onClick={() => {
          dialogRef.current?.querySelector("form")?.reset();
          dialogRef.current?.showModal();
        }}
      >
        {isEditing ? "Edit goal" : "+ New goal"}
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
          <h2 id={`${formId}-title`}>
            {isEditing ? "Edit goal" : "New goal"}
          </h2>
        
      <fieldset disabled={saving}>
        <label htmlFor={`${formId}-name`}>Goal name</label>
        <input
          id={`${formId}-name`}
          name="name"
          placeholder="Emergency fund"
          defaultValue={goal?.name ?? ""}
          maxLength={100}
          required
        />

        <label htmlFor={`${formId}-category`}>Category</label>
        <select
          id={`${formId}-category`}
          name="category"
          defaultValue={goal?.category ?? "Savings"}
        >
          <option value="Savings">Savings</option>
          <option value="Debt">Debt</option>
          <option value="Other">Other</option>
        </select>

        <label htmlFor={`${formId}-target`}>Target amount (£)</label>
        <input
          id={`${formId}-target`}
          name="target"
          type="text"
          inputMode="decimal"
          placeholder="1000.00"
          defaultValue={goal ? (goal.target_pence / 100).toFixed(2) : ""}
          required
        />

        <label htmlFor={`${formId}-deadline`}>Deadline (optional)</label>
        <input
          id={`${formId}-deadline`}
          name="deadline"
          type="date"
          defaultValue={goal?.deadline ?? ""}
        />

        <label htmlFor={`${formId}-priority`}>Priority</label>
        <select
          id={`${formId}-priority`}
          name="priority"
          defaultValue={goal?.priority ?? "Moderate"}
        >
          <option value="High">High</option>
          <option value="Moderate">Moderate</option>
          <option value="Low">Low</option>
        </select>

        <div className="form-actions">
          <button type="submit">
            {saving ? "Saving…" : isEditing ? "Save changes" : "Create goal"}
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

function App() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadGoals() {
      try {
        const response = await fetch("http://localhost:8000/goals", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Could not load goals (${response.status}).`);
        }

        const data: Goal[] = await response.json();
        setGoals(data);
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(
            error instanceof Error ? error.message : "Could not load goals.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadGoals();

    return () => controller.abort();
  }, []);

  async function deleteGoal(goal: Goal) {
    const confirmed = window.confirm(`Delete "${goal.name}"?`);

    if (!confirmed) return;

    setDeletingId(goal.id);
    setDeleteError("");

    try {
      const response = await fetch(
        `http://localhost:8000/goals/${goal.id}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        throw new Error(`Could not delete the goal (${response.status}).`);
      }

      setGoals((currentGoals) =>
        currentGoals.filter((item) => item.id !== goal.id),
      );
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Could not delete the goal.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="goals-page">
      <header>
        <p className="app-name">GoalDash Lite</p>
        <h1>My goals</h1>
        <p>Small steps towards what matters to you.</p>
      </header>

      {!loading && !error && (
        <GoalForm
          onSaved={(newGoal) => {
            setGoals((currentGoals) => [...currentGoals, newGoal]);
          }}
        />
      )}

      {loading && <p role="status">Loading your goals…</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && goals.length === 0 && (
        <p>No goals yet. Your first goal will appear here.</p>
      )}

      {deleteError && <p role="alert">{deleteError}</p>}

      {goals.map((goal) => (
        <article className="goal-card" key={goal.id}>
          <span className="category">{goal.category}</span>
          <h2>{goal.name}</h2>
          <p>Priority: {goal.priority}</p>

          <p>
            Deadline:{" "}
            {goal.deadline
              ? new Intl.DateTimeFormat("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }).format(new Date(`${goal.deadline}T00:00:00`))
              : "No deadline"}
          </p>

          <p>
            {currency.format(goal.contributed_pence / 100)} contributed of{" "}
            {currency.format(goal.target_pence / 100)}
          </p>

          <progress
            aria-label={`${goal.name} progress`}
            value={goal.contributed_pence}
            max={goal.target_pence}
          />

          <p className="progress-label">
            {(
              (goal.contributed_pence / goal.target_pence) *
              100
            ).toFixed(0)}
            % complete
          </p>

          <details className="contribution-history">
            <summary>
              Contribution history ({goal.contributions.length})
            </summary>

            {goal.contributions.length === 0 ? (
              <p>No contributions recorded yet.</p>
            ) : (
              <ul>
                {[...goal.contributions]
                  .sort((a, b) =>
                    b.contributed_on.localeCompare(a.contributed_on),
                  )
                  .map((contribution) => (
                    <li key={contribution.id}>
                      <time dateTime={contribution.contributed_on}>
                        {new Intl.DateTimeFormat("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }).format(
                          new Date(`${contribution.contributed_on}T00:00:00`),
                        )}
                      </time>

                      <strong>
                        {currency.format(contribution.amount_pence / 100)}
                      </strong>
                    </li>
                  ))}
              </ul>
            )}
          </details>

          <ContributionForm
            goal={goal}
            onSaved={(updatedGoal) => {
              setGoals((currentGoals) =>
                currentGoals.map((item) =>
                  item.id === updatedGoal.id ? updatedGoal : item,
                ),
              );
            }}
          />

          <GoalForm
            goal={goal}
            onSaved={(updatedGoal) => {
              setGoals((currentGoals) =>
                currentGoals.map((item) =>
                  item.id === updatedGoal.id ? updatedGoal : item,
                ),
              );
            }}
          />

          <button
            className="delete-button"
            type="button"
            disabled={deletingId !== null}
            onClick={() => deleteGoal(goal)}
          >
            {deletingId === goal.id ? "Deleting…" : "Delete goal"}
          </button>
          
        </article>
      ))}
    </main>
  );
}

export default App;