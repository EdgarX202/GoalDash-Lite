type HomePageProps = {
  onViewGoals: () => void;
};

export default function HomePage({ onViewGoals }: HomePageProps) {
  return (
    <main className="home-page">
      <header>
        <p className="app-name">GoalDash Lite</p>
        <h1>Your financial goals, at a glance</h1>
        <p>See your progress and decide what to work towards next.</p>
      </header>

      <section className="home-panel">
        <h2>Your progress overview</h2>
        <p>
          Your goal highlights and category breakdown will appear here.
        </p>

        <button
          className="new-goal-button"
          type="button"
          onClick={onViewGoals}
        >
          View my goals
        </button>
      </section>
    </main>
  );
}