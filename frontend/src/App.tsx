import { useEffect, useState } from "react";
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