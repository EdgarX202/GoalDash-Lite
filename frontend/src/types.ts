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