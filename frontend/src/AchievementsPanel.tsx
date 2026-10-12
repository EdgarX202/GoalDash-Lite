import { useEffect, useState } from "react";
import { API_BASE_URL } from "./config";
import type { Achievement, Goal } from "./types";

type AchievementsPanelProps = {
  goals: Goal[];
};

export default function AchievementsPanel({
  goals,
}: AchievementsPanelProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAchievements() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/progression/achievements`,
          {
            credentials: "include",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? "Your session has expired. Refresh to sign in again."
              : "Could not load your achievements.",
          );
        }

        const data: Achievement[] = await response.json();

        if (!controller.signal.aborted) {
          setAchievements(data);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(
            error instanceof Error
              ? error.message
              : "Could not load your achievements.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadAchievements();

    return () => controller.abort();
  }, [goals, attempt]);

  const unlockedCount = achievements.filter(
    (achievement) => achievement.unlocked,
  ).length;

  return (
    <section
      className="home-panel achievements-panel"
      aria-labelledby="achievements-title"
    >
      <div className="home-panel-heading">
        <h2 id="achievements-title">Achievements</h2>

        {!loading && !error && (
          <span>
            {unlockedCount} of {achievements.length} unlocked
          </span>
        )}
      </div>

      {loading ? (
        <p role="status">Updating achievements…</p>
      ) : error ? (
        <>
          <p role="alert">{error}</p>
          <button
            className="new-goal-button"
            type="button"
            onClick={() => setAttempt((previous) => previous + 1)}
          >
            Retry
          </button>
        </>
      ) : (
        <div className="achievement-grid">
          {achievements.map((achievement) => (
            <article
              key={achievement.id}
              className={
                achievement.unlocked
                  ? "achievement-card is-unlocked"
                  : "achievement-card"
              }
            >
              <span className="achievement-icon" aria-hidden="true">
                {achievement.unlocked ? "★" : "☆"}
              </span>

              <h3>{achievement.name}</h3>
              <p>{achievement.description}</p>

              <progress
                aria-label={`${achievement.name} progress`}
                value={achievement.progress}
                max={achievement.target}
              />

              <p className="achievement-status">
                {achievement.unlocked
                  ? "Unlocked"
                  : `${achievement.progress} / ${achievement.target} — In progress`}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}