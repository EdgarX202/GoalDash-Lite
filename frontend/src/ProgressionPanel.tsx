import { useEffect, useState } from "react";
import { API_BASE_URL } from "./config";
import type { ProgressionSummary } from "./types";

export default function ProgressionPanel() {
  const [progression, setProgression] =
    useState<ProgressionSummary | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProgression() {
      setError("");

      try {
        const response = await fetch(`${API_BASE_URL}/progression`, {
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? "Your session has expired. Refresh the page to sign in again."
              : "Could not load your progression. Please try again.",
          );
        }

        const data: ProgressionSummary = await response.json();

        if (!controller.signal.aborted) {
          setProgression(data);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(
            error instanceof Error
              ? error.message
              : "Could not load your progression.",
          );
        }
      }
    }

    loadProgression();

    return () => controller.abort();
  }, [attempt]);

  return (
    <section
      className="home-panel progression-panel"
      aria-labelledby="progression-title"
    >
      <h2 id="progression-title">Your journey</h2>

      {error ? (
        <>
          <p role="alert">{error}</p>
          <button
            className="new-goal-button"
            type="button"
            onClick={() => {
              setError("");
              setAttempt((previous) => previous + 1);
            }}
          >
            Retry
          </button>
        </>
      ) : progression === null ? (
        <p role="status">Loading your progression…</p>
      ) : (
        <>
          <div className="progression-heading">
            <span className="level-badge">
              Level {progression.level}
            </span>
            <span>{progression.total_xp} total XP</span>
          </div>

          <div className="progression-labels">
            <span>
              {progression.xp_into_level} / {progression.xp_per_level} XP
            </span>
            <span>
              Next: Level {progression.level + 1}
            </span>
          </div>

          <progress
            aria-label={`Progress towards level ${progression.level + 1}`}
            value={progression.xp_into_level}
            max={progression.xp_per_level}
          />

          <p className="progression-next">
            {progression.xp_to_next_level} XP to your next level.
          </p>

          <p className="progression-explanation">
            Earn 10 XP for each distinct contribution date across your
            goals, plus 50 XP for each completed goal.
          </p>

          <small className="progression-explanation">
            XP reflects your saved records and can change when you edit
            or delete them.
          </small>
        </>
      )}
    </section>
  );
}