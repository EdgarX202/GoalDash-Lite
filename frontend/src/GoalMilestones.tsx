import type { Goal } from "./types";

type GoalMilestonesProps = {
  goal: Goal;
};

const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

const checkpoints = [25, 50, 75, 100];

export default function GoalMilestones({ goal }: GoalMilestonesProps) {
  const milestones = checkpoints.map((percentage) => {
    const targetPence = Math.ceil(
      (goal.target_pence * percentage) / 100,
    );

    return {
      percentage,
      targetPence,
      reached: goal.contributed_pence >= targetPence,
    };
  });

  const nextMilestone = milestones.find(
    (milestone) => !milestone.reached,
  );

  return (
    <div className="goal-milestones">
      <ul
        className="milestone-list"
        aria-label={`${goal.name} milestones`}
      >
        {milestones.map((milestone) => (
          <li
            key={milestone.percentage}
            className={milestone.reached ? "is-reached" : ""}
          >
            <span aria-hidden="true">
              {milestone.reached ? "✓ " : ""}
            </span>

            {milestone.percentage}%

            <span className="visually-hidden">
              {milestone.reached ? " reached" : " not yet reached"}
            </span>
          </li>
        ))}
      </ul>

      <p className="milestone-message">
        {nextMilestone ? (
          <>
            <strong>
              {currency.format(
                (nextMilestone.targetPence - goal.contributed_pence) / 100,
              )}
            </strong>{" "}
            to your next milestone: {nextMilestone.percentage}%.
          </>
        ) : (
          <>All four milestones reached. Goal complete!</>
        )}
      </p>
    </div>
  );
}