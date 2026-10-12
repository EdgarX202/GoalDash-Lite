export type Contribution = {
  id: number;
  amount_pence: number;
  contributed_on: string;
};

export type Goal = {
  id: number;
  name: string;
  category: string;
  target_pence: number;
  contributed_pence: number;
  deadline: string | null;
  priority: "High" | "Moderate" | "Low";
  contributions: Contribution[];
};

export type User = {
  id: number;
  display_name: string;
  email: string;
};

export type ProgressionSummary = {
  total_xp: number;
  level: number;
  xp_into_level: number;
  xp_per_level: number;
  xp_to_next_level: number;
  contribution_dates: number;
  completed_goals: number;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  progress: number;
  target: number;
  unlocked: boolean;
};