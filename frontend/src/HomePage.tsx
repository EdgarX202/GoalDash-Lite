import CategoryOverview from "./CategoryOverview";
import { useEffect, useState } from "react";
import type { Goal } from "./types";
import { API_BASE_URL } from "./config";

type HomePageProps = {
  onViewGoals: () => void;
};

const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

export default function HomePage({ onViewGoals }: HomePageProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadGoals() {
      try {
        const response = await fetch(`${API_BASE_URL}/goals`, {
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

  const activeGoals = goals.filter(
    (goal) => goal.contributed_pence < goal.target_pence,
  );

  const completedCount = goals.length - activeGoals.length;

  const totalContributed = goals.reduce(
    (total, goal) => total + goal.contributed_pence,
    0,
  );

  const totalRemaining = goals.reduce(
    (total, goal) =>
      total + Math.max(goal.target_pence - goal.contributed_pence, 0),
    0,
  );

  const priorityOrder = { High: 0, Moderate: 1, Low: 2 };

  const highlightedGoals = [...activeGoals]
    .sort(
      (a, b) =>
        priorityOrder[a.priority] - priorityOrder[b.priority] ||
        b.id - a.id,
    )
    .slice(0, 3);

  return (
    <main className="home-page">
      <header>
        <p className="app-name">GoalDash Lite</p>
        <h1>Your financial goals, at a glance</h1>
        <p>See your progress and decide what to work towards next.</p>
      </header>

      {loading && <p role="status">Loading your overview…</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && (
        <>
          <section className="summary-grid" aria-label="Goal totals">
            <div className="summary-card">
              <h2>Active goals</h2>
              <p>{activeGoals.length}</p>
            </div>

            <div className="summary-card">
              <h2>Completed goals</h2>
              <p>{completedCount}</p>
            </div>

            <div className="summary-card">
              <h2>Total contributed</h2>
              <p>{currency.format(totalContributed / 100)}</p>
            </div>

            <div className="summary-card">
              <h2>Remaining to target</h2>
              <p>{currency.format(totalRemaining / 100)}</p>
            </div>
          </section>

          <section className="home-panel">
            <div className="home-panel-heading">
              <h2>Goals to focus on</h2>
              <button
                className="new-goal-button"
                type="button"
                onClick={onViewGoals}
              >
                View all goals
              </button>
            </div>

            {highlightedGoals.length === 0 ? (
              <p>
                {goals.length === 0
                  ? "Create your first goal to start tracking your progress."
                  : "All your goals are complete. Take a moment to celebrate!"}
              </p>
            ) : (
              highlightedGoals.map((goal) => (
                <article className="goal-highlight" key={goal.id}>
                  <div className="goal-highlight-heading">
                    <h3>{goal.name}</h3>
                    <span>{goal.priority} priority</span>
                  </div>

                  <progress
                    aria-label={`${goal.name} progress`}
                    value={goal.contributed_pence}
                    max={goal.target_pence}
                  />

                  <div className="goal-highlight-footer">
                    <span>
                      {currency.format(goal.contributed_pence / 100)} of{" "}
                      {currency.format(goal.target_pence / 100)}
                    </span>

                    <span>
                      {(
                        (goal.contributed_pence / goal.target_pence) *
                        100
                      ).toFixed(0)}
                      % complete
                    </span>
                  </div>
                </article>
              ))
            )}
          </section>

          <CategoryOverview goals={goals} />
        </>
      )}
    </main>
  );
}