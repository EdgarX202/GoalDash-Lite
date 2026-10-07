import { useState } from "react";
import GoalsPage from "./GoalsPage";
import HomePage from "./HomePage";
import "./App.css";

export default function App() {
  const [page, setPage] = useState<"home" | "goals">("home");

  return (
    <>
      <nav className="main-navigation" aria-label="Main navigation">
        <span className="navigation-brand">GoalDash Lite</span>

        <div className="navigation-links">
          <button
            type="button"
            aria-pressed={page === "home"}
            onClick={() => setPage("home")}
          >
            Home
          </button>

          <button
            type="button"
            aria-pressed={page === "goals"}
            onClick={() => setPage("goals")}
          >
            Goals
          </button>
        </div>
      </nav>

      {page === "home" ? (
        <HomePage onViewGoals={() => setPage("goals")} />
      ) : (
        <GoalsPage />
      )}
    </>
  );
}