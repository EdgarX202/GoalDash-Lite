import { useEffect, useRef, useState, type SubmitEvent } from "react";
import "./App.css";

type Goal = {
  id: number;
  name: string;
  category: string;
  target_pence: number;
  contributed_pence: number;
};

const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

type NewGoalFormProps = {
  onCreated: (goal: Goal) => void;
};

function NewGoalForm({ onCreated }: NewGoalFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") ?? "").trim();
    const category = String(formData.get("category") ?? "");
    const target = String(formData.get("target") ?? "");

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
      const response = await fetch("http://localhost:8000/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          category,
          target_pence: targetPence,
        }),
      });

      if (!response.ok) {
        throw new Error(`Could not create the goal (${response.status}).`);
      }

      const createdGoal: Goal = await response.json();
      onCreated(createdGoal);
      form.reset();
      dialogRef.current?.close();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not create the goal.",
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
        + New goal
      </button>

      <dialog
        ref={dialogRef}
        className="goal-dialog"
        aria-labelledby="new-goal-title"
        onCancel={(event) => {
          if (saving) event.preventDefault();
        }}
        onClose={() => {
          dialogRef.current?.querySelector("form")?.reset();
          setError("");
        }}
      >
        <form className="goal-form" onSubmit={handleSubmit}>
          <h2 id="new-goal-title">New goal</h2>
        
      <fieldset disabled={saving}>
        <label htmlFor="goal-name">Goal name</label>
        <input
          id="goal-name"
          name="name"
          placeholder="Emergency fund"
          maxLength={100}
          required
        />

        <label htmlFor="goal-category">Category</label>
        <select id="goal-category" name="category" defaultValue="Savings">
          <option value="Savings">Savings</option>
          <option value="Debt">Debt</option>
          <option value="Other">Other</option>
        </select>

        <label htmlFor="goal-target">Target amount (£)</label>
        <input
          id="goal-target"
          name="target"
          type="text"
          inputMode="decimal"
          placeholder="1000.00"
          required
        />

        <div className="form-actions">
          <button type="submit">
            {saving ? "Creating…" : "Create goal"}
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

  return (
    <main className="goals-page">
      <header>
        <p className="app-name">GoalDash Lite</p>
        <h1>My goals</h1>
        <p>Small steps towards what matters to you.</p>
      </header>

      {!loading && !error && (
        <NewGoalForm
          onCreated={(newGoal) => {
            setGoals((currentGoals) => [...currentGoals, newGoal]);
          }}
        />
      )}

      {loading && <p role="status">Loading your goals…</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && goals.length === 0 && (
        <p>No goals yet. Your first goal will appear here.</p>
      )}

      {goals.map((goal) => (
        <article className="goal-card" key={goal.id}>
          <span className="category">{goal.category}</span>
          <h2>{goal.name}</h2>

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
        </article>
      ))}
    </main>
  );
}

export default App;