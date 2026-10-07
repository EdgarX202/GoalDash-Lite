import { Link, NavLink, Route, Routes, useNavigate } from "react-router";
import GoalsPage from "./GoalsPage";
import HomePage from "./HomePage";
import "./App.css";

export default function App() {
  const navigate = useNavigate();

  return (
    <>
      <nav className="main-navigation" aria-label="Main navigation">
        <span className="navigation-brand">GoalDash Lite</span>

        <div className="navigation-links">
          <NavLink to="/" end>
            Home
          </NavLink>

          <NavLink to="/goals">
            Goals
          </NavLink>
        </div>
      </nav>

      <Routes>
        <Route
          path="/"
          element={<HomePage onViewGoals={() => navigate("/goals")} />}
        />

        <Route path="/goals" element={<GoalsPage />} />

        <Route
          path="*"
          element={
            <main className="home-page">
              <h1>Page not found</h1>
              <p>This address doesn’t match a page in GoalDash Lite.</p>
              <Link to="/">Return home</Link>
            </main>
          }
        />
      </Routes>
    </>
  );
}