import { useState } from "react";
import type { Goal } from "./types";

type CategoryOverviewProps = {
  goals: Goal[];
};

const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

const colours = ["#547a50", "#547b9e", "#b77b42", "#8969a5"];

export default function CategoryOverview({ goals }: CategoryOverviewProps) {
  const [selectedCategory, setSelectedCategory] = useState("");

  const categories = [...new Set(goals.map((goal) => goal.category))]
    .sort()
    .map((name, index) => {
      const categoryGoals = goals.filter((goal) => goal.category === name);

      return {
        name,
        colour: colours[index % colours.length],
        count: categoryGoals.length,
        target: categoryGoals.reduce(
          (total, goal) => total + goal.target_pence,
          0,
        ),
        contributed: categoryGoals.reduce(
          (total, goal) => total + goal.contributed_pence,
          0,
        ),
        remaining: categoryGoals.reduce(
          (total, goal) =>
            total + Math.max(goal.target_pence - goal.contributed_pence, 0),
          0,
        ),
      };
    });

  const totalTarget = categories.reduce(
    (total, category) => total + category.target,
    0,
  );

  const selected =
    categories.find((category) => category.name === selectedCategory) ??
    categories[0];

  let position = 0;

  const segments = categories.map((category) => {
    const start = position;
    position += totalTarget > 0 ? (category.target / totalTarget) * 100 : 0;

    return `${category.colour} ${start}% ${position}%`;
  });

  const chartBackground =
    totalTarget > 0
      ? `conic-gradient(${segments.join(", ")})`
      : "#e8ede5";

  return (
    <section className="home-panel">
      <h2>Goals by category</h2>
      <p className="category-description">
        Share of total target amounts across all goals, including completed
        goals. Select a category to see its details.
      </p>

      {selected ? (
        <div className="category-layout">
          <div>
            <div
              className="category-doughnut"
              style={{ background: chartBackground }}
              aria-hidden="true"
            >
              <div className="category-doughnut-centre">
                <strong>{goals.length}</strong>
                <span>goals</span>
              </div>
            </div>

            <div
              className="category-legend"
              role="group"
              aria-label="Select a goal category"
            >
              {categories.map((category) => (
                <button
                  key={category.name}
                  type="button"
                  aria-pressed={selected.name === category.name}
                  onClick={() => setSelectedCategory(category.name)}
                >
                  <span
                    className="category-dot"
                    style={{ backgroundColor: category.colour }}
                    aria-hidden="true"
                  />
                  {category.name}
                  <span>
                    {((category.target / totalTarget) * 100).toFixed(0)}%
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="category-details" aria-live="polite">
            <h3>{selected.name}</h3>
            <p>
              {selected.count} {selected.count === 1 ? "goal" : "goals"}
            </p>

            <dl>
              <div>
                <dt>Target</dt>
                <dd>{currency.format(selected.target / 100)}</dd>
              </div>

              <div>
                <dt>Contributed</dt>
                <dd>{currency.format(selected.contributed / 100)}</dd>
              </div>

              <div>
                <dt>Remaining</dt>
                <dd>{currency.format(selected.remaining / 100)}</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : (
        <p>Create a goal to see your category breakdown.</p>
      )}
    </section>
  );
}